import { NextRequest, NextResponse } from "next/server";
import { fulfillPayment } from "@/actions/payment";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  const baseUrl = req.nextUrl.origin;

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
