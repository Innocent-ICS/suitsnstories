"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BeakerIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

type AnalysisStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

interface AgentRun {
  id: string;
  kind: string;
  status: AnalysisStatus;
  summary: string | null;
  error: string | null;
  completedAt: string | null;
}

interface AnalysisListItem {
  id: string;
  title: string;
  status: AnalysisStatus;
  score: number | null;
  riskLevel: string | null;
  summary: string | null;
  report: unknown;
  error: string | null;
  fileName: string;
  provider: string | null;
  model: string | null;
  createdAt: string;
  completedAt: string | null;
  agentRuns: AgentRun[];
}

interface ProjectOption {
  id: string;
  title: string;
}

interface ReportFinding {
  area: string;
  severity: "low" | "medium" | "high";
  evidence: string;
  recommendation: string;
  nextStep: string;
}

interface NarratometerReport {
  score: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  strengths: string[];
  attentionAreas: ReportFinding[];
  nextSteps: string[];
  agentSummaries: Record<string, string>;
}

export function NarratometerConsole({
  initialAnalyses,
  projects,
}: {
  initialAnalyses: AnalysisListItem[];
  projects: ProjectOption[];
}) {
  const [analyses, setAnalyses] = useState(initialAnalyses);
  const [activeId, setActiveId] = useState(initialAnalyses[0]?.id || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeAnalysis = useMemo(
    () => analyses.find((analysis) => analysis.id === activeId) || analyses[0] || null,
    [activeId, analyses]
  );
  const activeReport = parseReport(activeAnalysis?.report);

  useEffect(() => {
    if (!activeAnalysis || !["PENDING", "PROCESSING"].includes(activeAnalysis.status)) return;

    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/narratometer/analyses/${activeAnalysis.id}`, { cache: "no-store" });
      if (!response.ok) return;
      const updated = (await response.json()) as AnalysisListItem;
      setAnalyses((current) => upsertAnalysis(current, updated));
    }, 2500);

    return () => window.clearInterval(interval);
  }, [activeAnalysis]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/narratometer/analyses", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error || "Could not start the Narratometer.");
      setSubmitting(false);
      return;
    }

    const payload = (await response.json()) as { analysisId: string };
    const file = formData.get("file") as File | null;
    const title = String(formData.get("title") || "Pitch diagnosis");
    const pending: AnalysisListItem = {
      id: payload.analysisId,
      title,
      status: "PENDING",
      score: null,
      riskLevel: null,
      summary: null,
      report: null,
      error: null,
      fileName: file?.name || "Deck",
      provider: null,
      model: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      agentRuns: [],
    };

    setAnalyses((current) => upsertAnalysis(current, pending));
    setActiveId(payload.analysisId);
    form.reset();
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <BeakerIcon className="h-4 w-4" />
            Narratometer
          </div>
          <h1 className="text-3xl font-serif text-foreground">Pitch Diagnosis</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Analyze story clarity, investor readiness, visual communication, and evidence gaps.
          </p>
        </div>
        {activeAnalysis?.status === "COMPLETED" && (
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Score</p>
            <p className="text-2xl font-semibold text-foreground">{activeAnalysis.score ?? "--"}</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Diagnosis title</label>
                <input
                  name="title"
                  required
                  maxLength={160}
                  placeholder="Seed round deck review"
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Project</label>
                <select
                  name="projectId"
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue=""
                >
                  <option value="">No linked project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Model route</label>
                <select
                  name="provider"
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue=""
                >
                  <option value="">Auto</option>
                  <option value="OPENROUTER">OpenRouter Nemotron VL</option>
                  <option value="GROQ">Groq Llama 4</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Deck file</label>
                <input
                  name="file"
                  type="file"
                  required
                  accept=".pdf,.pptx,.docx,.png,.jpg,.jpeg,.webp,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp,text/plain,text/markdown"
                  className="mt-1.5 w-full rounded-md border border-dashed border-input bg-background px-3 py-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Files up to 60MB are compressed into a lean analysis artifact before OCR/model review.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Founder context</label>
                <textarea
                  name="founderContext"
                  rows={4}
                  maxLength={6000}
                  placeholder="Audience, fundraising stage, target ask, biggest worry..."
                  className="mt-1.5 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={submitting} className="w-full gap-2">
                <DocumentArrowUpIcon className="h-4 w-4" />
                {submitting ? "Starting..." : "Run Narratometer"}
              </Button>
            </form>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-medium text-foreground">Recent diagnoses</h2>
            <div className="space-y-2">
              {analyses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No diagnoses yet.</p>
              ) : (
                analyses.map((analysis) => (
                  <button
                    key={analysis.id}
                    type="button"
                    onClick={() => setActiveId(analysis.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      activeAnalysis?.id === analysis.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{analysis.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{analysis.fileName}</p>
                      </div>
                      <StatusBadge status={analysis.status} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(analysis.createdAt)}</span>
                      {analysis.score !== null && <span>{analysis.score}/100</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>

        <main>
          {!activeAnalysis ? (
            <EmptyState />
          ) : activeAnalysis.status === "FAILED" ? (
            <FailureState analysis={activeAnalysis} />
          ) : activeAnalysis.status === "COMPLETED" && activeReport ? (
            <ReportView analysis={activeAnalysis} report={activeReport} />
          ) : (
            <ProcessingView analysis={activeAnalysis} />
          )}
        </main>
      </div>
    </div>
  );
}

function ReportView({ analysis, report }: { analysis: AnalysisListItem; report: NarratometerReport }) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={analysis.status} />
              <RiskBadge risk={report.riskLevel} />
              {analysis.provider && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {analysis.provider.toLowerCase()}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-serif text-foreground">{analysis.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{report.summary}</p>
          </div>
          <div className="rounded-lg border border-border bg-background px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Narratometer</p>
            <p className="text-3xl font-semibold text-foreground">{report.score}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-medium text-foreground">Areas of attention</h3>
          <div className="space-y-3">
            {report.attentionAreas.map((finding, index) => (
              <div key={`${finding.area}-${index}`} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h4 className="text-base font-medium text-foreground">{finding.area}</h4>
                  <SeverityBadge severity={finding.severity} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Evidence: </span>
                  {finding.evidence}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Recommendation: </span>
                  {finding.recommendation}
                </p>
                <p className="mt-2 text-sm text-primary">{finding.nextStep}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <SparklesIcon className="h-4 w-4 text-primary" />
              Strengths
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {report.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-medium text-foreground">Next steps</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              {report.nextSteps.map((step, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-primary">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ProcessingView({ analysis }: { analysis: AnalysisListItem }) {
  const runs = analysis.agentRuns.length
    ? analysis.agentRuns
    : [
        { id: "pending-extractor", kind: "EXTRACTOR", status: "PENDING" as AnalysisStatus, summary: null, error: null, completedAt: null },
        { id: "pending-narrative", kind: "NARRATIVE", status: "PENDING" as AnalysisStatus, summary: null, error: null, completedAt: null },
        { id: "pending-investor", kind: "INVESTOR_READINESS", status: "PENDING" as AnalysisStatus, summary: null, error: null, completedAt: null },
        { id: "pending-design", kind: "DESIGN_SYSTEM", status: "PENDING" as AnalysisStatus, summary: null, error: null, completedAt: null },
      ];

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <StatusBadge status={analysis.status} />
          <h2 className="mt-3 text-2xl font-serif text-foreground">{analysis.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{analysis.fileName}</p>
        </div>
        <ClockIcon className="h-6 w-6 text-primary" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {runs.map((run) => (
          <div key={run.id} className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{formatAgentKind(run.kind)}</p>
              <StatusBadge status={run.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {run.summary || run.error || "Queued for specialist review."}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FailureState({ analysis }: { analysis: AnalysisListItem }) {
  return (
    <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <ExclamationTriangleIcon className="mb-4 h-7 w-7 text-destructive" />
      <h2 className="text-2xl font-serif text-foreground">{analysis.title}</h2>
      <p className="mt-2 text-sm text-destructive">{analysis.error || "The diagnosis could not be completed."}</p>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <BeakerIcon className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
      <p className="text-muted-foreground">Run a pitch diagnosis to see the report here.</p>
    </section>
  );
}

function StatusBadge({ status }: { status: AnalysisStatus }) {
  const styles: Record<AnalysisStatus, string> = {
    PENDING: "bg-amber-500/10 text-amber-600",
    PROCESSING: "bg-blue-500/10 text-blue-600",
    COMPLETED: "bg-emerald-500/10 text-emerald-600",
    FAILED: "bg-destructive/10 text-destructive",
  };
  const icon = status === "COMPLETED" ? <CheckCircleIcon className="h-3.5 w-3.5" /> : null;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {icon}
      {status.toLowerCase()}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: ReportFinding["severity"] }) {
  const styles = {
    low: "bg-emerald-500/10 text-emerald-600",
    medium: "bg-amber-500/10 text-amber-600",
    high: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${styles[severity]}`}>
      {severity}
    </span>
  );
}

function RiskBadge({ risk }: { risk: NarratometerReport["riskLevel"] }) {
  return <SeverityBadge severity={risk} />;
}

function upsertAnalysis(current: AnalysisListItem[], next: AnalysisListItem) {
  const exists = current.some((analysis) => analysis.id === next.id);
  if (exists) {
    return current.map((analysis) => (analysis.id === next.id ? next : analysis));
  }
  return [next, ...current];
}

function parseReport(value: unknown): NarratometerReport | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<NarratometerReport>;
  if (
    typeof candidate.score !== "number" ||
    typeof candidate.summary !== "string" ||
    !Array.isArray(candidate.attentionAreas) ||
    !Array.isArray(candidate.nextSteps)
  ) {
    return null;
  }
  return candidate as NarratometerReport;
}

function formatAgentKind(kind: string) {
  return kind
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
