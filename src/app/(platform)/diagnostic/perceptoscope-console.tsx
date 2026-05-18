"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { StethoscopeIcon } from "@/components/icons/stethoscope-icon";

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

interface PerceptoscopeReport {
  score: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  strengths: string[];
  attentionAreas: ReportFinding[];
  nextSteps: string[];
  agentSummaries: Record<string, string>;
}

export function PerceptoscopeConsole({
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
      const response = await fetch(`/api/perceptoscope/analyses/${activeAnalysis.id}`, { cache: "no-store" });
      if (!response.ok) return;
      const updated = (await response.json()) as AnalysisListItem;
      setAnalyses((current) => upsertAnalysis(current, updated));
    }, 2500);

    return () => window.clearInterval(interval);
  }, [activeAnalysis]);

  /** Vercel serverless body limit — files under this can use the direct FormData fallback */
  const DIRECT_UPLOAD_LIMIT = 4.5 * 1024 * 1024;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file") as File | null;
    const title = String(formData.get("title") || "Pitch diagnosis");

    if (!file || file.size === 0) {
      setError("Please select a file to upload.");
      setSubmitting(false);
      return;
    }

    try {
      let analysisResponse: Response;

      // Try the storage upload path first
      const storageResult = await tryStorageUpload(file, title, formData);

      if (storageResult.ok) {
        analysisResponse = storageResult.response;
      } else if (storageResult.fallback && file.size < DIRECT_UPLOAD_LIMIT) {
        // Storage unavailable but file is small — use direct FormData upload
        analysisResponse = await fetch("/api/perceptoscope/analyses", {
          method: "POST",
          body: formData,
        });
      } else {
        // Storage failed and file too large for fallback
        setError(
          file.size >= DIRECT_UPLOAD_LIMIT
            ? "This file is too large for direct upload. Please try a smaller file (under 4.5MB) or contact support."
            : storageResult.error || "Could not upload the file."
        );
        setSubmitting(false);
        return;
      }

      if (!analysisResponse.ok) {
        const payload = (await analysisResponse.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error || "Could not start the Perceptoscope.");
        setSubmitting(false);
        return;
      }

      const payload = (await analysisResponse.json()) as { analysisId: string };
      const pending: AnalysisListItem = {
        id: payload.analysisId,
        title,
        status: "PENDING",
        score: null,
        riskLevel: null,
        summary: null,
        report: null,
        error: null,
        fileName: file.name,
        provider: null,
        model: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
        agentRuns: [],
      };

      setAnalyses((current) => upsertAnalysis(current, pending));
      setActiveId(payload.analysisId);
      form.reset();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /** Try the 3-step storage upload. Returns { ok, response } or { fallback: true } if storage is unavailable. */
  async function tryStorageUpload(
    file: File,
    title: string,
    formData: FormData
  ): Promise<{ ok: true; response: Response } | { ok: false; fallback: boolean; error?: string }> {
    const urlResponse = await fetch("/api/perceptoscope/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
    });

    // Any upload-url failure triggers fallback for small files
    if (!urlResponse.ok) {
      return { ok: false, fallback: true };
    }

    const { signedUrl, storagePath } = (await urlResponse.json()) as {
      signedUrl: string;
      storagePath: string;
      token: string;
    };

    const uploadResponse = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" },
      body: file,
    });

    if (!uploadResponse.ok) {
      return { ok: false, fallback: false, error: "File upload to storage failed." };
    }

    const analysisResponse = await fetch("/api/perceptoscope/analyses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storagePath,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        title,
        founderContext: String(formData.get("founderContext") || ""),
        projectId: String(formData.get("projectId") || ""),
        provider: String(formData.get("provider") || ""),
      }),
    });

    return { ok: true, response: analysisResponse };
  }


  return (
    <div className="space-y-6">
      {/* Header — Principle I: Hierarchy Before Decoration */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-primary">
            Perceptoscope
          </p>
          <h1 className="text-[26px] font-medium text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
            Pitch Diagnosis
          </h1>
          <p className="mt-1 max-w-2xl text-[13px]" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>
            Analyze story clarity, investor readiness, visual communication, and evidence gaps.
          </p>
        </div>
        {activeAnalysis?.status === "COMPLETED" && (
          <div
            className="rounded-lg px-4 py-3 text-right"
            style={{ border: "0.5px solid var(--border-whisper)", backgroundColor: "var(--surface-1)" }}
          >
            <p className="text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>Score</p>
            <p className="text-2xl font-semibold text-foreground">{activeAnalysis.score ?? "--"}</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left panel — Form + History */}
        <aside className="space-y-4">
          <section
            className="rounded-xl p-5"
            style={{ border: "0.5px solid var(--border-whisper)", backgroundColor: "var(--surface-1)" }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Principle VII: Typography as Architecture — 12px labels at 50% opacity */}
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--foreground)", opacity: 0.5 }}>
                  Diagnosis title
                </label>
                <input
                  name="title"
                  required
                  maxLength={160}
                  placeholder="Seed round deck review"
                  className="mt-1.5 w-full rounded-md px-3 py-2 text-[13px] outline-none"
                  style={{
                    border: "0.5px solid var(--border-subtle)",
                    backgroundColor: "var(--surface-overlay)",
                    color: "var(--foreground)",
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: "var(--foreground)", opacity: 0.5 }}>
                  Project
                </label>
                <select
                  name="projectId"
                  className="mt-1.5 w-full rounded-md px-3 py-2 text-[13px] outline-none"
                  style={{
                    border: "0.5px solid var(--border-subtle)",
                    backgroundColor: "var(--surface-overlay)",
                    color: "var(--foreground)",
                  }}
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

              {/* Principle VI: Affordances Made Visible — pill badges instead of dropdown */}
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--foreground)", opacity: 0.5 }}>
                  Model route
                </label>
                <select
                  name="provider"
                  className="mt-1.5 w-full rounded-md px-3 py-2 text-[13px] outline-none"
                  style={{
                    border: "0.5px solid var(--border-subtle)",
                    backgroundColor: "var(--surface-overlay)",
                    color: "var(--foreground)",
                  }}
                  defaultValue=""
                >
                  <option value="">Auto</option>
                  <option value="OPENROUTER">OpenRouter Nemotron VL</option>
                  <option value="GROQ">Groq Llama 4</option>
                </select>
              </div>

              {/* Principle VI: File zone — dashed border + icon = affordance chorus */}
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--foreground)", opacity: 0.5 }}>
                  Deck file
                </label>
                <input
                  name="file"
                  type="file"
                  required
                  accept=".pdf,.pptx,.docx,.png,.jpg,.jpeg,.webp,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp,text/plain,text/markdown"
                  className="mt-1.5 w-full rounded-md px-3 py-3 text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
                  style={{
                    border: "1px dashed color-mix(in srgb, var(--primary) 25%, var(--border-subtle))",
                    backgroundColor: "var(--surface-overlay)",
                    color: "var(--foreground)",
                  }}
                />
                <p className="mt-1.5 text-[11px]" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
                  Files up to 20MB are compressed into a lean analysis artifact before OCR/model review.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: "var(--foreground)", opacity: 0.5 }}>
                  Founder context
                </label>
                <textarea
                  name="founderContext"
                  rows={3}
                  maxLength={6000}
                  placeholder="Audience, fundraising stage, target ask, biggest worry..."
                  className="mt-1.5 w-full resize-none rounded-md px-3 py-2 text-[13px] outline-none"
                  style={{
                    border: "0.5px solid var(--border-subtle)",
                    backgroundColor: "var(--surface-overlay)",
                    color: "var(--foreground)",
                  }}
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                  {error}
                </p>
              )}

              {/* Principle VI: Run button — only solid-filled element = unmistakable primary action */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full gap-2"
                style={{
                  background: submitting ? undefined : "linear-gradient(135deg, #9333ea, #7c3aed)",
                  transition: "opacity 0.15s ease, transform 0.1s ease",
                }}
              >
                <DocumentArrowUpIcon className="h-4 w-4" />
                {submitting ? "Starting..." : "Run Perceptoscope"}
              </Button>
            </form>
          </section>

          {/* Recent diagnoses list */}
          <section
            className="rounded-xl p-4"
            style={{ border: "0.5px solid var(--border-whisper)", backgroundColor: "var(--surface-1)" }}
          >
            <h2 className="mb-3 text-xs font-medium" style={{ color: "var(--foreground)", opacity: 0.5 }}>
              Recent diagnoses
            </h2>
            <div className="space-y-1.5">
              {analyses.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No diagnoses yet.</p>
              ) : (
                analyses.map((analysis) => (
                  <button
                    key={analysis.id}
                    type="button"
                    onClick={() => setActiveId(analysis.id)}
                    className="w-full rounded-lg p-3 text-left transition-colors"
                    style={{
                      border: activeAnalysis?.id === analysis.id
                        ? "0.5px solid color-mix(in srgb, var(--primary) 30%, transparent)"
                        : "0.5px solid var(--border-whisper)",
                      backgroundColor: activeAnalysis?.id === analysis.id
                        ? "color-mix(in srgb, var(--primary) 5%, transparent)"
                        : "transparent",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-foreground">{analysis.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{analysis.fileName}</p>
                      </div>
                      <StatusBadge status={analysis.status} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{formatDate(analysis.createdAt)}</span>
                      {analysis.score !== null && <span>{analysis.score}/100</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>

        {/* Right panel — Report or Empty State */}
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

function ReportView({ analysis, report }: { analysis: AnalysisListItem; report: PerceptoscopeReport }) {
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
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Perceptoscope</p>
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
  const dimensions = [
    { label: "Story clarity", width: "45%" },
    { label: "Investor readiness", width: "35%" },
    { label: "Visual communication", width: "55%" },
    { label: "Evidence gaps", width: "25%" },
  ];

  return (
    <section
      className="flex flex-col items-center rounded-xl p-10"
      style={{ border: "0.5px solid var(--border-whisper)", backgroundColor: "var(--surface-1)" }}
    >
      {/* Orbit animation — Principle V & VIII: system readiness, purposeful motion */}
      <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "1px dashed var(--border-subtle)",
            animation: "orbit-slow 8s linear infinite",
          }}
        />
        <div
          className="absolute inset-3 rounded-full"
          style={{
            border: "1px dashed color-mix(in srgb, var(--primary) 20%, var(--border-subtle))",
            animation: "orbit-fast 5s linear infinite reverse",
          }}
        />
        <StethoscopeIcon className="h-8 w-8 text-primary opacity-60" />
      </div>

      <p className="mb-1 text-[13px] font-medium text-foreground">Ready to diagnose</p>
      <p className="mb-8 text-[12px]" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
        Upload a pitch deck to see the report here.
      </p>

      {/* Dimension stubs — Principle V: show the container before the content */}
      <div className="w-full max-w-xs space-y-3">
        {dimensions.map((dim) => (
          <div key={dim.label} className="flex items-center gap-3">
            <span className="w-36 text-[11px] font-medium" style={{ color: "var(--muted-foreground)", opacity: 0.4 }}>
              {dim.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--surface-2)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: dim.width,
                  backgroundColor: "color-mix(in srgb, var(--primary) 15%, var(--surface-2))",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Orbit keyframes injected via style tag */}
      <style>{`
        @keyframes orbit-slow { to { transform: rotate(360deg); } }
        @keyframes orbit-fast { to { transform: rotate(360deg); } }
      `}</style>
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

function RiskBadge({ risk }: { risk: PerceptoscopeReport["riskLevel"] }) {
  return <SeverityBadge severity={risk} />;
}

function upsertAnalysis(current: AnalysisListItem[], next: AnalysisListItem) {
  const exists = current.some((analysis) => analysis.id === next.id);
  if (exists) {
    return current.map((analysis) => (analysis.id === next.id ? next : analysis));
  }
  return [next, ...current];
}

function parseReport(value: unknown): PerceptoscopeReport | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<PerceptoscopeReport>;
  if (
    typeof candidate.score !== "number" ||
    typeof candidate.summary !== "string" ||
    !Array.isArray(candidate.attentionAreas) ||
    !Array.isArray(candidate.nextSteps)
  ) {
    return null;
  }
  return candidate as PerceptoscopeReport;
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
