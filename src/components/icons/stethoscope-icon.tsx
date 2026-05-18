/**
 * Stethoscope icon – matches the Heroicons outline style (24×24, stroke-width 1.5).
 * Used as the Perceptoscope feature icon throughout the platform.
 */
export function StethoscopeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Earpiece tubes */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 3v5a6 6 0 0 0 12 0V3"
      />
      {/* Tubing down to chest piece */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 14v3"
      />
      {/* Chest piece (diaphragm) */}
      <circle cx="12" cy="19.5" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Ear tips */}
      <circle cx="6" cy="3" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="3" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
