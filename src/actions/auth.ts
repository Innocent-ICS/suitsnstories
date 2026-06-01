"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
    sendVerificationEmailForAddress,
    sendVerificationEmailForUser,
} from "@/lib/email-verification";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
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
        limit: 5,
        windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
        return { error: "Too many signup attempts. Please try again shortly." };
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

    const verificationResult = await sendVerificationEmailForUser(user);

    if (!verificationResult.success) {
        return {
            success: "Account created, but we could not send the verification email. Use the resend link to try again.",
        };
    }

    return { success: "Account created. Check your email to verify your account before signing in." };
};

export const resendVerification = async (values: z.infer<typeof ResendVerificationSchema>) => {
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
        limit: 5,
        windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
        return { error: "Too many verification email requests. Please try again shortly." };
    }

    const result = await sendVerificationEmailForAddress(email);

    if (!result.success) {
        return { error: result.error };
    }

    return { success: result.message };
};
