"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole } from "@/actions/admin";

const ROLES = [
  { value: "CLIENT", label: "Client", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "COACH", label: "Coach", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { value: "PERCEPTION_ENGINEER", label: "Engineer", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { value: "ADMIN", label: "Admin", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
];

export function RoleChanger({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const current = ROLES.find((r) => r.value === currentRole) || ROLES[0];

  async function handleChange(newRole: string) {
    if (newRole === currentRole) {
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      await updateUserRole(userId, newRole as any);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer hover:opacity-80 ${current.color}`}
      >
        {loading ? "..." : current.label}
        <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] rounded-lg border border-border bg-card shadow-lg py-1">
            {ROLES.map((role) => (
              <button
                key={role.value}
                onClick={() => handleChange(role.value)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  role.value === currentRole
                    ? "bg-muted font-medium"
                    : "hover:bg-muted/50"
                }`}
              >
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${role.color}`}>
                  {role.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
