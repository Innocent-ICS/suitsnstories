import { NextRequest, NextResponse } from "next/server";
import { fulfillPayment } from "@/actions/payment";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestSecurityContext } from "@/lib/security/request";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  const baseUrl = req.nextUrl.origin;
  const requestContext = getRequestSecurityContext(req);
  const rateLimit = await checkRateLimit({
    scope: "payment-verify",
    identifier: `${requestContext.ip}:${ref || "missing"}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.redirect(`${baseUrl}/checkout/confirmation?status=rate_limited`);
  }

  if (!ref) {
    return NextResponse.redirect(`${baseUrl}/checkout/confirmation?status=missing`);
  }

  try {
    const result = await fulfillPayment(ref);

    if (result.success) {
      return NextResponse.redirect(`${baseUrl}/checkout/confirmation?ref=${encodeURIComponent(ref)}&status=success`);
    } else {
      return NextResponse.redirect(
        `${baseUrl}/checkout/confirmation?ref=${encodeURIComponent(ref)}&status=failed&reason=${encodeURIComponent(result.error || "unknown")}`
      );
    }
  } catch (error: unknown) {
    console.error("Payment verify error:", error);
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.redirect(
      `${baseUrl}/checkout/confirmation?ref=${encodeURIComponent(ref)}&status=error&reason=${encodeURIComponent(message)}`
    );
  }
}
