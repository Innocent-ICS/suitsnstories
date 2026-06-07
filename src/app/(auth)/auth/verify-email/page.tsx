"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/actions/auth";
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { FloatingParticles } from "@/components/ui/floating-particles";

type VerifyState = "pending" | "verifying" | "success" | "error" | "no-token";

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 overflow-hidden">
                <FloatingParticles />
                <div className="relative z-10 w-full max-w-md bg-card/60 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl shadow-muted/30 p-6 sm:p-10 text-center animate-pulse">
                    <Link href="/" className="text-xl sm:text-2xl font-serif text-primary">Suits &amp; Stories</Link>
                    <div className="mt-6 space-y-3">
                        <div className="h-8 bg-muted/40 rounded w-3/4 mx-auto" />
                        <div className="h-4 bg-muted/40 rounded w-1/2 mx-auto" />
                    </div>
                </div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [state, setState] = useState<VerifyState>(token ? "pending" : "no-token");
    const [message, setMessage] = useState("");
    const verifyCalledRef = useRef(false);

    // Auto-verify when token is present (user clicked the link)
    useEffect(() => {
        if (!token) return;
        // Guard: only call verifyEmail once (prevents React StrictMode double-fire)
        if (verifyCalledRef.current) return;
        verifyCalledRef.current = true;

        async function verify() {
            setState("verifying");

            const result = await verifyEmail({ token: token! });

            if (result.error) {
                setState("error");
                setMessage(result.error);
            } else {
                setState("success");
                setMessage(result.success || "Email verified successfully.");
            }
        }

        verify();
    }, [token]);

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
            <FloatingParticles />

            <div className="relative z-10 w-full max-w-md bg-card/60 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl shadow-muted/30 p-6 sm:p-10 space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center">
                    <Link href="/" className="text-xl sm:text-2xl font-serif text-primary hover:opacity-85 transition-opacity">
                        Suits &amp; Stories
                    </Link>
                </div>

                {/* Verifying state */}
                {state === "verifying" && (
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <ArrowPathIcon className="h-12 w-12 text-primary animate-spin" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Verifying your email
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Please wait a moment...
                        </p>
                    </div>
                )}

                {/* Pending state (shouldn't really show, since we auto-verify) */}
                {state === "pending" && (
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <EnvelopeIcon className="h-12 w-12 text-primary" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Verify your email
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Click below to confirm your email address.
                        </p>
                    </div>
                )}

                {/* Success state */}
                {state === "success" && (
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <CheckCircleIcon className="h-12 w-12 text-emerald-500" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Email verified
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {message}
                        </p>
                        <Button asChild className="w-full h-11">
                            <Link href="/auth/signin?verified=1">Sign in</Link>
                        </Button>
                    </div>
                )}

                {/* Error state */}
                {state === "error" && (
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <ExclamationTriangleIcon className="h-12 w-12 text-amber-500" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Verification issue
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {message}
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button asChild className="h-11">
                                <Link href="/auth/resend-verification">Request new link</Link>
                            </Button>
                            <Button asChild variant="outline" className="h-11">
                                <Link href="/auth/signin">Back to sign in</Link>
                            </Button>
                        </div>
                    </div>
                )}

                {/* No token state */}
                {state === "no-token" && (
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <ExclamationTriangleIcon className="h-12 w-12 text-amber-500" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Missing verification link
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            This page requires a valid verification link from your email.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button asChild className="h-11">
                                <Link href="/auth/resend-verification">Request new link</Link>
                            </Button>
                            <Button asChild variant="outline" className="h-11">
                                <Link href="/auth/signin">Back to sign in</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
