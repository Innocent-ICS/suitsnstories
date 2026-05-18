"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";
import { welcomeEmail } from "@/lib/email/templates";

const RegisterSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const register = async (values: z.infer<typeof RegisterSchema>) => {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { email, password, name } = validatedFields.data;

    const existingUser = await db.user.findUnique({
        where: {
            email,
        },
    });

    if (existingUser) {
        return { error: "Email already in use!" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });

    // Send welcome email (non-blocking)
    const template = welcomeEmail(name);
    sendEmail({ to: email, ...template }).catch(console.error);

    return { success: "User created!" };
};
