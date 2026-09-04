import type { HTMLAttributes, ReactNode } from "react";

import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";
import { STATUS_META, type RepairStatus } from "@/lib/constants";

/**
 * Presentational primitives shared across the marketing site and the admin
 * dashboard. None of these hold state, so they render on the server and add
 * nothing to the client bundle unless a client component imports them.
 */

// ── Card ────────────────────────────────────────────────────────────────────

export function Card({
  className,
  interactive,
  children,
  as: Tag = "div",
  ...props
}: HTMLAttributes<HTMLElement> & {
  interactive?: boolean;
  /** Lets a card carry the right semantics for its context (list item, article…). */
  as?: "div" | "article" | "section" | "li";
}) {
  return (
    <Tag className={cn("surface-card", interactive && "card-interactive", className)} {...props}>
      {children}
    </Tag>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-start justify-between gap-4 p-5 sm:p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  as: Tag = "h3",
}: {
  className?: string;
  children: ReactNode;
  as?: "h2" | "h3" | "h4";
}) {
  return <Tag className={cn("font-display text-lg font-bold text-ink", className)}>{children}</Tag>;
}

// ── Badge ───────────────────────────────────────────────────────────────────

export type BadgeTone =
  | "neutral"
  | "brand"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "progress";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-sunken text-ink-muted border-line",
  brand: "bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/70 dark:text-brand-100 dark:border-brand-800",
  accent: "bg-accent-50 text-accent-800 border-accent-200 dark:bg-accent-950/60 dark:text-accent-200 dark:border-accent-800",
  success: "bg-success-50 text-success-700 border-success-100 dark:bg-success-900/40 dark:text-success-100 dark:border-success-700",
  warning: "bg-warning-50 text-warning-700 border-warning-100 dark:bg-warning-900/40 dark:text-warning-100 dark:border-warning-700",
  danger: "bg-danger-50 text-danger-700 border-danger-100 dark:bg-danger-900/40 dark:text-danger-100 dark:border-danger-700",
  info: "bg-info-50 text-info-700 border-info-100 dark:bg-info-900/40 dark:text-info-100 dark:border-info-700",
  progress: "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/70 dark:text-brand-200 dark:border-brand-800",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
  size = "md",
}: {
  tone?: BadgeTone;
  icon?: IconName;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        BADGE_TONES[tone],
        className,
      )}
    >
      {icon ? <Icon name={icon} size={size === "sm" ? 11 : 13} /> : null}
      {children}
    </span>
  );
}

/** Repair status rendered with its canonical label, tone and a shape cue. */
export function StatusBadge({
  status,
  size = "md",
  className,
}: {
  status: RepairStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const meta = STATUS_META[status];
  const icon: IconName =
    meta.tone === "success"
      ? "check-circle"
      : meta.tone === "danger"
        ? "x-circle"
        : meta.tone === "warning"
          ? "alert-triangle"
          : meta.tone === "progress"
            ? "refresh"
            : "clock";

  return (
    <Badge tone={meta.tone} icon={icon} size={size} className={className}>
      {meta.label}
    </Badge>
  );
}

// ── Alert ───────────────────────────────────────────────────────────────────

const ALERT_TONES = {
  info: {
    wrap: "border-info-100 bg-info-50 text-info-900 dark:border-info-700 dark:bg-info-900/40 dark:text-info-50",
    icon: "text-info-600 dark:text-info-100",
    iconName: "info" as IconName,
  },
  success: {
    wrap: "border-success-100 bg-success-50 text-success-900 dark:border-success-700 dark:bg-success-900/40 dark:text-success-50",
    icon: "text-success-600 dark:text-success-100",
    iconName: "check-circle" as IconName,
  },
  warning: {
    wrap: "border-warning-100 bg-warning-50 text-warning-900 dark:border-warning-700 dark:bg-warning-900/40 dark:text-warning-50",
    icon: "text-warning-600 dark:text-warning-100",
    iconName: "alert-triangle" as IconName,
  },
  danger: {
    wrap: "border-danger-100 bg-danger-50 text-danger-900 dark:border-danger-700 dark:bg-danger-900/40 dark:text-danger-50",
    icon: "text-danger-600 dark:text-danger-100",
    iconName: "alert-circle" as IconName,
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
  /** Announce to screen readers when the alert appears after an action. */
  live,
  action,
}: {
  tone?: keyof typeof ALERT_TONES;
  title?: string;
  children?: ReactNode;
  className?: string;
  live?: boolean;
  action?: ReactNode;
}) {
  const config = ALERT_TONES[tone];

  return (
    <div
      role={live ? "alert" : undefined}
      aria-live={live ? (tone === "danger" ? "assertive" : "polite") : undefined}
      className={cn("flex gap-3 rounded-xl border p-4", config.wrap, className)}
    >
      <Icon name={config.iconName} size={20} className={cn("mt-0.5 shrink-0", config.icon)} />
      <div className="min-w-0 flex-1 text-sm">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && "mt-1", "opacity-90")}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

// ── Loading ─────────────────────────────────────────────────────────────────

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return <Icon name="loader" size={size} className={cn("animate-spin-slow", className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

/** Skeleton block with an accessible busy announcement for async regions. */
export function LoadingBlock({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  className,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sunken text-ink-subtle">
        <Icon name={icon} size={26} />
      </span>
      <h3 className="mt-4 font-display text-base font-bold text-ink">{title}</h3>
      {description ? (
        <p className="measure-tight mt-1.5 text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

// ── Section scaffolding ─────────────────────────────────────────────────────

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  as: Tag = "h2",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:border-brand-800 dark:bg-brand-950/70 dark:text-brand-200">
          {eyebrow}
        </span>
      ) : null}
      <Tag className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
        {title}
      </Tag>
      {description ? (
        <p className={cn("measure text-base text-ink-muted sm:text-lg", align === "center" && "mx-auto")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

// ── Stat tile ───────────────────────────────────────────────────────────────

export function StatTile({
  label,
  value,
  hint,
  icon,
  trend,
  tone = "neutral",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
  trend?: number | null;
  tone?: BadgeTone;
  className?: string;
}) {
  const trendUp = typeof trend === "number" && trend > 0;
  const trendDown = typeof trend === "number" && trend < 0;

  return (
    <div className={cn("surface-card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        {icon ? (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              BADGE_TONES[tone],
            )}
          >
            <Icon name={icon} size={17} />
          </span>
        ) : null}
      </div>
      <p className="tabular mt-3 font-display text-2xl font-bold text-ink sm:text-3xl">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {typeof trend === "number" ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold",
              trendUp && "text-success-700 dark:text-success-500",
              trendDown && "text-danger-700 dark:text-danger-500",
              !trendUp && !trendDown && "text-ink-subtle",
            )}
          >
            <Icon
              name={trendUp ? "trending-up" : trendDown ? "trending-down" : "minus"}
              size={13}
            />
            {Math.abs(Math.round(trend))}%
          </span>
        ) : null}
        {hint ? <span className="text-xs text-ink-subtle">{hint}</span> : null}
      </div>
    </div>
  );
}

// ── Rating ──────────────────────────────────────────────────────────────────

export function StarRating({
  rating,
  size = 16,
  showValue = false,
  className,
}: {
  rating: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  const rounded = Math.round(rating * 2) / 2;

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="flex items-center gap-0.5 text-accent-500" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((position) => (
          <Icon
            key={position}
            name={
              rounded >= position ? "star" : rounded >= position - 0.5 ? "star-half" : "star-outline"
            }
            size={size}
            className={rounded >= position - 0.5 ? undefined : "text-line-strong"}
          />
        ))}
      </span>
      <span className="sr-only">{rating.toFixed(1)} out of 5 stars</span>
      {showValue ? (
        <span className="tabular ml-1 text-sm font-bold text-ink">{rating.toFixed(1)}</span>
      ) : null}
    </span>
  );
}

// ── Divider ─────────────────────────────────────────────────────────────────

export function Divider({ className, label }: { className?: string; label?: string }) {
  if (label) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">{label}</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  }
  return <hr className={cn("border-0 border-t border-line", className)} />;
}

// ── Price display ───────────────────────────────────────────────────────────

export function PriceTag({
  price,
  compareAt,
  isEstimate,
  size = "md",
  className,
}: {
  price: string;
  compareAt?: string | null;
  isEstimate?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-2", className)}>
      {isEstimate ? (
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">from</span>
      ) : null}
      <span className={cn("tabular font-display font-bold text-ink", sizeClass)}>{price}</span>
      {compareAt ? (
        <>
          <span className="tabular text-sm text-ink-subtle line-through">{compareAt}</span>
          <span className="sr-only">reduced from {compareAt}</span>
        </>
      ) : null}
    </span>
  );
}
