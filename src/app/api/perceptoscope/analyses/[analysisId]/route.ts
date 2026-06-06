import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  publicPerceptoscopeError,
  sanitizeAgentRuns,
  sanitizePerceptoscopeReport,
} from "@/lib/perceptoscope/public-report";

export const runtime = "nodejs";

interface Props {
  params: Promise<{ analysisId: string }>;
}

export async function GET(_req: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { analysisId } = await params;
  const [user, analysis] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
    db.perceptoscopeAnalysis.findUnique({
      where: { id: analysisId },
      include: {
        agentRuns: { orderBy: { createdAt: "asc" } },
      },
    }),
  ]);

  if (!analysis || (analysis.userId !== session.user.id && user?.role !== "ADMIN")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: analysis.id,
    title: analysis.title,
    status: analysis.status,
    score: analysis.score,
    riskLevel: analysis.riskLevel,
    summary: analysis.summary,
    report: sanitizePerceptoscopeReport(analysis.report),
    error: publicPerceptoscopeError(analysis.status, analysis.error),
    fileName: analysis.fileName,
    createdAt: analysis.createdAt.toISOString(),
    completedAt: analysis.completedAt?.toISOString() || null,
    agentRuns: sanitizeAgentRuns(analysis.agentRuns),
  });
}
