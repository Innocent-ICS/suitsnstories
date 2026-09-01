
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitContactInquiry } from "@/actions/contact";
import { ArrowPathIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export function ContactForm({ onCancel }: { onCancel?: () => void }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            company: formData.get("company") as string,
            message: formData.get("message") as string,
        };

        try {
            const result = await submitContactInquiry(data);

            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.error || "Something went wrong. Please try again.");
            }
        } catch {
            setError("Failed to submit inquiry. Please try again later.");
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="w-full max-w-lg mx-auto p-8 border border-border rounded-lg bg-card shadow-sm text-center animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-4">
                    <CheckCircleIcon className="h-16 w-16 text-green-500" />
                </div>
                <h3 className="text-2xl font-serif text-foreground mb-2">Message Sent</h3>
                <p className="text-muted-foreground mb-6">
                    Thank you for reaching out. We&apos;ll be in touch shortly.
                </p>
                <Button
                    onClick={onCancel}
                    variant="outline"
                    className="w-full"
                >
                    Close
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto p-6 md:p-8 border border-border rounded-lg bg-card shadow-sm text-left animate-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-2xl font-serif font-medium text-foreground mb-6">Start a Conversation</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">Name</Label>
                    <Input
                        id="name"
                        name="name"
                        required
                        placeholder="Your name"
                        className="bg-background"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="you@company.com"
                        className="bg-background"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="company" className="text-foreground">Company (Optional)</Label>
                    <Input
                        id="company"
                        name="company"
                        placeholder="Your company"
                        className="bg-background"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message" className="text-foreground">Message</Label>
                    <Textarea
                        id="message"
                        name="message"
                        required
                        placeholder="How can we help you?"
                        rows={4}
                        className="bg-background resize-none"
                    />
                </div>

                {error && (
                    <div className="text-destructive text-sm bg-destructive/10 p-3 rounded border border-destructive/20">
                        {error}
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <Button
                        type="submit"
                        className="flex-1"
                        disabled={loading}
                    >
                        {loading ? <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Send Message
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="bg-background"
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
