import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Button.
 *
 * Hover states change colour and shadow only — never scale or size — so nothing
 * on the page shifts under the pointer. Loading disables the control, marks it
 * `aria-busy` and keeps the label in place so the button never changes width
 * mid-request.
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "subtle";

export type ButtonSize = "sm" | "md" | "lg" | "xl";

const VARIANTS: Record<ButtonVariant, string> = {
  // Gold on near-black: 5.7:1 contrast, and the only gold surface on the page.
  primary:
    "bg-accent-500 text-brand-950 shadow-sm hover:bg-accent-400 hover:shadow-md active:bg-accent-600 disabled:bg-accent-500/50 disabled:text-brand-950/60",
  secondary:
    "bg-brand-950 text-white shadow-sm hover:bg-brand-800 hover:shadow-md active:bg-brand-900 dark:bg-brand-700 dark:hover:bg-brand-600",
  outline:
    "border border-line-strong bg-surface text-ink hover:border-brand-400 hover:bg-brand-50 active:bg-brand-100 dark:hover:bg-brand-950/60 dark:hover:border-brand-500",
  ghost:
    "text-ink-muted hover:bg-sunken hover:text-ink active:bg-line",
  subtle:
    "bg-brand-50 text-brand-800 hover:bg-brand-100 active:bg-brand-200 dark:bg-brand-950/70 dark:text-brand-100 dark:hover:bg-brand-900",
  danger:
    "bg-danger-600 text-white shadow-sm hover:bg-danger-500 hover:shadow-md active:bg-danger-700",
};

const SIZES: Record<ButtonSize, string> = {
  // Every size clears the 44px minimum touch target except `sm`, which is only
  // used inside dense admin tables alongside a larger primary action.
  sm: "h-9 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
  xl: "h-14 px-8 text-base gap-2.5 rounded-2xl",
};

const BASE =
  "relative inline-flex items-center justify-center font-semibold whitespace-nowrap " +
  "transition-[background-color,border-color,box-shadow,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-60";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon rendered before the label. */
  iconLeft?: IconName;
  /** Icon rendered after the label. */
  iconRight?: IconName;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
};

export type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    /** Announced while `loading` is true. */
    loadingLabel?: string;
  };

export function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  fullWidth,
  loading = false,
  loadingLabel = "Working…",
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const iconSize = size === "sm" ? 15 : size === "xl" ? 20 : 18;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...props}
    >
      {loading ? (
        <>
          <Icon name="loader" size={iconSize} className="animate-spin-slow" />
          <span>{loadingLabel}</span>
          {/* Keeps the original label's width so the button does not resize. */}
          <span className="pointer-events-none invisible absolute" aria-hidden="true">
            {children}
          </span>
        </>
      ) : (
        <>
          {iconLeft ? <Icon name={iconLeft} size={iconSize} /> : null}
          {children}
          {iconRight ? <Icon name={iconRight} size={iconSize} /> : null}
        </>
      )}
    </button>
  );
}

export type ButtonLinkProps = CommonProps & {
  href: string;
  /** Adds rel/target for links leaving the site. */
  external?: boolean;
  prefetch?: boolean;
  "aria-label"?: string;
  id?: string;
  onClick?: () => void;
};

/** Anchor styled as a button — for navigation rather than actions. */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  fullWidth,
  external,
  className,
  children,
  prefetch,
  ...props
}: ButtonLinkProps) {
  const iconSize = size === "sm" ? 15 : size === "xl" ? 20 : 18;
  const content = (
    <>
      {iconLeft ? <Icon name={iconLeft} size={iconSize} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={iconSize} /> : null}
    </>
  );
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...props}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} prefetch={prefetch} className={classes} {...props}>
      {content}
    </Link>
  );
}

/** Square icon-only button. `label` is required — it becomes the accessible name. */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  className,
  ...props
}: Omit<ButtonProps, "children" | "iconLeft" | "iconRight"> & {
  icon: IconName;
  label: string;
}) {
  const box = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-12 w-12" : "h-11 w-11";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(BASE, VARIANTS[variant], "rounded-xl p-0", box, className)}
      {...props}
    >
      <Icon name={icon} size={size === "sm" ? 16 : 19} />
    </button>
  );
}
