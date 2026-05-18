import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/auth"; // Referring to the auth.ts we created
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestSecurityContext } from "@/lib/security/request";

export const GET = handlers.GET;

export async function POST(req: NextRequest) {
  const requestContext = getRequestSecurityContext(req);
  const rateLimit = await checkRateLimit({
    scope: "auth-post",
    identifier: requestContext.ip,
    limit: 30,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many authentication attempts. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      }
    );
  }

  return handlers.POST(req);
}
