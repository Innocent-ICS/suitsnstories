"use client";

import { useEffect } from "react";
import { ExclamationTriangleIcon } from "@/components/icons/app-icons";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DASHBOARD_ERROR]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 max-w-md w-full space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-lg font-medium text-foreground">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your dashboard. This is usually temporary — try again in a moment.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
