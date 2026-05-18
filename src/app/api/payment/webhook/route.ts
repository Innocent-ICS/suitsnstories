import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { fulfillPayment } from "@/actions/payment";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";

  // Verify webhook authenticity
  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const reference = event.data?.reference;
    if (reference) {
      try {
        await fulfillPayment(reference);
      } catch (error) {
        console.error("Webhook fulfillment error:", error);
        // Return 200 anyway so PayStack doesn't retry on app errors
      }
    }
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true });
}
