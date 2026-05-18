import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter"

// Define custom types for the session user
declare module "next-auth" {
    interface User {
        id?: string;
        role?: string;
    }
    interface Session {
        user: {
            id?: string;
            role?: string;
        } & DefaultSession["user"]
    }
}

import { type DefaultSession } from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt" },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await db.user.findUnique({
                    where: {
                        email: credentials.email as string,
                    },
                });

                if (!user || !user.password) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            // Refresh role from DB on session update
            if (trigger === "update" && token.id) {
                const dbUser = await db.user.findUnique({
                    where: { id: token.id as string },
                    select: { role: true },
                });
                if (dbUser) token.role = dbUser.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.id) {
                session.user.id = token.id as string;
            }
            if (token.role) {
                session.user.role = token.role as string;
            }
            return session;
        }
    },
    pages: {
        signIn: "/auth/signin",
        // error: '/auth/error', // Error code passed in query string as ?error=
        // verifyRequest: '/auth/verify-request', // (used for check email message)
        // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
    }
});
