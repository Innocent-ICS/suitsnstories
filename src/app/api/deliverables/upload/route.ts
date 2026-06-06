import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { uploadPrivateFile } from "@/lib/supabase";
import {
  assertSameOriginRequest,
  getRequestSecurityContext,
} from "@/lib/security/request";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/msword",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "text/plain",
  "text/markdown",
]);

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "pptx",
  "docx",
  "ppt",
  "doc",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "mp4",
  "mov",
  "txt",
  "md",
]);

export async function POST(req: NextRequest) {
  try {
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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = String(formData.get("projectId") || "");

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project is required" }, { status: 400 });
    }

    const canUpload = await userCanUploadDeliverable(projectId, session.user.id);
    if (!canUpload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const extension = getFileExtension(file.name);
    if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, PPTX, DOCX, PPT, DOC, images, videos, text files." },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .substring(0, 100) || `deliverable.${extension || "bin"}`;
    const path = `${projectId}/${session.user.id}/${timestamp}-${safeName}`;

    const storagePath = await uploadPrivateFile("deliverables", path, file);

    if (!storagePath) {
      return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      url: storagePath,
      fileType: file.type || extension,
      fileSize: file.size,
      fileName: file.name,
    });
  } catch (error) {
    console.error("[DELIVERABLE_UPLOAD] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

async function userCanUploadDeliverable(projectId: string, userId: string) {
  const [user, project] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
    db.project.findUnique({
      where: { id: projectId },
      select: {
        clientId: true,
        collaborators: {
          where: { userId, role: "EDITOR" },
          select: { id: true },
        },
      },
    }),
  ]);

  if (!project) return false;
  return user?.role === "ADMIN" || project.clientId === userId || project.collaborators.length > 0;
}
