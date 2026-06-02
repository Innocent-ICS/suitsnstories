"use client";

import { motion, AnimatePresence } from "framer-motion";

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

function getStrengthMeta(score: number) {
  if (score <= 1) {
    return {
      label: "Weak",
      color: "bg-rose-500",
      text: "text-rose-500",
      bgLight: "bg-rose-500/10",
      border: "border-rose-500/20",
    };
  }
  if (score <= 3) {
    return {
      label: "Fair",
      color: "bg-amber-500",
      text: "text-amber-500",
      bgLight: "bg-amber-500/10",
      border: "border-amber-500/20",
    };
  }
  if (score === 4) {
    return {
      label: "Good",
      color: "bg-indigo-500",
      text: "text-indigo-500",
      bgLight: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    };
  }
  return {
    label: "Strong",
    color: "bg-emerald-500",
    text: "text-emerald-500",
    bgLight: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const results = CRITERIA.map((c) => c.test(password));
  const score = results.filter(Boolean).length;
  const meta = getStrengthMeta(score);

  return (
    <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Strength Header & Bars */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80">
            Password Security
          </span>
          <span
            className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border transition-all duration-300 ${meta.text} ${meta.bgLight} ${meta.border}`}
          >
            {meta.label}
          </span>
        </div>
        <div className="flex gap-1.5 h-1.5 items-center">
          {Array.from({ length: 5 }, (_, i) => {
            const isActive = i < score;
            return (
              <div
                key={i}
                className="h-1 flex-1 bg-muted/40 rounded-full overflow-hidden relative"
              >
                {isActive && (
                  <motion.div
                    className={`absolute inset-0 rounded-full ${meta.color}`}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

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
                      <svg
                        className="w-2.5 h-2.5 stroke-[3]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <motion.path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.1, duration: 0.2 }}
                        />
                      </svg>
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

