import crypto from "crypto";

// ── PayStack Config ────────────────────────────────────────────────────

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

export { PAYSTACK_PUBLIC_KEY };

// ── Initialize Transaction ─────────────────────────────────────────────

export async function initializeTransaction({
  email,
  amount,
  reference,
  callbackUrl,
  metadata,
}: {
  email: string;
  amount: number; // in kobo/cents
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount,
      reference,
      callback_url: callbackUrl,
      metadata,
      currency: "GHS",
    }),
  });

  const data = await res.json();
  if (!data.status) {
    throw new Error(data.message || "PayStack initialization failed");
  }

  return data.data as {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

// ── Verify Transaction ──────────────────────────────────────────────────

export async function verifyTransaction(reference: string) {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const data = await res.json();
  if (!data.status) {
    throw new Error(data.message || "Verification failed");
  }

  return data.data as {
    status: string; // "success" | "failed" | "abandoned"
    reference: string;
    amount: number;
    currency: string;
    metadata: Record<string, unknown>;
    customer: { email: string };
    paid_at: string;
  };
}

// ── Webhook Signature Verification ──────────────────────────────────────

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");
  return hash === signature;
}

// ── Generate Reference ──────────────────────────────────────────────────

export function generateReference(prefix: string = "ss") {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}
