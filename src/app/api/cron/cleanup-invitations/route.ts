import { NextRequest, NextResponse } from "next/server";
import { cleanupProjectInvitations } from "@/lib/security/project-invitations";
import { auditSecurityEvent } from "@/lib/security/audit-log";
import { getRequestSecurityContext } from "@/lib/security/request";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return runCleanup(req);
}

export async function POST(req: NextRequest) {
  return runCleanup(req);
}

async function runCleanup(req: NextRequest) {
  const requestContext = getRequestSecurityContext(req);
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization") || "";

  if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
    await auditSecurityEvent({
      action: "INVITATION_CLEANUP_DENIED",
      targetType: "ProjectInvitation",
      outcome: "DENIED",
      request: requestContext,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!cronSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET is required in production" }, { status: 500 });
  }

  const result = await cleanupProjectInvitations();
  await auditSecurityEvent({
    action: "INVITATION_CLEANUP_COMPLETED",
    targetType: "ProjectInvitation",
    request: requestContext,
    metadata: result,
  });

  return NextResponse.json(result);
}
