import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { RecommendationForm } from "./recommendation-form";

export default async function RecommendationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const [user, recommendations] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        profile: {
          select: {
            company: true,
            industry: true,
          },
        },
      },
    }),
    db.recommendation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const defaultRole = user?.profile?.company || user?.profile?.industry || "";

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:p-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Recommendations
          </p>
          <h1 className="mt-3 text-3xl font-serif text-foreground sm:text-4xl">
            Share what changed after working with Suits & Stories.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Submit a recommendation for review. Once an admin approves it, it can appear in
            the public recommendations carousel on the marketing site.
          </p>
        </div>

        <RecommendationForm defaultRole={defaultRole} />
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-serif text-foreground">Your submissions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We keep pending items private until review.
          </p>
        </div>

        {recommendations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
            No recommendations submitted yet. The first one gets the ceremonial tiny trumpet.
          </div>
        ) : (
          recommendations.map((recommendation) => (
            <article
              key={recommendation.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <StatusBadge status={recommendation.status} />
                <span className="text-xs text-muted-foreground">
                  {recommendation.stars}.0 stars
                </span>
              </div>
              <p className="line-clamp-5 text-sm leading-6 text-foreground/80">
                {recommendation.text}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Submitted{" "}
                {new Date(recommendation.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </article>
          ))
        )}
      </aside>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-600",
    APPROVED: "bg-emerald-500/10 text-emerald-600",
    REJECTED: "bg-red-500/10 text-red-500",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status.toLowerCase()}
    </span>
  );
}
