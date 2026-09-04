"use client";

import { useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Form controls.
 *
 * Every control is wired to a real `<label for>`, and errors are linked with
 * `aria-describedby` + `aria-invalid` so screen readers announce the problem
 * with the field rather than leaving the user to hunt for it. Error text sits
 * directly beneath the input it belongs to.
 */

const CONTROL_BASE =
  "w-full rounded-xl border bg-surface px-3.5 text-ink shadow-xs " +
  "transition-[border-color,box-shadow,background-color] duration-200 " +
  "placeholder:text-ink-subtle " +
  "hover:border-line-strong " +
  "focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 " +
  "disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-subtle";

const CONTROL_SIZE = "h-12 text-base sm:h-11 sm:text-sm";

function controlClasses(hasError?: boolean, className?: string) {
  return cn(
    CONTROL_BASE,
    hasError
      ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
      : "border-line",
    className,
  );
}

// ── Field wrapper ───────────────────────────────────────────────────────────

export type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string | string[];
  hint?: string;
  required?: boolean;
  /** Visually hides the label while keeping it available to screen readers. */
  hideLabel?: boolean;
  children: ReactNode;
  className?: string;
  /** Rendered on the right of the label row, e.g. a character counter. */
  aside?: ReactNode;
};

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  hideLabel,
  children,
  className,
  aside,
}: FieldProps) {
  const message = Array.isArray(error) ? error[0] : error;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className={cn(
            "text-sm font-semibold text-ink",
            hideLabel && "sr-only",
          )}
        >
          {label}
          {required ? (
            <>
              <span aria-hidden="true" className="ml-0.5 text-danger-600">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          ) : (
            <span className="ml-1.5 text-xs font-normal text-ink-subtle">(optional)</span>
          )}
        </label>
        {aside}
      </div>

      {children}

      {message ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-sm font-medium text-danger-700 dark:text-danger-500"
        >
          <Icon name="alert-circle" size={15} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Links a control to its hint/error text for `aria-describedby`. */
export function describedBy(id: string, error?: string | string[], hint?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

// ── Text input ──────────────────────────────────────────────────────────────

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
  iconLeft?: IconName;
  /** Fixed text shown inside the field, e.g. a currency or country prefix. */
  prefix?: string;
};

export function Input({ className, hasError, iconLeft, prefix, ...props }: InputProps) {
  if (iconLeft || prefix) {
    return (
      <div className="relative flex items-center">
        {iconLeft ? (
          <Icon
            name={iconLeft}
            size={18}
            className="pointer-events-none absolute left-3.5 text-ink-subtle"
          />
        ) : null}
        {prefix ? (
          <span className="pointer-events-none absolute left-3.5 text-sm font-medium text-ink-subtle">
            {prefix}
          </span>
        ) : null}
        <input
          className={controlClasses(hasError, cn(CONTROL_SIZE, iconLeft && "pl-11", className))}
          // Prefix width varies with its text, so it is set inline rather than
          // through a Tailwind class the compiler could not see at build time.
          style={prefix ? { paddingLeft: `${prefix.length * 0.62 + 1.4}rem` } : undefined}
          aria-invalid={hasError || undefined}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      className={controlClasses(hasError, cn(CONTROL_SIZE, className))}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}

// ── Textarea ────────────────────────────────────────────────────────────────

export function Textarea({
  className,
  hasError,
  rows = 4,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) {
  return (
    <textarea
      rows={rows}
      className={controlClasses(hasError, cn("resize-y py-3 text-base sm:text-sm", className))}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}

// ── Select ──────────────────────────────────────────────────────────────────

export function Select({
  className,
  hasError,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) {
  return (
    <div className="relative">
      <select
        className={controlClasses(
          hasError,
          cn(CONTROL_SIZE, "appearance-none pr-10", className),
        )}
        aria-invalid={hasError || undefined}
        {...props}
      >
        {children}
      </select>
      <Icon
        name="chevron-down"
        size={18}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
      />
    </div>
  );
}

// ── Checkbox & radio ────────────────────────────────────────────────────────

export function Checkbox({
  label,
  description,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: string }) {
  const generated = useId();
  const inputId = id ?? generated;

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        id={inputId}
        type="checkbox"
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 border-line-strong bg-surface",
          "accent-brand-700 transition-colors",
          "checked:border-brand-700 checked:bg-brand-700",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
        )}
        {...props}
      />
      <label htmlFor={inputId} className="text-sm leading-snug">
        <span className="font-medium text-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-ink-subtle">{description}</span> : null}
      </label>
    </div>
  );
}

/**
 * Selectable card used for radio-style choices that need room to explain
 * themselves (service type, part grade). Built on a real `<input type=radio>`
 * so keyboard arrow-key navigation and form semantics come for free.
 */
export function OptionCard({
  name,
  value,
  checked,
  onChange,
  icon,
  title,
  description,
  meta,
  badge,
  disabled,
  className,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  icon?: IconName;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const generated = useId();
  const inputId = `${name}-${value}-${generated}`;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group relative flex cursor-pointer gap-4 rounded-xl border-2 p-4 transition-[border-color,background-color,box-shadow] duration-200",
        checked
          ? "border-brand-600 bg-brand-50 shadow-md dark:border-brand-500 dark:bg-brand-950/60"
          : "border-line bg-surface hover:border-brand-300 hover:bg-brand-50/50 dark:hover:border-brand-700 dark:hover:bg-brand-950/30",
        disabled && "pointer-events-none opacity-55",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500",
        className,
      )}
    >
      <input
        id={inputId}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="sr-only"
      />

      {icon ? (
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
            checked
              ? "bg-brand-700 text-white"
              : "bg-sunken text-ink-muted group-hover:bg-brand-100 group-hover:text-brand-700 dark:group-hover:bg-brand-900",
          )}
        >
          <Icon name={icon} size={21} />
        </span>
      ) : null}

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-display text-sm font-bold text-ink">{title}</span>
          {badge}
        </span>
        {description ? (
          <span className="mt-1 block text-sm leading-snug text-ink-muted">{description}</span>
        ) : null}
        {meta ? <span className="mt-2 block">{meta}</span> : null}
      </span>

      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          checked ? "border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500" : "border-line-strong",
        )}
      >
        {checked ? <Icon name="check" size={12} strokeWidth={3} /> : null}
      </span>
    </label>
  );
}

// ── Segmented control ───────────────────────────────────────────────────────

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: Array<{ value: T; label: string; icon?: IconName }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-line bg-sunken p-1",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors duration-200",
              selected
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {option.icon ? <Icon name={option.icon} size={15} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
