import { trackingConfig } from "@/lib/config";

/**
 * Conversion tracking.
 *
 * One call fans an event out to every configured tag — GA4, Google Ads and the
 * Meta Pixel — so a component never needs to know which ad platforms are live.
 * Every function is a no-op on the server and when no tag is configured.
 *
 * Event names follow each platform's own standard events, which is what their
 * bidding and reporting understand without extra mapping:
 *   GA4: generate_lead / contact        Meta: Lead / Contact / Schedule
 *
 * Nothing identifying is sent: no names, numbers or form contents, and never a
 * repair reference — the reference alone opens a booking's confirmation page.
 */

type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & { disablePushState?: boolean };

declare global {
  interface Window {
    gtag?: Gtag;
    fbq?: Fbq;
    dataLayer?: unknown[];
  }
}

export type ConversionEvent =
  | { name: "booking_submitted"; service?: string }
  | { name: "whatsapp_click"; location: string }
  | { name: "call_click"; location: string }
  | { name: "email_click"; location: string }
  | { name: "contact_form_submitted"; subject: string };

/**
 * Pages whose URL carries a repair reference, which opens the customer's
 * booking details. No tag loads on them and their paths are never reported.
 */
const PRIVATE_PATHS = ["/book/confirmation", "/track"];

export function isPrivatePath(pathname: string) {
  return PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** A pathname safe to report: private pages collapse to their section. */
export function reportablePath(pathname: string) {
  return PRIVATE_PATHS.find((path) => pathname.startsWith(path)) ?? pathname;
}

function adsConversion(label: string, params: Record<string, unknown> = {}) {
  if (!trackingConfig.googleAdsId || !label || !window.gtag) return;
  window.gtag("event", "conversion", { send_to: `${trackingConfig.googleAdsId}/${label}`, ...params });
}

/**
 * Sends the event. The promise settles once Google confirms receipt, or after
 * half a second — callers about to leave the page await it so the hit is not
 * cut off by the navigation.
 */
export function track(event: ConversionEvent): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const { gtag, fbq } = window;
  if (!gtag && !fbq) return Promise.resolve();
  const labels = trackingConfig.googleAdsLabels;

  let settle = () => {};
  const sent = new Promise<void>((resolve) => {
    settle = resolve;
    setTimeout(resolve, 500);
  });
  // gtag calls this when the GA4 hit is delivered.
  const callback = { event_callback: () => settle() };

  try {
    switch (event.name) {
      case "booking_submitted": {
        // A random ID lets Google Ads and Meta drop a duplicate of this one
        // event without either of them learning the repair reference.
        const eventId = crypto.randomUUID();
        gtag?.("event", "generate_lead", { method: "booking", item_name: event.service, ...callback });
        adsConversion(labels.booking, { transaction_id: eventId });
        fbq?.("track", "Schedule", { content_name: event.service }, { eventID: eventId });
        break;
      }
      case "whatsapp_click":
        gtag?.("event", "generate_lead", { method: "whatsapp", link_location: event.location, ...callback });
        adsConversion(labels.whatsapp);
        fbq?.("track", "Contact", { content_category: "whatsapp" });
        break;
      case "call_click":
        gtag?.("event", "generate_lead", { method: "phone", link_location: event.location, ...callback });
        adsConversion(labels.call);
        fbq?.("track", "Contact", { content_category: "phone" });
        break;
      case "email_click":
        gtag?.("event", "contact", { method: "email", link_location: event.location, ...callback });
        break;
      case "contact_form_submitted":
        gtag?.("event", "generate_lead", { method: "contact_form", subject: event.subject, ...callback });
        adsConversion(labels.contact);
        fbq?.("track", "Lead", { content_category: event.subject });
        break;
    }
  } catch {
    // A blocked or half-loaded tag must never break the page it is measuring.
    settle();
  }

  return sent;
}
