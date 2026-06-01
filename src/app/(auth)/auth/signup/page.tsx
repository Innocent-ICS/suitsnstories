"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrength } from "@/components/ui/password-strength";
import { register } from "@/actions/auth";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export default function SignUpPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData(event.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const result = await register({ name, email, password });

            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(result.success || "Check your email to verify your account.");
                form.reset();
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
                        Create an account
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Join Suits &amp; Stories today
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name" className="text-sm sm:text-base">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                className="mt-1 h-11"
                                placeholder="Ex. John Doe"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email" className="text-sm sm:text-base">Email address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 h-11"
                                placeholder="Ex. you@example.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="mt-1 h-11"
                                placeholder="******"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <div className="mt-2">
                                <PasswordStrength password={password} />
                            </div>
                        </div>
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

                    <Button
                        type="submit"
                        className="w-full h-11"
                        disabled={loading}
                    >
                        {loading ? <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Sign up
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
