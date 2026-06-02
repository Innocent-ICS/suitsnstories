"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowPathIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { FloatingParticles } from "@/components/ui/floating-particles";

export default function SignInPage() {
    return (
        <Suspense fallback={<SignInShell />}>
            <SignInForm />
        </Suspense>
    );
}

function SignInForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    const verified = searchParams.get("verified") === "1";
    const [error, setError] = useState<string | null>(null);
    const [needsVerification, setNeedsVerification] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setNeedsVerification(false);

        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                const unverified = result.error === "AccessDenied";
                setNeedsVerification(unverified);
                setError(unverified ? "Please verify your email before signing in." : "Invalid email or password");
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSignIn() {
        setGoogleLoading(true);
        await signIn("google", { callbackUrl });
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
            <FloatingParticles />
            
            <div className="relative z-10 w-full max-w-md bg-card/60 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl shadow-muted/30 p-6 sm:p-10 space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center">
                    <Link href="/" className="text-xl sm:text-2xl font-serif text-primary hover:opacity-85 transition-opacity">
                        Suits &amp; Stories
                    </Link>
                    <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold tracking-tight">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Sign in to your account
                    </p>
                </div>

                {/* Google Sign In */}
                <Button
                    variant="outline"
                    className="w-full h-11 text-sm font-medium hover:bg-muted/50 transition-colors"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                >
                    {googleLoading ? (
                        <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <svg className="mr-2 h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                    )}
                    <span className="truncate">Continue with Google</span>
                </Button>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/80" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card/10 backdrop-blur-md px-3 py-1 rounded-full border border-border/60 text-[10px] font-semibold text-muted-foreground">
                            Or continue with email
                        </span>
                    </div>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 h-11 bg-background/50 border-border/60 focus:bg-background transition-all"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-xs text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative mt-1">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    className="h-11 pr-10 bg-background/50 border-border/60 focus:bg-background transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors p-1"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-4 w-4" />
                                    ) : (
                                        <EyeIcon className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            {error}
                            {needsVerification && (
                                <div className="mt-2">
                                    <Link href="/auth/resend-verification" className="font-medium text-primary hover:underline">
                                        Resend verification email
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {verified && !error && (
                        <div className="text-sm text-emerald-600 text-center bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                            Email verified. You can sign in now.
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-11 hover:scale-[1.01] active:scale-[0.99] transition-transform"
                        disabled={loading}
                    >
                        {loading ? <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Sign in
                    </Button>

                    <p className="text-center text-sm text-muted-foreground pt-2">
                        Don&apos;t have an account?{" "}
                        <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

function SignInShell() {
    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
            <FloatingParticles />
            <div className="relative z-10 w-full max-w-md bg-card/60 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl shadow-muted/30 p-6 sm:p-10 space-y-6 sm:space-y-8 text-center animate-pulse">
                <Link href="/" className="text-xl sm:text-2xl font-serif text-primary">
                    Suits &amp; Stories
                </Link>
                <div className="space-y-3">
                    <div className="h-8 bg-muted/40 rounded w-3/4 mx-auto animate-pulse" />
                    <div className="h-4 bg-muted/40 rounded w-1/2 mx-auto animate-pulse" />
                </div>
                <div className="space-y-4 pt-4">
                    <div className="h-11 bg-muted/40 rounded animate-pulse" />
                    <div className="h-4 bg-muted/40 rounded w-1/4 mx-auto animate-pulse" />
                    <div className="h-11 bg-muted/40 rounded animate-pulse" />
                    <div className="h-11 bg-muted/40 rounded animate-pulse" />
                </div>
            </div>
        </div>
    );
}
