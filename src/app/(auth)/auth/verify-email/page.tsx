import Link from "next/link";
import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/lib/email-verification";

type VerifyEmailPageProps = {
    searchParams: Promise<{
        token?: string | string[];
    }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
    const params = await searchParams;
    const token = Array.isArray(params.token) ? params.token[0] : params.token;
    const result = token
        ? await verifyEmailToken(token)
        : { success: false, error: "Verification link is missing or invalid." };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-6 text-center">
                <Link href="/" className="text-xl sm:text-2xl font-serif text-primary">
                    Suits &amp; Stories
                </Link>

                <div className="space-y-3">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        {result.success ? "Email verified" : "Verification issue"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {result.success ? result.message : result.error}
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {result.success ? (
                        <Button asChild className="h-11">
                            <Link href="/auth/signin?verified=1">Sign in</Link>
                        </Button>
                    ) : (
                        <>
                            <Button asChild className="h-11">
                                <Link href="/auth/resend-verification">Request new link</Link>
                            </Button>
                            <Button asChild variant="outline" className="h-11">
                                <Link href="/auth/signin">Back to sign in</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
