"use client";

import { useState } from "react";
import { updateInquiryStatus } from "@/actions/admin";

interface InquiryActionsProps {
  inquiryId: string;
  currentStatus: string;
}

const statusFlow: Record<string, string[]> = {
  new: ["reviewed", "contacted", "closed"],
  reviewed: ["contacted", "closed"],
  contacted: ["closed"],
  closed: ["new"],
};

export function InquiryActions({ inquiryId, currentStatus }: InquiryActionsProps) {
  const [loading, setLoading] = useState(false);
  const nextStatuses = statusFlow[currentStatus] || [];

  async function handleStatusChange(status: string) {
    setLoading(true);
    await updateInquiryStatus(inquiryId, status);
    setLoading(false);
  }

  if (nextStatuses.length === 0) return null;

  return (
    <div className="flex gap-2 shrink-0">
      {nextStatuses.map((status) => (
        <button
          key={status}
          onClick={() => handleStatusChange(status)}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors capitalize disabled:opacity-50"
        >
          {status === "closed" ? "Close" : `Mark ${status}`}
        </button>
      ))}
    </div>
  );
}
