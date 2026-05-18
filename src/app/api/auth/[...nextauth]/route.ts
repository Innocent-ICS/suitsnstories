import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/auth"; // Referring to the auth.ts we created
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestSecurityContext } from "@/lib/security/request";

// GET requests are used for OAuth callbacks and should not be rate limited
export const GET = handlers.GET;

export async function POST(req: NextRequest) {
  const requestContext = getRequestSecurityContext(req);
  
  // Only rate limit credential-based sign-ins, not OAuth callbacks
  const url = new URL(req.url);
  const isOAuthCallback = url.searchParams.has('code') || url.searchParams.has('state');
  
  if (!isOAuthCallback) {
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
  }

  return handlers.POST(req);
}
