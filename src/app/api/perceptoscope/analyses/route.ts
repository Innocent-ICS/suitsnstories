import { after, NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";
import { processPerceptoscopeAnalysis } from "@/lib/perceptoscope/agents";
import { fingerprintBuffer, safeJsonText, validateDeckFile } from "@/lib/perceptoscope/security";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  assertSameOriginRequest,
  getRequestSecurityContext,
} from "@/lib/security/request";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Accepts two content types:
 * 1. JSON — { storagePath, fileName, fileType, fileSize, ... }  (storage upload path)
 * 2. FormData — file + title + founderContext + ...             (direct in-memory fallback)
 *
 * The client tries (1) first. If storage is unavailable and the file
 * is small enough (<4.5MB), it falls back to (2).
 */
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
      scope: "perceptoscope-analysis",
      identifier: userId,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many diagnosis uploads. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");

    let uploadedFile: { name: string; type: string; size: number; buffer: Buffer };
    let title: string;
    let founderContext: string;
    let projectId: string | null;
    let storagePath: string | null = null;

    if (isFormData) {
      // --- Direct in-memory upload (FormData fallback) ---
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file || file.size === 0) {
        return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      uploadedFile = { name: file.name, type: file.type, size: file.size, buffer };
      title = safeJsonText(String(formData.get("title") || ""), "Pitch diagnosis").slice(0, 160) || "Pitch diagnosis";
      founderContext = safeJsonText(String(formData.get("founderContext") || ""), "");
      projectId = safeJsonText(String(formData.get("projectId") || ""), "") || null;
    } else {
      // --- Storage upload path (JSON) ---
      const body = (await req.json()) as {
        storagePath?: string;
        fileName?: string;
        fileType?: string;
        fileSize?: number;
        title?: string;
        founderContext?: string;
        projectId?: string;
      };

      title = safeJsonText(body.title, "Pitch diagnosis").slice(0, 160) || "Pitch diagnosis";
      founderContext = safeJsonText(body.founderContext, "");
      projectId = safeJsonText(body.projectId, "") || null;

      if (!body.storagePath || !body.fileName || !body.fileSize) {
        return NextResponse.json({ error: "storagePath, fileName, and fileSize are required." }, { status: 400 });
      }
      if (!supabaseAdmin) {
        return NextResponse.json({ error: "Storage is not configured." }, { status: 503 });
      }

      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from("decks")
        .download(body.storagePath);

      if (downloadError || !fileData) {
        console.error("[PERCEPTOSCOPE_DOWNLOAD]", downloadError);
        return NextResponse.json({ error: "Could not retrieve the uploaded file. Please try again." }, { status: 400 });
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      uploadedFile = {
        name: body.fileName,
        type: body.fileType || "application/octet-stream",
        size: body.fileSize,
        buffer,
      };
      storagePath = body.storagePath;
    }

    const validation = validateDeckFile(uploadedFile);
    if (!validation.ok) {
      if (storagePath && supabaseAdmin) {
        await supabaseAdmin.storage.from("decks").remove([storagePath]);
      }
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
        fileMimeType: uploadedFile.type,
        fileSize: uploadedFile.size,
        fileFingerprint: fingerprintBuffer(uploadedFile.buffer),
        status: "PENDING",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      select: { id: true },
    });

    const capturedStoragePath = storagePath;
    after(async () => {
      try {
        await processPerceptoscopeAnalysis({
          analysisId: analysis.id,
          userId,
          file: uploadedFile,
          founderContext,
          preferredProvider: null,
        });
      } finally {
        if (capturedStoragePath) {
          await supabaseAdmin?.storage.from("decks").remove([capturedStoragePath]);
        }
      }
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
