import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { uploadPublicFile } from "@/lib/supabase";
import {
  assertSameOriginRequest,
  getRequestSecurityContext,
} from "@/lib/security/request";

const PUBLIC_UPLOAD_BUCKETS = new Set(["course-thumbnails"]);

export async function POST(req: NextRequest) {
  try {
    const requestContext = getRequestSecurityContext(req);
    try {
      assertSameOriginRequest(requestContext);
    } catch {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Admin check
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "course-thumbnails";
    const path = formData.get("path") as string;

    if (!file || !path) {
      return NextResponse.json({ error: "File and path are required" }, { status: 400 });
    }

    if (!PUBLIC_UPLOAD_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: "Uploads to this bucket must use private storage flows" }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    const url = await uploadPublicFile(bucket, path, file);

    if (!url) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[UPLOAD] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
