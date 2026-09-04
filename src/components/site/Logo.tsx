import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * MyMobiFix wordmark.
 *
 * An original inline SVG mark — a phone outline whose screen forms a check —
 * paired with the wordmark. Inline rather than a file so it inherits the theme
 * and costs no extra request.
 */
export function Logo({
  className,
  href = "/",
  showWordmark = true,
  size = 36,
}: {
  className?: string;
  href?: string | null;
  showWordmark?: boolean;
  size?: number;
}) {
  const mark = (
    <>
      <span className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 40 40"
          width={size}
          height={size}
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <rect width="40" height="40" rx="11" className="fill-brand-950 dark:fill-brand-700" />
          <rect
            x="12"
            y="8.5"
            width="16"
            height="23"
            rx="3.4"
            className="stroke-white/85"
            strokeWidth="1.9"
          />
          <path
            d="m15.8 20.4 3.1 3.2 6-6.7"
            className="stroke-accent-400"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M17.6 28.6h4.8" className="stroke-white/45" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </span>

      {showWordmark ? (
        <span className="font-display text-lg font-bold leading-none tracking-tight text-ink">
          MyMobi<span className="text-accent-600 dark:text-accent-400">Fix</span>
        </span>
      ) : null}
    </>
  );

  if (href === null) {
    return <span className={cn("inline-flex items-center gap-2.5", className)}>{mark}</span>;
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-85",
        className,
      )}
      aria-label="MyMobiFix — home"
    >
      {mark}
    </Link>
  );
}
