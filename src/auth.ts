import NextAuth from "next-auth";
import { type DefaultSession } from "next-auth";
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
        emailVerified?: Date | null;
    }
    interface Session {
        user: {
            id?: string;
            role?: string;
        } & DefaultSession["user"]
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    trustHost: true,
    debug: process.env.NODE_ENV === "development",
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt" },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // Allow linking Google accounts to existing email-password users
            allowDangerousEmailAccountLinking: true,
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

                const email = String(credentials.email).trim().toLowerCase();
                const user = await db.user.findFirst({
                    where: {
                        email: { equals: email, mode: "insensitive" },
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
        async signIn({ user, account }) {
            if (account?.provider === "credentials") {
                if (!user.id) return false;

                const dbUser = await db.user.findUnique({
                    where: { id: user.id },
                    select: { emailVerified: true },
                });

                return !!dbUser?.emailVerified;
            }

            if (account?.provider === "google") {
                if (user.id) {
                    await db.user.update({
                        where: { id: user.id },
                        data: { emailVerified: new Date() },
                    }).catch((error) => console.error("[AUTH_GOOGLE_EMAIL_VERIFY]", error));
                } else if (user.email) {
                    await db.user.update({
                        where: { email: user.email },
                        data: { emailVerified: new Date() },
                    }).catch((error) => console.error("[AUTH_GOOGLE_EMAIL_VERIFY]", error));
                }
            }

            return true;
        },
        async jwt({ token, user, trigger, account }) {
            // On sign in (when user object is available)
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            
            // For OAuth providers, fetch user from database if id is not in token
            if (account && !token.id && token.email) {
                const dbUser = await db.user.findUnique({
                    where: { email: token.email },
                    select: { id: true, role: true },
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                }
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
        error: "/auth/error",
    },
    logger: {
        error(error) {
            // Log auth errors server-side so they appear in Vercel function logs
            console.error("[AUTH_ERROR]", {
                message: error.message,
                cause: error.cause,
                name: error.name,
            });
        },
        warn(code) {
            console.warn("[AUTH_WARN]", code);
        },
    },
});
