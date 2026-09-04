import { siteConfig } from "./config";

/**
 * Money helpers.
 *
 * Every amount in the system is a whole-rupee integer. Formatting happens only
 * at render time; arithmetic never touches a formatted string.
 */

const formatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  notation: "compact",
  maximumFractionDigits: 1,
});

/** `4999` → `"₹4,999"` */
export function formatMoney(amount: number): string {
  return formatter.format(Math.round(amount));
}

/** `125000` → `"₹1.3L"` — for dashboard stat tiles where space is tight. */
export function formatMoneyCompact(amount: number): string {
  return compactFormatter.format(Math.round(amount));
}

/**
 * Converts whole rupees to the minor unit expected by payment gateways
 * (Razorpay, Stripe). Call this only at the gateway boundary.
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/** Rounds a computed price to the nearest ₹49-ending charm price. */
export function roundToCharmPrice(amount: number): number {
  if (amount <= 0) return 0;
  const rounded = Math.round(amount / 50) * 50;
  return Math.max(49, rounded - 1);
}

/** `90` → `"1 hr 30 min"` */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
  return `${hours} hr ${rest} min`;
}

/** Renders a repair time as a customer-friendly range, e.g. "60–90 minutes". */
export function formatDurationRange(minutes: number): string {
  if (minutes <= 0) return "Varies";
  const upper = Math.round((minutes * 1.5) / 15) * 15;
  if (upper < 60) return `${minutes}–${upper} minutes`;
  return `${formatDuration(minutes)} – ${formatDuration(upper)}`;
}

export function formatWarranty(months: number): string {
  if (months <= 0) return "No warranty";
  if (months === 1) return "1 month warranty";
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} year${years > 1 ? "s" : ""} warranty`;
  }
  return `${months} month warranty`;
}
