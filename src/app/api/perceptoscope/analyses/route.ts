import { after, NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { processPerceptoscopeAnalysis } from "@/lib/perceptoscope/agents";
import { fingerprintBuffer, safeJsonText, validateDeckFile } from "@/lib/perceptoscope/security";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  assertSameOriginRequest,
  getRequestSecurityContext,
} from "@/lib/security/request";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const requestContext = getRequestSecurityContext(req);
  try {
    assertSameOriginRequest(requestContext);
  } catch {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const rateLimit = await checkRateLimit({
      scope: "perceptoscope-upload",
      identifier: userId,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many diagnosis uploads. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        }
      );
    }

    const formData = await req.formData();
    const rawFile = formData.get("file");
    const title = safeJsonText(formData.get("title"), "Pitch diagnosis").slice(0, 160) || "Pitch diagnosis";
    const founderContext = safeJsonText(formData.get("founderContext"), "");
    const projectId = safeJsonText(formData.get("projectId"), "") || null;
    const preferredProvider = safeJsonText(formData.get("provider"), "") || null;

    if (!(rawFile instanceof File)) {
      return NextResponse.json({ error: "Upload a pitch deck file." }, { status: 400 });
    }

    const buffer = Buffer.from(await rawFile.arrayBuffer());
    const uploadedFile = {
      name: rawFile.name,
      type: rawFile.type,
      size: rawFile.size,
      buffer,
    };

    const validation = validateDeckFile(uploadedFile);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    if (projectId) {
      const canUseProject = await userCanUseProject(projectId, userId);
      if (!canUseProject) {
        return NextResponse.json({ error: "Project not found." }, { status: 404 });
      }
    }

    const analysis = await db.perceptoscopeAnalysis.create({
      data: {
        userId,
        projectId,
        title,
        founderContext: founderContext || null,
        fileName: validation.safeName,
        fileMimeType: rawFile.type || "application/octet-stream",
        fileSize: rawFile.size,
        fileFingerprint: fingerprintBuffer(buffer),
        status: "PENDING",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      select: { id: true },
    });

    after(() => {
      void processPerceptoscopeAnalysis({
        analysisId: analysis.id,
        userId,
        file: uploadedFile,
        founderContext,
        preferredProvider,
      });
    });

    return NextResponse.json({ analysisId: analysis.id, status: "PENDING" }, { status: 202 });
  } catch (error) {
    console.error("[PERCEPTOSCOPE_POST]", error);
    return NextResponse.json({ error: "Could not start the Perceptoscope analysis." }, { status: 500 });
  }
}

async function userCanUseProject(projectId: string, userId: string) {
  const [user, project] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
    db.project.findUnique({
      where: { id: projectId },
      select: {
        clientId: true,
        coachId: true,
        collaborators: { where: { userId }, select: { id: true } },
      },
    }),
  ]);

  if (!project) return false;
  return (
    user?.role === "ADMIN" ||
    project.clientId === userId ||
    project.coachId === userId ||
    project.collaborators.length > 0
  );
}
