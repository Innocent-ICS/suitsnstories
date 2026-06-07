"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
    sendVerificationEmailForAddress,
    sendVerificationEmailForUser,
    verifyEmailToken,
} from "@/lib/email-verification";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
    CsrfError,
    assertSameOriginRequest,
    getServerActionSecurityContext,
} from "@/lib/security/request";

const RegisterSchema = z.object({
    name: z.string().trim().min(1, { message: "Name is required" }),
    email: z.string().trim().toLowerCase().email({ message: "Invalid email address" }),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters" })
        .refine((val) => /[a-z]/.test(val), { message: "Password must include a lowercase letter" })
        .refine((val) => /[A-Z]/.test(val), { message: "Password must include an uppercase letter" })
        .refine((val) => /[0-9]/.test(val), { message: "Password must include a number" })
        .refine((val) => /[^a-zA-Z0-9]/.test(val), { message: "Password must include a special character" }),
});

const ResendVerificationSchema = z.object({
    email: z.string().trim().toLowerCase().email({ message: "Invalid email address" }),
});

export const register = async (values: z.infer<typeof RegisterSchema>) => {
    try {
        const requestContext = await getServerActionSecurityContext();
        assertSameOriginRequest(requestContext);

        const validatedFields = RegisterSchema.safeParse(values);

        if (!validatedFields.success) {
            const messages = validatedFields.error.issues.map((i) => i.message);
            return { error: messages.join(". ") };
        }

        const { email, password, name } = validatedFields.data;
        const rateLimit = await checkRateLimit({
            scope: "auth-register",
            identifier: `${requestContext.ip}:${email.toLowerCase()}`,
            limit: 10,
            windowMs: 60 * 60 * 1000,
        });

        if (!rateLimit.allowed) {
            console.warn("[REGISTER] Rate limited:", { ip: requestContext.ip, email, remaining: rateLimit.remaining, retryAfter: rateLimit.retryAfter });
            return { error: `Too many signup attempts. Please try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.` };
        }

        const existingUser = await db.user.findFirst({
            where: {
                email: { equals: email, mode: "insensitive" },
            },
        });

        if (existingUser) {
            return { error: "Email already in use!" };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
            },
        });

        // Try sending verification email — don't let failure block account creation
        try {
            console.log("[REGISTER] Sending verification email to:", email, "userId:", user.id);
            const verificationResult = await sendVerificationEmailForUser(user);
            console.log("[REGISTER] Verification email result:", JSON.stringify(verificationResult));

            if (!verificationResult.success) {
                console.error("[REGISTER] Verification email failed:", verificationResult.error);
                return {
                    success: "Account created, but we could not send the verification email. Use the resend link to try again.",
                };
            }
        } catch (emailError) {
            console.error("[REGISTER] Verification email error:", emailError);
            return {
                success: "Account created! Visit the resend verification page to get your verification link.",
            };
        }

        return { success: "Account created. Check your email to verify your account before signing in." };
    } catch (error) {
        console.error("[REGISTER]", error);
        if (error instanceof CsrfError) {
            return { error: "This request appears to be from an unauthorized source. Please refresh and try again." };
        }
        return { error: "Registration failed. Please try again." };
    }
};

export const resendVerification = async (values: z.infer<typeof ResendVerificationSchema>) => {
    try {
        const requestContext = await getServerActionSecurityContext();
        assertSameOriginRequest(requestContext);

        const validatedFields = ResendVerificationSchema.safeParse(values);

        if (!validatedFields.success) {
            return { error: "Invalid email address." };
        }

        const { email } = validatedFields.data;
        const rateLimit = await checkRateLimit({
            scope: "auth-resend-verification",
            identifier: `${requestContext.ip}:${email}`,
            limit: 10,
            windowMs: 60 * 60 * 1000,
        });

        if (!rateLimit.allowed) {
            console.warn("[RESEND_VERIFICATION] Rate limited:", { ip: requestContext.ip, email, retryAfter: rateLimit.retryAfter });
            return { error: `Too many verification email requests. Please try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.` };
        }

        console.log("[RESEND_VERIFICATION] Sending verification email for:", email);
        const result = await sendVerificationEmailForAddress(email);
        console.log("[RESEND_VERIFICATION] Result:", JSON.stringify(result));

        if (!result.success) {
            return { error: "error" in result ? result.error : "Could not send verification email." };
        }

        return { success: result.message };
    } catch (error) {
        console.error("[RESEND_VERIFICATION]", error);
        if (error instanceof CsrfError) {
            return { error: "This request appears to be from an unauthorized source. Please refresh and try again." };
        }
        return { error: "Could not send verification email. Please try again." };
    }
};

const VerifyEmailSchema = z.object({
    token: z.string().min(1, { message: "Verification token is required." }),
});

export const verifyEmail = async (values: z.infer<typeof VerifyEmailSchema>) => {
    try {
        const validatedFields = VerifyEmailSchema.safeParse(values);

        if (!validatedFields.success) {
            return { error: "Verification link is missing or invalid." };
        }

        const { token } = validatedFields.data;
        const result = await verifyEmailToken(token);

        if (!result.success) {
            return { error: result.error };
        }

        return { success: result.message };
    } catch (error) {
        console.error("[VERIFY_EMAIL]", error);
        return { error: "Could not verify email. Please try again or request a new link." };
    }
};
