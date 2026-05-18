import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PerceptoscopeConsole } from "./perceptoscope-console";
import {
  publicPerceptoscopeError,
  sanitizeAgentRuns,
  sanitizePerceptoscopeReport,
} from "@/lib/perceptoscope/public-report";

export default async function PlatformDiagnosticPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const [analyses, projects] = await Promise.all([
    db.perceptoscopeAnalysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        status: true,
        score: true,
        riskLevel: true,
        summary: true,
        report: true,
        error: true,
        fileName: true,
        provider: true,
        model: true,
        createdAt: true,
        completedAt: true,
        agentRuns: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            kind: true,
            status: true,
            summary: true,
            error: true,
            completedAt: true,
          },
        },
      },
    }),
    db.project.findMany({
      where: {
        OR: [
          { clientId: session.user.id },
          { coachId: session.user.id },
          { collaborators: { some: { userId: session.user.id } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: { id: true, title: true },
    }),
  ]);

  return (
    <PerceptoscopeConsole
      initialAnalyses={analyses.map((analysis) => ({
        ...analysis,
        createdAt: analysis.createdAt.toISOString(),
        completedAt: analysis.completedAt?.toISOString() || null,
        report: sanitizePerceptoscopeReport(analysis.report),
        error: publicPerceptoscopeError(analysis.status, analysis.error),
        agentRuns: sanitizeAgentRuns(analysis.agentRuns),
      }))}
      projects={projects}
    />
  );
}
