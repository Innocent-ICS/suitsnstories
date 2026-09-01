"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function PaymentBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dismissedPayment, setDismissedPayment] = useState<string | null>(null);
  const payment = searchParams.get("payment");
  const reason = searchParams.get("reason");
  const visible = Boolean(payment) && dismissedPayment !== payment;

  useEffect(() => {
    if (!payment || dismissedPayment === payment) return;

    const timer = setTimeout(() => {
      setDismissedPayment(payment);
      router.replace("/dashboard", { scroll: false });
    }, 8000);

    return () => clearTimeout(timer);
  }, [dismissedPayment, payment, router]);

  if (!visible || !payment) return null;

  const config: Record<string, { bg: string; text: string; message: string }> = {
    success: {
      bg: "bg-emerald-500/10 border-emerald-500/30",
      text: "text-emerald-400",
      message: "Payment successful! You're all set.",
    },
    failed: {
      bg: "bg-red-500/10 border-red-500/30",
      text: "text-red-400",
      message: reason ? `Payment failed: ${reason}` : "Payment was not completed.",
    },
    error: {
      bg: "bg-amber-500/10 border-amber-500/30",
      text: "text-amber-400",
      message: reason
        ? `Payment verification issue: ${reason}`
        : "We couldn't verify your payment. If you were charged, contact support.",
    },
    missing: {
      bg: "bg-red-500/10 border-red-500/30",
      text: "text-red-400",
      message: "Payment reference missing.",
    },
  };

  const c = config[payment] || config.error;

  return (
    <div className={`rounded-xl border p-4 flex items-center justify-between ${c.bg}`}>
      <p className={`text-sm font-medium ${c.text}`}>{c.message}</p>
      <button
        onClick={() => {
          setDismissedPayment(payment);
          router.replace("/dashboard", { scroll: false });
        }}
        className={`text-xs ${c.text} hover:opacity-70 transition-opacity ml-4 shrink-0`}
      >
        Dismiss
      </button>
    </div>
  );
}
