const HIDDEN_AGENT_KINDS = new Set(["GUARDRAIL"]);

export function sanitizePerceptoscopeReport(value: unknown) {
  if (!value || typeof value !== "object") return value;
  const report = { ...(value as Record<string, unknown>) };

  // Remove internal/operational fields that should never reach the client
  delete report.guardrails;
  delete report.internalGuardrails;
  delete report.provider;
  delete report.model;
  delete report.generatedAt;

  if (report.agentSummaries && typeof report.agentSummaries === "object") {
    report.agentSummaries = Object.fromEntries(
      Object.entries(report.agentSummaries as Record<string, unknown>).filter(
        ([key]) => !["guardrail", "guardrails", "security"].includes(key.toLowerCase())
      )
    );
  }

  return report;
}

export function publicPerceptoscopeError(status: string, error?: string | null) {
  if (status !== "FAILED") return null;
  if (error && /engine is not configured/i.test(error)) {
    return "The diagnosis engine is not configured. Please contact support.";
  }
  if (error && /File too large|Unsupported file|empty/i.test(error)) return error;
  return "The diagnosis could not be completed. Please try again with a lighter deck export.";
}

export function sanitizeAgentRuns<
  T extends {
    id: string;
    kind: string;
    status: string;
    summary: string | null;
    error: string | null;
    completedAt: Date | string | null;
  },
>(runs: T[]): Array<{
  id: string;
  kind: string;
  status: T["status"];
  summary: string | null;
  error: string | null;
  completedAt: string | null;
}> {
  return runs
    .filter((run) => !HIDDEN_AGENT_KINDS.has(run.kind))
    .map((run) => ({
      id: run.id,
      kind: run.kind,
      status: run.status,
      summary: run.summary,
      error: run.status === "FAILED" ? "This specialist pass could not complete." : null,
      completedAt: run.completedAt instanceof Date ? run.completedAt.toISOString() : run.completedAt,
    }));
}
