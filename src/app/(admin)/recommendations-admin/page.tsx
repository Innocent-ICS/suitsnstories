import { db } from "@/lib/db";
import Image from "next/image";
import { RecommendationReviewActions } from "./recommendation-review-actions";

export default async function RecommendationsAdminPage() {
  const recommendations = await db.recommendation.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const counts = {
    total: recommendations.length,
    pending: recommendations.filter((item) => item.status === "PENDING").length,
    approved: recommendations.filter((item) => item.status === "APPROVED").length,
    rejected: recommendations.filter((item) => item.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Recommendations</h1>
        <p className="mt-1 text-muted-foreground">
          Review client recommendations before they appear on the marketing site.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={counts.total} />
        <StatCard label="Pending" value={counts.pending} accent="amber" />
        <StatCard label="Approved" value={counts.approved} accent="green" />
        <StatCard label="Rejected" value={counts.rejected} accent="red" />
      </div>

      <div className="space-y-3">
        {recommendations.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No recommendations have been submitted yet.</p>
          </div>
        ) : (
          recommendations.map((recommendation) => (
            <article
              key={recommendation.id}
              className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={recommendation.status} />
                    {recommendation.featured && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        featured
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {recommendation.stars}.0 stars
                    </span>
                  </div>

                  <blockquote className="text-sm leading-6 text-foreground/85">
                    &ldquo;{recommendation.text}&rdquo;
                  </blockquote>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {recommendation.user.image ? (
                      <Image
                        src={recommendation.user.image}
                        alt=""
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(recommendation.user.name || recommendation.user.email)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        {recommendation.user.name || "Unnamed client"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {recommendation.role || recommendation.user.email || "No display role"}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Submitted{" "}
                    {new Date(recommendation.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <RecommendationReviewActions
                  recommendationId={recommendation.id}
                  status={recommendation.status}
                  featured={recommendation.featured}
                />
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  const accentColors: Record<string, string> = {
    amber: "border-amber-500/20",
    green: "border-emerald-500/20",
    red: "border-red-500/20",
    gray: "border-border",
  };

  return (
    <div className={`rounded-xl border bg-card p-4 ${accentColors[accent || "gray"]}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
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

function getInitials(value?: string | null) {
  if (!value) return "SS";

  return value
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
