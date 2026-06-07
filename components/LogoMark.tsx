interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * ReinigungsPilot AI brand mark.
 *
 * Concept: a rising sales pipeline that climbs to a single highlighted node —
 * leads moving up the pipeline to a won deal / AI-prioritised target. Rendered
 * monochrome white on a confident blue tile for a clean, premium Swiss B2B feel.
 * Same geometry is reused for the favicon (app/icon.svg).
 */
export function LogoMark({ size = 34, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="ReinigungsPilot AI"
    >
      <rect width="32" height="32" rx="8" fill="#2563EB" />
      <path
        d="M7 21.5 L13 15.5 L18 18 L24.5 10"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="21.5" r="1.5" fill="#FFFFFF" fillOpacity="0.55" />
      <circle cx="13" cy="15.5" r="1.5" fill="#FFFFFF" fillOpacity="0.55" />
      <circle cx="18" cy="18" r="1.5" fill="#FFFFFF" fillOpacity="0.55" />
      <circle cx="24.5" cy="10" r="5" fill="#FFFFFF" fillOpacity="0.18" />
      <circle cx="24.5" cy="10" r="3" fill="#FFFFFF" />
    </svg>
  );
}
