"use client";

import { useState, useTransition } from "react";
import {
  reviewRecommendation,
  toggleRecommendationFeatured,
} from "@/actions/recommendation";
import { cn } from "@/lib/utils";

interface RecommendationReviewActionsProps {
  recommendationId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  featured: boolean;
}

export function RecommendationReviewActions({
  recommendationId,
  status,
  featured,
}: RecommendationReviewActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error || "Action failed.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {status !== "APPROVED" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction(() => reviewRecommendation(recommendationId, "APPROVED"))}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            Approve
          </button>
        )}
        {status !== "REJECTED" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction(() => reviewRecommendation(recommendationId, "REJECTED"))}
            className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Reject
          </button>
        )}
        {status !== "PENDING" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction(() => reviewRecommendation(recommendationId, "PENDING"))}
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Reopen
          </button>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            runAction(() => toggleRecommendationFeatured(recommendationId, !featured))
          }
          className={cn(
            "rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50",
            featured
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {featured ? "Featured" : "Feature"}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
