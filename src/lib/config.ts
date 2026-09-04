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
    "Fast, transparent mobile phone repair. Certified technicians, quality parts, upfront pricing and a warranty on every repair — in store or at your door.",
  currency: fallback(process.env.NEXT_PUBLIC_CURRENCY, "INR"),
  locale: "en-IN",
} as const;

export const contactConfig = {
  phone: fallback(process.env.NEXT_PUBLIC_SUPPORT_PHONE, "+91 00000 00000"),
  email: fallback(process.env.NEXT_PUBLIC_SUPPORT_EMAIL, "support@mymobifix.com"),
  whatsapp: fallback(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, "910000000000"),
  hours: fallback(process.env.NEXT_PUBLIC_BUSINESS_HOURS, "Mon–Sat, 9:00 AM – 8:00 PM IST"),
  address: fallback(
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS,
    "Placeholder Address, Sector 00, City 000000",
  ),
  mapsEmbedUrl: fallback(process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL, ""),
} as const;

/** Digits-only number suitable for a `tel:` or `wa.me` href. */
export const telHref = `tel:${contactConfig.phone.replace(/[^\d+]/g, "")}`;
export const whatsappHref = contactConfig.whatsapp
  ? `https://wa.me/${contactConfig.whatsapp.replace(/\D/g, "")}`
  : "";

/**
 * Integration availability. The UI reads these to decide between a live
 * integration and an honest "not configured" state — we never fake a service.
 */
export const integrations = {
  maps: Boolean(fallback(process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL, "")),
  whatsapp: Boolean(fallback(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, "")),
  analytics: Boolean(fallback(process.env.NEXT_PUBLIC_ANALYTICS_ID, "")),
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
