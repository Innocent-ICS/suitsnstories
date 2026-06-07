import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";
import { emailVerificationEmail } from "@/lib/email/templates";

const VERIFICATION_TOKEN_BYTES = 32;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

type VerificationUser = {
  id: string;
  email: string | null;
  name: string | null;
  emailVerified?: Date | null;
};

export function hashEmailVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function sendVerificationEmailForUser(user: VerificationUser) {
  if (!user.email) {
    console.warn("[EMAIL_VERIFICATION] No email for user:", user.id);
    return { success: false, error: "Email address is required." };
  }

  if (user.emailVerified) {
    console.log("[EMAIL_VERIFICATION] User already verified:", user.id);
    return { success: true, message: "Email is already verified." };
  }

  const token = randomBytes(VERIFICATION_TOKEN_BYTES).toString("base64url");
  const tokenHash = hashEmailVerificationToken(token);
  const email = user.email.trim().toLowerCase();
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  try {
    await db.$transaction([
      db.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
      db.emailVerificationToken.create({
        data: {
          userId: user.id,
          email,
          tokenHash,
          expiresAt,
        },
      }),
    ]);
  } catch (dbError) {
    console.error("[EMAIL_VERIFICATION] Failed to store verification token:", dbError);
    return { success: false, error: "Could not generate verification token. Please try again." };
  }

  const verifyUrl = `${getAppUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;
  const template = emailVerificationEmail({
    name: user.name || email.split("@")[0] || "there",
    verifyUrl,
  });
  console.log("[EMAIL_VERIFICATION] Calling sendEmail to:", email, "from:", process.env.EMAIL_FROM || "(default)");
  const sent = await sendEmail({ to: email, ...template });
  console.log("[EMAIL_VERIFICATION] sendEmail returned:", sent);

  if (!sent) {
    return { success: false, error: "Could not send verification email. Please try again." };
  }

  return { success: true, message: "Verification email sent." };
}

export async function sendVerificationEmailForAddress(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const neutralMessage = "If an unverified account exists for that email, a new verification link has been sent.";

  try {
    const user = await db.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    if (!user) {
      return { success: true, message: neutralMessage };
    }

    if (user.emailVerified) {
      return { success: true, message: "That email is already verified. You can sign in." };
    }

    const result = await sendVerificationEmailForUser(user);
    if (!result.success) return result;

    return { success: true, message: neutralMessage };
  } catch (error) {
    console.error("[EMAIL_VERIFICATION] sendVerificationEmailForAddress error:", error);
    return { success: false, error: "Could not process verification request. Please try again." };
  }
}

export async function verifyEmailToken(token: string) {
  if (!token) {
    return { success: false, error: "Verification link is missing or invalid." };
  }

  try {
    // Normalize: trim whitespace (some email clients add whitespace)
    const normalizedToken = token.trim();
    const tokenHash = hashEmailVerificationToken(normalizedToken);

    console.log("[EMAIL_VERIFICATION] Looking up token hash:", tokenHash.substring(0, 12) + "...");

    const verification = await db.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: {
        userId: true,
        email: true,
        expiresAt: true,
      },
    });

    if (!verification) {
      // Token not found — could be a duplicate request after the token was consumed
      // by a previous deployment's non-idempotent logic, or a genuinely invalid token.
      const tokenCount = await db.emailVerificationToken.count();
      console.error("[EMAIL_VERIFICATION] Token not found. Total tokens in DB:", tokenCount);
      console.error("[EMAIL_VERIFICATION] Token length:", normalizedToken.length, "Token preview:", normalizedToken.substring(0, 8) + "...");
      return { success: false, error: "Verification link is invalid or has already been used." };
    }

    if (verification.expiresAt.getTime() < Date.now()) {
      await db.emailVerificationToken.deleteMany({ where: { tokenHash } });
      return { success: false, error: "Verification link has expired. Request a new one to continue." };
    }

    // Check if the user is already verified (idempotent: duplicate requests get success)
    const user = await db.user.findUnique({
      where: { id: verification.userId },
      select: { emailVerified: true },
    });

    if (user?.emailVerified) {
      console.log("[EMAIL_VERIFICATION] User already verified (idempotent success):", verification.userId);
      // Clean up the token now that we know the user is verified
      await db.emailVerificationToken.deleteMany({ where: { userId: verification.userId } }).catch(() => {});
      return { success: true, message: "Email verified. You can sign in now." };
    }

    // First-time verification: mark user as verified, then delete tokens
    await db.$transaction([
      db.user.update({
        where: { id: verification.userId },
        data: {
          email: verification.email,
          emailVerified: new Date(),
        },
      }),
      db.emailVerificationToken.deleteMany({ where: { userId: verification.userId } }),
    ]);

    console.log("[EMAIL_VERIFICATION] ✅ Email verified for user:", verification.userId);
    return { success: true, message: "Email verified. You can sign in now." };
  } catch (error) {
    console.error("[EMAIL_VERIFICATION] verifyEmailToken error:", error);
    return { success: false, error: "Could not verify email. Please try again or request a new link." };
  }
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

