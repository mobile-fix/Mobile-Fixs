import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { siteConfig } from "./config";

/**
 * Conditional className joiner.
 *
 * `clsx` handles the conditional forms (arrays, objects, nested); `twMerge`
 * then resolves Tailwind conflicts so a caller's `className` reliably wins over
 * a component's defaults — `cn("px-4", "px-8")` yields `px-8`, not both.
 */
export function cn(...values: ClassValue[]): string {
  return twMerge(clsx(values));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Normalises an Indian mobile number to 10 digits.
 * Accepts `+91 98765 43210`, `098765-43210`, `9876543210`.
 * Returns null when the input cannot be a valid mobile number.
 */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let national = digits;
  if (national.length === 12 && national.startsWith("91")) national = national.slice(2);
  else if (national.length === 11 && national.startsWith("0")) national = national.slice(1);
  if (national.length !== 10) return null;
  // Indian mobile numbers start with 6–9.
  if (!/^[6-9]/.test(national)) return null;
  return national;
}

/** `9876543210` → `"98765 43210"` */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return phone;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/** Masks all but the last 4 characters — used for IMEI display. */
export function maskIdentifier(value: string | null | undefined): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (trimmed.length <= 4) return trimmed;
  return `${"•".repeat(Math.min(trimmed.length - 4, 11))}${trimmed.slice(-4)}`;
}

const dateFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  day: "numeric",
  month: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date));
}

export function formatShortDate(date: Date | string): string {
  return shortDateFormatter.format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFormatter.format(new Date(date));
}

/** `"2 hours ago"`, `"in 3 days"` */
export function formatRelative(date: Date | string): string {
  const target = new Date(date).getTime();
  const diffSeconds = Math.round((target - Date.now()) / 1000);
  const absolute = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat(siteConfig.locale, { numeric: "auto" });

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [unit, seconds] of units) {
    if (absolute >= seconds) return rtf.format(Math.round(diffSeconds / seconds), unit);
  }
  return rtf.format(diffSeconds, "second");
}

/** ISO `YYYY-MM-DD` in local time (avoids the UTC shift of `toISOString`). */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Two-letter initials for avatar chips. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Percentage change between two periods, guarding against divide-by-zero. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
