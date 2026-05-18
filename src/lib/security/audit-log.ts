import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hashSecurityValue, type RequestSecurityContext } from "./request";

type AuditOutcome = "SUCCESS" | "DENIED" | "FAILED" | "PARTIAL";

interface AuditEvent {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  outcome?: AuditOutcome;
  request?: RequestSecurityContext;
  metadata?: Record<string, unknown>;
}

const REDACTED_KEYS = /(password|secret|token|key|authorization|cookie|signature)/i;
const HASHED_KEYS = /(email|ip|phone)/i;

export async function auditSecurityEvent(event: AuditEvent) {
  try {
    await db.securityAuditLog.create({
      data: {
        actorId: event.actorId || null,
        action: event.action,
        targetType: event.targetType || null,
        targetId: event.targetId || null,
        outcome: event.outcome || "SUCCESS",
        ipHash: event.request?.ip ? hashSecurityValue(event.request.ip) : null,
        userAgent: event.request?.userAgent || null,
        metadata: sanitizeMetadata(event.metadata) as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.error("[SECURITY_AUDIT]", error);
  }
}

function sanitizeMetadata(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) return null;

  if (REDACTED_KEYS.test(key)) return "[redacted]";

  if (typeof value === "string") {
    if (HASHED_KEYS.test(key)) return hashSecurityValue(value);
    return value.slice(0, 500);
  }

  if (typeof value === "number" || typeof value === "boolean") return value;

  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.slice(0, 24).map((item) => sanitizeMetadata(item, key));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 48)
        .map(([entryKey, entryValue]) => [entryKey, sanitizeMetadata(entryValue, entryKey)])
    );
  }

  return String(value).slice(0, 500);
}
