import { NextRequest, NextResponse } from "next/server";
import { fulfillPayment } from "@/actions/payment";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  const baseUrl = req.nextUrl.origin;

  if (!ref) {
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=missing`);
  }

  try {
    const result = await fulfillPayment(ref);

    if (result.success) {
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=success`);
    } else {
      return NextResponse.redirect(
        `${baseUrl}/dashboard?payment=failed&reason=${encodeURIComponent(result.error || "unknown")}`
      );
    }
  } catch (error: any) {
    console.error("Payment verify error:", error);
    return NextResponse.redirect(
      `${baseUrl}/dashboard?payment=error&reason=${encodeURIComponent(error.message || "unknown")}`
    );
  }
}
