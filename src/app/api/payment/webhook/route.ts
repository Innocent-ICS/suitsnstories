import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { fulfillPayment } from "@/actions/payment";
import { auditSecurityEvent } from "@/lib/security/audit-log";
import { getRequestSecurityContext } from "@/lib/security/request";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";
  const requestContext = getRequestSecurityContext(req);

  // Verify webhook authenticity
  if (!verifyWebhookSignature(body, signature)) {
    await auditSecurityEvent({
      action: "PAYSTACK_WEBHOOK_SIGNATURE_DENIED",
      targetType: "PaymentWebhook",
      outcome: "DENIED",
      request: requestContext,
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(body);
  } catch {
    await auditSecurityEvent({
      action: "PAYSTACK_WEBHOOK_INVALID_JSON",
      targetType: "PaymentWebhook",
      outcome: "DENIED",
      request: requestContext,
    });
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.event === "charge.success") {
    const reference = event.data?.reference;
    if (reference) {
      try {
        await fulfillPayment(reference);
      } catch (error) {
        console.error("Webhook fulfillment error:", error);
        await auditSecurityEvent({
          action: "PAYSTACK_WEBHOOK_FULFILLMENT_FAILED",
          targetType: "PaymentWebhook",
          outcome: "FAILED",
          request: requestContext,
          metadata: {
            reference,
            error: error instanceof Error ? error.message : "unknown",
          },
        });
        // Return 200 anyway so PayStack doesn't retry on app errors
      }
    }
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true });
}
