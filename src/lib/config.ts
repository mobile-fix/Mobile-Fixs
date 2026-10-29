/**
 * Runtime configuration.
 *
 * Every externally-configurable value flows through here so nothing is hardcoded
 * in a component. Values prefixed `NEXT_PUBLIC_` are safe in the browser; the
 * rest are read only in server modules.
 *
 * `process.env.X` is referenced literally (not via a dynamic key) because Next.js
 * inlines public env vars at build time by static analysis.
 */

const fallback = (value: string | undefined, defaultValue: string) =>
  value && value.trim().length > 0 ? value.trim() : defaultValue;

export const siteConfig = {
  name: fallback(process.env.NEXT_PUBLIC_BRAND_NAME, "MyMobiFix"),
  domain: "mymobifix.com",
  url: fallback(process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000"),
  tagline: "Your Phone Broken? We Will Fix It.",
  description:
    "Mobile phone repair across Delhi with free pickup and drop or a free at-home visit, same-day for most repairs and a warranty on every repair. Quote on WhatsApp.",
  currency: fallback(process.env.NEXT_PUBLIC_CURRENCY, "INR"),
  locale: "en-IN",
} as const;

/** The opening hours the structured data describes (see lib/structured-data). */
export const DEFAULT_HOURS = "Mon–Sat, 9:00 AM – 8:00 PM IST";

export const contactConfig = {
  phone: fallback(process.env.NEXT_PUBLIC_SUPPORT_PHONE, "+91 93156 02220"),
  email: fallback(process.env.NEXT_PUBLIC_SUPPORT_EMAIL, "support@mymobifix.com"),
  whatsapp: fallback(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, "919315602220"),
  hours: fallback(process.env.NEXT_PUBLIC_BUSINESS_HOURS, DEFAULT_HOURS),
  address: fallback(
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS,
    "Placeholder Address, Sector 00, City 000000",
  ),
  mapsEmbedUrl: fallback(process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL, ""),
} as const;

const list = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

/**
 * Where the business is, for local search. Every field is optional and is left
 * out of the page and the structured data while unset — a made-up address or
 * city is worse for local ranking than none at all.
 */
export const locationConfig = {
  /** The street address, or "" while it is still the placeholder default. */
  streetAddress: /placeholder/i.test(contactConfig.address) ? "" : contactConfig.address,
  city: fallback(process.env.NEXT_PUBLIC_BUSINESS_CITY, ""),
  /** State, e.g. "Haryana". */
  region: fallback(process.env.NEXT_PUBLIC_BUSINESS_REGION, ""),
  postalCode: fallback(process.env.NEXT_PUBLIC_BUSINESS_POSTAL_CODE, ""),
  latitude: Number(process.env.NEXT_PUBLIC_BUSINESS_LATITUDE) || null,
  longitude: Number(process.env.NEXT_PUBLIC_BUSINESS_LONGITUDE) || null,
  /** Cities or localities served, comma-separated, e.g. "Gurugram, South Delhi, Noida". */
  serviceAreas: list(process.env.NEXT_PUBLIC_SERVICE_AREAS),
  /** Google Business Profile and social profile URLs, comma-separated. */
  profiles: list(process.env.NEXT_PUBLIC_BUSINESS_PROFILES),
} as const;

/** One-line address for display, built only from the parts that are real. */
export const displayAddress = [
  locationConfig.streetAddress,
  locationConfig.city,
  locationConfig.region,
  locationConfig.postalCode,
]
  .filter(Boolean)
  .filter((part, index, parts) => parts.indexOf(part) === index)
  .join(", ");

/** Digits-only number suitable for a `tel:` or `wa.me` href. */
export const telHref = `tel:${contactConfig.phone.replace(/[^\d+]/g, "")}`;
export const whatsappHref = contactConfig.whatsapp
  ? `https://wa.me/${contactConfig.whatsapp.replace(/\D/g, "")}`
  : "";

/** WhatsApp number formatted for display, e.g. "+91 93156 02220". */
export const whatsappDisplay = (() => {
  const digits = contactConfig.whatsapp.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91")
    ? `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
    : `+${digits}`;
})();

/**
 * A wa.me link with a pre-filled message. Prices are not published on the site,
 * so every "what will it cost?" path ends in a WhatsApp chat instead.
 */
export function whatsappChatHref(message = "Hi MyMobiFix, I need help repairing my phone.") {
  return `${whatsappHref}?text=${encodeURIComponent(message)}`;
}

/**
 * Ad and analytics tags. Each one is optional: an unset ID means that tag is
 * never loaded, so local and preview builds send nothing anywhere.
 *
 * Google Ads conversions are sent straight to Ads (not imported from GA4) so
 * bidding sees them without GA4's processing delay. Each conversion action
 * created in Google Ads has its own label — the part after the slash in
 * `send_to: "AW-123/AbC-dEf"`.
 */
export const trackingConfig = {
  // NEXT_PUBLIC_ANALYTICS_ID is the original name of this variable; still honoured.
  ga4Id: fallback(process.env.NEXT_PUBLIC_GA4_ID, fallback(process.env.NEXT_PUBLIC_ANALYTICS_ID, "")),
  googleAdsId: fallback(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID, ""),
  googleAdsLabels: {
    booking: fallback(process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL, ""),
    whatsapp: fallback(process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL, ""),
    call: fallback(process.env.NEXT_PUBLIC_GOOGLE_ADS_CALL_LABEL, ""),
    contact: fallback(process.env.NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL, ""),
  },
  metaPixelId: fallback(process.env.NEXT_PUBLIC_META_PIXEL_ID, ""),
  /** Search Console HTML-tag verification token (content of the meta tag). */
  googleSiteVerification: fallback(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION, ""),
  /** Meta Business Manager domain-verification token. */
  metaDomainVerification: fallback(process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION, ""),
} as const;

/**
 * Integration availability. The UI reads these to decide between a live
 * integration and an honest "not configured" state — we never fake a service.
 */
export const integrations = {
  maps: Boolean(fallback(process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL, "")),
  whatsapp: Boolean(contactConfig.whatsapp),
  analytics: Boolean(trackingConfig.ga4Id || trackingConfig.googleAdsId || trackingConfig.metaPixelId),
} as const;

/**
 * Demo-data notice.
 *
 * When a deployment is seeded with illustrative reviews and bookings
 * (`SEED_DEMO_DATA=true`), the site must say so plainly — presenting invented
 * testimonials and repair counts as real would be dishonest. Set
 * `NEXT_PUBLIC_USES_DEMO_DATA=true` on any showcase environment; leave it unset
 * in production, where the seed creates the catalogue only.
 */
export const USES_DEMO_DATA = process.env.NEXT_PUBLIC_USES_DEMO_DATA === "true";
