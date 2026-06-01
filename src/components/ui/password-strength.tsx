"use client";

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
  if (score <= 1) return { label: "Weak", color: "bg-red-500", text: "text-red-500" };
  if (score <= 3) return { label: "Fair", color: "bg-amber-500", text: "text-amber-500" };
  if (score === 4) return { label: "Good", color: "bg-blue-500", text: "text-blue-500" };
  return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const results = CRITERIA.map((c) => c.test(password));
  const score = results.filter(Boolean).length;
  const meta = getStrengthMeta(score);

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Password strength</span>
          <span className={`text-xs font-medium ${meta.text}`}>{meta.label}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < score ? meta.color : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Criteria checklist */}
      <ul className="grid gap-1">
        {CRITERIA.map((criterion, i) => {
          const passed = results[i];
          return (
            <li
              key={criterion.label}
              className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                passed ? "text-emerald-500" : "text-muted-foreground"
              }`}
            >
              <span className="shrink-0 w-4 text-center">
                {passed ? "✓" : "○"}
              </span>
              {criterion.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
