import { db } from "@/lib/db";

const STALE_INVITATION_RETENTION_DAYS = 30;

export async function cleanupProjectInvitations(now = new Date()) {
  const retentionCutoff = new Date(now.getTime() - STALE_INVITATION_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const [expired, deleted] = await db.$transaction([
    db.projectInvitation.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      data: { status: "EXPIRED" },
    }),
    db.projectInvitation.deleteMany({
      where: {
        status: { in: ["REVOKED", "EXPIRED"] },
        updatedAt: { lt: retentionCutoff },
      },
    }),
  ]);

  return {
    expired: expired.count,
    deleted: deleted.count,
  };
}
