import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  assertSameOriginRequest,
  getRequestSecurityContext,
} from "@/lib/security/request";

export const runtime = "nodejs";

/**
 * Generate a signed upload URL so the client can upload the deck file
 * directly to Supabase Storage, bypassing Vercel's 4.5MB body size limit.
 *
 * Flow:
 * 1. Client calls POST /api/perceptoscope/upload-url with file metadata
 * 2. Server generates a signed upload URL for the private "decks" bucket
 * 3. Client uploads directly to Supabase using the signed URL
 * 4. Client calls POST /api/perceptoscope/analyses with the storage path
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

  try {
    const rateLimit = await checkRateLimit({
      scope: "perceptoscope-upload",
      identifier: session.user.id,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Storage is not configured." },
        { status: 503 }
      );
    }

    const body = (await req.json()) as {
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    };

    if (!body.fileName || !body.fileSize) {
      return NextResponse.json({ error: "fileName and fileSize are required." }, { status: 400 });
    }

    // Validate file size (20MB max, matching storage bucket limit)
    if (body.fileSize > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 20MB." }, { status: 400 });
    }

    // Generate a unique storage path
    const timestamp = Date.now();
    const safeName = body.fileName
      .replace(/[^\w.\- ]+/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "deck";
    const storagePath = `${session.user.id}/${timestamp}-${safeName}`;

    // Create a signed upload URL (valid for 5 minutes)
    const { data, error } = await supabaseAdmin.storage
      .from("decks")
      .createSignedUploadUrl(storagePath);

    if (error) {
      console.error("[PERCEPTOSCOPE_UPLOAD_URL]", error);
      return NextResponse.json(
        { error: "Could not prepare the upload. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      storagePath,
      token: data.token,
    });
  } catch (error) {
    console.error("[PERCEPTOSCOPE_UPLOAD_URL]", error);
    return NextResponse.json({ error: "Could not prepare the upload." }, { status: 500 });
  }
}
