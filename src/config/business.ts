/**
 * Who the business is, in one place.
 *
 * Every page footer, the About page, the city landing pages and the
 * LocalBusiness structured data read from here, so the legal name, address and
 * hours can never drift between pages.
 *
 * Values still written as `{{LIKE_THIS}}` are facts only the owner can supply.
 * They are shown on the page exactly as written, so a missing fact is obvious
 * rather than quietly invented, and they are left OUT of structured data
 * (a placeholder in JSON-LD would be read by Google as a real value).
 *
 * Already filled from what the owner gave on 2026-10-29: area "Paschim Vihar",
 * PIN "110045".
 */
export const BUSINESS = {
  legalName: "{{LEGAL_ENTITY_NAME}}",
  tradingName: "MyMobiFix",
  addressLine1: "{{STREET_ADDRESS}}",
  addressLine2: "Paschim Vihar",
  city: "Delhi",
  state: "Delhi",
  pin: "110045",
  gstin: "{{GSTIN}}",
  phone: "+91 93156 02220",
  phoneE164: "+919315602220",
  hours: "Mon–Sat, 9:00 AM – 8:00 PM",
  serviceAreas: ["{{AREA_1}}", "{{AREA_2}}", "{{AREA_3}}"],
  founded: "{{YEAR}}",
  /** Google Business Profile URL, for schema.org `sameAs`. */
  googleBusinessProfileUrl: "{{GOOGLE_BUSINESS_PROFILE_URL}}",
  /** schema.org `priceRange`, e.g. "₹₹". Not published until the owner sets it. */
  priceRange: "{{PRICE_RANGE}}",
} as const;

/** Brands named in the non-affiliation line, in display order. */
export const TRADEMARK_BRANDS = [
  "Apple",
  "Samsung",
  "Google",
  "OnePlus",
  "Xiaomi",
  "Oppo",
  "Vivo",
  "Realme",
  "Nothing",
] as const;

/** True while a value is still an unfilled `{{PLACEHOLDER}}`. */
export function isPlaceholder(value: string): boolean {
  return /\{\{[A-Z0-9_]+\}\}/.test(value);
}

/** The value, or undefined while it is still a placeholder — for structured data. */
export function filled(value: string): string | undefined {
  return isPlaceholder(value) ? undefined : value;
}

/** "{{STREET_ADDRESS}}, Paschim Vihar, Delhi 110045" */
export const fullAddress = `${BUSINESS.addressLine1}, ${BUSINESS.addressLine2}, ${BUSINESS.city} ${BUSINESS.pin}`;

export const businessTelHref = `tel:${BUSINESS.phoneE164}`;

/** The non-affiliation sentence pair used in the footer and on /about. */
export const NON_AFFILIATION = `${TRADEMARK_BRANDS.slice(0, -1).join(", ")} and ${
  TRADEMARK_BRANDS[TRADEMARK_BRANDS.length - 1]
} are trademarks of their respective owners.`;
