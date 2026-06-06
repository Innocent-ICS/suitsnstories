import { db } from "@/lib/db";

type InternalGuardrails = {
  securityFlags?: string[];
  privacyNotes?: string[];
};

export default async function PerceptoscopeSecurityPage() {
  const analyses = await db.perceptoscopeAnalysis.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { name: true, email: true } },
      agentRuns: {
        orderBy: { createdAt: "asc" },
        select: {
          kind: true,
          status: true,
          error: true,
          summary: true,
        },
      },
    },
  });

  const flagged = analyses.filter((analysis) => extractGuardrails(analysis.report).securityFlags.length > 0);
  const failed = analyses.filter((analysis) => analysis.status === "FAILED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Perceptoscope Security</h1>
        <p className="mt-1 text-muted-foreground">
          Internal guardrail findings, failed specialist passes, and upload-processing notes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Recent analyses" value={analyses.length} />
        <StatCard label="Flagged" value={flagged.length} accent="amber" />
        <StatCard label="Failed" value={failed.length} accent="red" />
      </div>

      <div className="space-y-3">
        {analyses.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No Perceptoscope analyses yet.</p>
          </div>
        ) : (
          analyses.map((analysis) => {
            const guardrails = extractGuardrails(analysis.report);
            const failedRuns = analysis.agentRuns.filter((run) => run.status === "FAILED");

            return (
              <article key={analysis.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium text-foreground">{analysis.title}</h2>
                      <StatusBadge status={analysis.status} />
                      {analysis.riskLevel && <RiskBadge risk={analysis.riskLevel} />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {analysis.fileName} - {analysis.user.name || analysis.user.email || "Unknown user"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {analysis.createdAt.toLocaleString()}
                    </p>
                  </div>
                  {analysis.score !== null && (
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-semibold text-foreground">{analysis.score}</p>
                      <p className="text-xs text-muted-foreground">score</p>
                    </div>
                  )}
                </div>

                {guardrails.securityFlags.length > 0 && (
                  <section className="mt-4">
                    <h3 className="text-sm font-medium text-foreground">Security flags</h3>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {guardrails.securityFlags.map((flag) => (
                        <li key={flag}>- {flag}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {guardrails.privacyNotes.length > 0 && (
                  <section className="mt-4">
                    <h3 className="text-sm font-medium text-foreground">Privacy notes</h3>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {guardrails.privacyNotes.map((note) => (
                        <li key={note}>- {note}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {failedRuns.length > 0 && (
                  <section className="mt-4">
                    <h3 className="text-sm font-medium text-foreground">Failed agent runs</h3>
                    <div className="mt-2 space-y-2">
                      {failedRuns.map((run) => (
                        <div key={run.kind} className="rounded-lg bg-muted/40 p-3 text-sm">
                          <p className="font-medium text-foreground">{run.kind}</p>
                          <p className="mt-1 text-muted-foreground">{run.error || "No internal error recorded."}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function extractGuardrails(report: unknown): Required<InternalGuardrails> {
  if (!report || typeof report !== "object") return { securityFlags: [], privacyNotes: [] };
  const internal = (report as Record<string, unknown>).internalGuardrails;
  if (!internal || typeof internal !== "object") return { securityFlags: [], privacyNotes: [] };
  const value = internal as InternalGuardrails;
  return {
    securityFlags: Array.isArray(value.securityFlags) ? value.securityFlags.filter(isString) : [],
    privacyNotes: Array.isArray(value.privacyNotes) ? value.privacyNotes.filter(isString) : [],
  };
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  const accentColors: Record<string, string> = {
    amber: "border-amber-500/20",
    red: "border-red-500/20",
    gray: "border-border",
  };

  return (
    <div className={`rounded-xl border bg-card p-4 ${accentColors[accent || "gray"] || "border-border"}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-500/10 text-emerald-600",
    PROCESSING: "bg-blue-500/10 text-blue-600",
    PENDING: "bg-muted text-muted-foreground",
    FAILED: "bg-red-500/10 text-red-600",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {status.toLowerCase()}
    </span>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const styles: Record<string, string> = {
    low: "bg-emerald-500/10 text-emerald-600",
    medium: "bg-amber-500/10 text-amber-600",
    high: "bg-red-500/10 text-red-600",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[risk] || "bg-muted text-muted-foreground"}`}>
      {risk} risk
    </span>
  );
}
