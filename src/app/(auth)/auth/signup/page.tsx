"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/actions/auth";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export default function SignUpPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const result = await register({ name, email, password });

            if (result.error) {
                setError(result.error);
            } else {
                router.push("/auth/signin");
            }
        } catch (error) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-md space-y-8 px-4">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight">
                        Create an account
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Join Suits &amp; Stories today
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                className="mt-1"
                                placeholder="Ex. John Doe"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1"
                                placeholder="Ex. you@example.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="mt-1"
                                placeholder="******"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 text-center bg-red-500/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
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
