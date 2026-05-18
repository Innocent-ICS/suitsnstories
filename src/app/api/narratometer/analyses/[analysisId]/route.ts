import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  publicNarratometerError,
  sanitizeAgentRuns,
  sanitizeNarratometerReport,
} from "@/lib/narratometer/public-report";

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
    db.narratometerAnalysis.findUnique({
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
    report: sanitizeNarratometerReport(analysis.report),
    error: publicNarratometerError(analysis.status, analysis.error),
    fileName: analysis.fileName,
    provider: analysis.provider,
    model: analysis.model,
    createdAt: analysis.createdAt.toISOString(),
    completedAt: analysis.completedAt?.toISOString() || null,
    agentRuns: sanitizeAgentRuns(analysis.agentRuns),
  });
}
