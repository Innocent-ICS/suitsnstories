"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resendVerification } from "@/actions/auth";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export default function ResendVerificationPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;

        try {
            const result = await resendVerification({ email });

            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(result.success || "Check your inbox for a new verification link.");
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-6 sm:space-y-8">
                <div className="text-center">
                    <Link href="/" className="text-xl sm:text-2xl font-serif text-primary">
                        Suits &amp; Stories
                    </Link>
                    <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold tracking-tight">
                        Verify your email
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Request a fresh verification link
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <Label htmlFor="email" className="text-sm sm:text-base">Email address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="mt-1 h-11"
                            placeholder="you@example.com"
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 text-center bg-red-500/10 p-3 rounded">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="text-sm text-emerald-600 text-center bg-emerald-500/10 p-3 rounded">
                            {success}
                        </div>
                    )}

                    <Button type="submit" className="w-full h-11" disabled={loading}>
                        {loading ? <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Send verification link
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        Already verified?{" "}
                        <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
