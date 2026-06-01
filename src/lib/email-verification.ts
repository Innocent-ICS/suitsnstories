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
    return { success: false, error: "Email address is required." };
  }

  if (user.emailVerified) {
    return { success: true, message: "Email is already verified." };
  }

  const token = randomBytes(VERIFICATION_TOKEN_BYTES).toString("base64url");
  const tokenHash = hashEmailVerificationToken(token);
  const email = user.email.trim().toLowerCase();
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

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

  const verifyUrl = `${getAppUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;
  const template = emailVerificationEmail({
    name: user.name || email.split("@")[0] || "there",
    verifyUrl,
  });
  const sent = await sendEmail({ to: email, ...template });

  if (!sent) {
    return { success: false, error: "Could not send verification email. Please try again." };
  }

  return { success: true, message: "Verification email sent." };
}

export async function sendVerificationEmailForAddress(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const neutralMessage = "If an unverified account exists for that email, a new verification link has been sent.";

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
}

export async function verifyEmailToken(token: string) {
  if (!token) {
    return { success: false, error: "Verification link is missing or invalid." };
  }

  const tokenHash = hashEmailVerificationToken(token);
  const verification = await db.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: {
      userId: true,
      email: true,
      expiresAt: true,
    },
  });

  if (!verification) {
    return { success: false, error: "Verification link is invalid or has already been used." };
  }

  if (verification.expiresAt.getTime() < Date.now()) {
    await db.emailVerificationToken.deleteMany({ where: { tokenHash } });
    return { success: false, error: "Verification link has expired. Request a new one to continue." };
  }

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

  return { success: true, message: "Email verified. You can sign in now." };
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}
