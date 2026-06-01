import Link from "next/link";

/**
 * Custom auth error page — matches the sign-in page design language.
 *
 * NextAuth redirects here on configuration or provider errors.
 * Error codes arrive via the ?error= query param.
 */
export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const messages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: "Something went wrong",
      description:
        "We couldn\u2019t complete the sign-in. This is usually a temporary issue — please try again. If it persists, reach out to our team.",
    },
    OAuthAccountNotLinked: {
      title: "Email already in use",
      description:
        "This email is linked to a different sign-in method. Try signing in with the method you originally used — either email/password or Google.",
    },
    OAuthCallbackError: {
      title: "Sign-in interrupted",
      description:
        "The sign-in process was interrupted or timed out. Please try again.",
    },
    AccessDenied: {
      title: "Email not verified",
      description:
        "Please verify your email before signing in. Check your inbox for a verification link, or request a new one below.",
    },
  };

  const errorInfo = messages[error || ""] || {
    title: "Sign-in error",
    description: "An unexpected error occurred. Please try again.",
  };

  const isVerificationIssue = error === "AccessDenied";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Brand */}
        <div className="text-center">
          <Link href="/" className="text-xl sm:text-2xl font-serif text-primary">
            Suits &amp; Stories
          </Link>
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {errorInfo.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {errorInfo.description}
          </p>
        </div>

        {/* Error code badge */}
        {error && (
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {error}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isVerificationIssue && (
            <Link
              href="/auth/resend-verification"
              className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 h-11"
            >
              Resend verification email
            </Link>
          )}

          <Link
            href="/auth/signin"
            className={`flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium transition-colors h-11 ${
              isVerificationIssue
                ? "border border-border bg-background text-foreground hover:bg-muted"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isVerificationIssue ? "Back to sign in" : "Try signing in again"}
          </Link>

          {!isVerificationIssue && (
            <Link
              href="/"
              className="flex w-full items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted h-11"
            >
              Back to home
            </Link>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Need help?{" "}
          <Link href="/contact" className="font-medium text-primary hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}

