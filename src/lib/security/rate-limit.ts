import { db } from "@/lib/db";
import { hashSecurityValue } from "./request";

export class RateLimitError extends Error {
  retryAfter: number;

  constructor(retryAfter: number, message = "Too many requests. Please try again shortly.") {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export interface RateLimitOptions {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  if (process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMITS === "true") {
    return { allowed: true, remaining: options.limit, retryAfter: 0 };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - options.windowMs);
  const keyHash = hashSecurityValue(`${options.scope}:${options.identifier}`) || "unknown";

  try {
    await maybeCleanupExpiredRateLimitEvents(options.scope, windowStart);

    const result = await db.$transaction(async (tx) => {
      const count = await tx.rateLimitEvent.count({
        where: {
          scope: options.scope,
          keyHash,
          createdAt: { gte: windowStart },
        },
      });

      if (count >= options.limit) {
        const oldest = await tx.rateLimitEvent.findFirst({
          where: {
            scope: options.scope,
            keyHash,
            createdAt: { gte: windowStart },
          },
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
        });
        const retryAfter = oldest
          ? Math.max(1, Math.ceil((oldest.createdAt.getTime() + options.windowMs - now.getTime()) / 1000))
          : Math.ceil(options.windowMs / 1000);

        return { allowed: false, remaining: 0, retryAfter };
      }

      await tx.rateLimitEvent.create({
        data: {
          scope: options.scope,
          keyHash,
        },
      });

      return {
        allowed: true,
        remaining: Math.max(0, options.limit - count - 1),
        retryAfter: 0,
      };
    });

    return result;
  } catch (error) {
    console.error("[RATE_LIMIT]", error);
    return { allowed: true, remaining: options.limit, retryAfter: 0 };
  }
}

async function maybeCleanupExpiredRateLimitEvents(scope: string, windowStart: Date) {
  const sampleRate = Number(process.env.RATE_LIMIT_CLEANUP_SAMPLE_RATE || "0.02");
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || Math.random() > sampleRate) return;

  await db.rateLimitEvent
    .deleteMany({
      where: {
        scope,
        createdAt: { lt: windowStart },
      },
    })
    .catch((error) => {
      console.error("[RATE_LIMIT_CLEANUP]", error);
    });
}

export async function enforceRateLimit(options: RateLimitOptions) {
  const result = await checkRateLimit(options);
  if (!result.allowed) throw new RateLimitError(result.retryAfter);
  return result;
}
