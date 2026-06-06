import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createSignedFileUrl } from "@/lib/supabase";

interface Props {
  params: Promise<{ deliverableId: string }>;
}

export async function GET(_req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { deliverableId } = await params;
  const deliverable = await db.deliverable.findUnique({
    where: { id: deliverableId },
    select: {
      fileUrl: true,
      project: {
        select: {
          clientId: true,
          coachId: true,
          collaborators: {
            where: { userId: session.user.id },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!deliverable?.fileUrl) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const canDownload =
    user?.role === "ADMIN" ||
    deliverable.project.clientId === session.user.id ||
    deliverable.project.coachId === session.user.id ||
    deliverable.project.collaborators.length > 0;

  if (!canDownload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (/^https?:\/\//i.test(deliverable.fileUrl)) {
    return NextResponse.redirect(deliverable.fileUrl);
  }

  const signedUrl = await createSignedFileUrl("deliverables", deliverable.fileUrl, 60 * 10);
  if (!signedUrl) {
    return NextResponse.json({ error: "Could not prepare download" }, { status: 500 });
  }

  return NextResponse.redirect(signedUrl);
}
