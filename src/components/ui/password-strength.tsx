"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon } from "@/components/icons/app-icons";

interface PasswordStrengthProps {
  password: string;
}

const CRITERIA = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character", test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
] as const;

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const results = CRITERIA.map((c) => c.test(password));

  return (
    <div className="pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Criteria Checklist */}
      <ul className="grid gap-2 border border-border/40 rounded-xl p-3 bg-muted/10 backdrop-blur-sm">
        {CRITERIA.map((criterion, i) => {
          const passed = results[i];
          return (
            <li
              key={criterion.label}
              className="flex items-center gap-2.5 text-[11px] sm:text-xs transition-colors duration-200"
            >
              <div className="relative shrink-0 flex items-center justify-center w-4 h-4">
                <AnimatePresence mode="wait">
                  {passed ? (
                    <motion.div
                      key="checked"
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 45 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <CheckIcon className="w-2.5 h-2.5" strokeWidth={2.4} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unchecked"
                      className="absolute inset-0 flex items-center justify-center rounded-full border border-muted-foreground/30 text-muted-foreground/35 bg-transparent"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span
                className={`font-medium transition-all duration-300 ${
                  passed ? "text-foreground" : "text-muted-foreground/60"
                }`}
              >
                {criterion.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
