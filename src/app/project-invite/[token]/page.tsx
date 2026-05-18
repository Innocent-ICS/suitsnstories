import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { acceptProjectInvitationToken } from "@/actions/project";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ProjectInvitePage({ params }: Props) {
  const { token } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/project-invite/${token}`)}`);
  }

  const result = await acceptProjectInvitationToken(token);

  if (result.success && result.projectId) {
    redirect(`/projects/${result.projectId}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <h1 className="text-2xl font-serif text-foreground">Invitation unavailable</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {result.error || "This invitation cannot be accepted."}
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Go to dashboard
        </Link>
      </section>
    </main>
  );
}
