"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteUser } from "@/actions/admin";
import { ArrowPathIcon, ExclamationTriangleIcon, TrashIcon } from "@/components/icons/app-icons";

interface DeleteUserButtonProps {
  userId: string;
  userName: string | null;
  userEmail: string | null;
}

export function DeleteUserButton({ userId, userName, userEmail }: DeleteUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const canConfirm = confirmText === "DELETE";

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function handleOpen() {
    setError(null);
    setConfirmText("");
    setOpen(true);
  }

  async function handleDelete() {
    if (!canConfirm) return;

    setLoading(true);
    setError(null);

    try {
      const result = await deleteUser(userId);

      if (!result.success) {
        setError(result.error || "Failed to delete user");
        setLoading(false);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        title="Delete user"
      >
        <TrashIcon className="h-4 w-4" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !loading && setOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Delete account
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3 space-y-1.5">
                  <p className="text-sm text-foreground">
                    You are about to permanently delete:
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {userName || "Unnamed user"}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({userEmail || "No email"})
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    All of their data — enrollments, bookings, projects, analyses, and
                    payment records — will be permanently removed.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="delete-confirm"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Type <span className="font-mono text-red-500">DELETE</span> to
                    confirm
                  </label>
                  <input
                    ref={inputRef}
                    id="delete-confirm"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all"
                    placeholder="DELETE"
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canConfirm) handleDelete();
                    }}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-500 text-center bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                    {error}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!canConfirm || loading}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Deleting…
                    </span>
                  ) : (
                    "Delete account"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
