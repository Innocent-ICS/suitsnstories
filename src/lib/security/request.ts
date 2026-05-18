import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

export interface RequestSecurityContext {
  ip: string;
  userAgent?: string;
  origin?: string;
  host?: string;
  path?: string;
}

export class CsrfError extends Error {
  constructor(message = "Request origin is not allowed.") {
    super(message);
    this.name = "CsrfError";
  }
}

export function hashSecurityValue(value?: string | null) {
  if (!value) return null;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "suitsnstories-local-security";
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}

export function getRequestSecurityContext(req: NextRequest | Request): RequestSecurityContext {
  const headers = req.headers;
  return {
    ip: getClientIp(headers),
    userAgent: headers.get("user-agent")?.slice(0, 240) || undefined,
    origin: headers.get("origin") || undefined,
    host: headers.get("host") || undefined,
    path: "nextUrl" in req ? req.nextUrl.pathname : undefined,
  };
}

export async function getServerActionSecurityContext(): Promise<RequestSecurityContext> {
  try {
    const { headers } = await import("next/headers");
    const headerStore = await headers();
    return {
      ip: getClientIp(headerStore),
      userAgent: headerStore.get("user-agent")?.slice(0, 240) || undefined,
      origin: headerStore.get("origin") || undefined,
      host: headerStore.get("host") || undefined,
    };
  } catch {
    return { ip: "local-test" };
  }
}

export function assertSameOriginRequest(context: RequestSecurityContext) {
  if (!context.origin || !context.host) return;

  const allowedOrigins = new Set<string>();
  allowedOrigins.add(`https://${context.host}`);
  allowedOrigins.add(`http://${context.host}`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      allowedOrigins.add(new URL(appUrl).origin);
    } catch {
      // Ignore invalid deployment config here; startup/deploy checks should catch it.
    }
  }

  let origin: string;
  try {
    origin = new URL(context.origin).origin;
  } catch {
    throw new CsrfError();
  }

  if (!allowedOrigins.has(origin)) {
    throw new CsrfError();
  }
}

function getClientIp(headers: Headers | Pick<Headers, "get">) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    forwardedFor ||
    "unknown"
  );
}
