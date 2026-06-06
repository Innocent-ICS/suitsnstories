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
        `${baseUrl}/checkout/confirmation?ref=${encodeURIComponent(ref)}&status=failed&reason=${encodeURIComponent(publicPaymentReason(result.error))}`
      );
    }
  } catch (error: unknown) {
    console.error("Payment verify error:", error);
    return NextResponse.redirect(
      `${baseUrl}/checkout/confirmation?ref=${encodeURIComponent(ref)}&status=error&reason=${encodeURIComponent(publicPaymentReason())}`
    );
  }
}

function publicPaymentReason(error?: string | null) {
  if (error && /not successful|failed|declined/i.test(error) && !/prisma|database|fatal|querying/i.test(error)) {
    return "Payment was not completed by the provider.";
  }

  return "We could not confirm the payment right now. Please try again in a few minutes.";
}
