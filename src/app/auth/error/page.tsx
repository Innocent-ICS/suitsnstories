import Link from "next/link";

/**
 * Custom auth error page.
 *
 * NextAuth redirects here on configuration or provider errors.
 * Common error codes (passed via ?error= query param):
 *   - Configuration: server-side config issue (missing env, adapter error)
 *   - OAuthAccountNotLinked: user tried a different provider than the one they signed up with
 *   - OAuthCallbackError: problem during OAuth callback
 *   - Default: generic fallback
 */
export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const messages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: "Server configuration error",
      description:
        "There is a problem with the authentication configuration. Please contact support if this persists.",
    },
    OAuthAccountNotLinked: {
      title: "Account not linked",
      description:
        "This email is already associated with a different sign-in method. Please sign in using your original method (e.g. email/password or Google).",
    },
    OAuthCallbackError: {
      title: "Sign-in failed",
      description:
        "Something went wrong during the sign-in process. Please try again.",
    },
  };

  const errorInfo = messages[error || ""] || {
    title: "Authentication error",
    description: "An unexpected error occurred. Please try signing in again.",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-6 w-6 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {errorInfo.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {errorInfo.description}
          </p>
        </div>

        {error && (
          <p className="text-xs text-muted-foreground">
            Error code: <code className="rounded bg-muted px-1 py-0.5">{error}</code>
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try signing in again
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
