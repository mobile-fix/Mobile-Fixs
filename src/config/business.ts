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
 * Address policy (owner decision, 2026-11-05): a locality only — no street line,
 * no tax registration number. There is no walk-in shop; every job is an
 * at-home visit or a free pickup, and the site says so wherever the area shows.
 *
 * Owner-supplied on 2026-11-05: legal name, locality, PIN, founding year,
 * areas and the PIN codes served.
 */
export const BUSINESS = {
  legalName: "MyMobiFix",
  tradingName: "MyMobiFix",
  locality: "Paschim Vihar",
  city: "Delhi",
  state: "Delhi",
  pin: "110045",
  region: "West Delhi",
  phone: "+91 93156 02220",
  phoneE164: "+919315602220",
  hours: "Mon–Sat, 9:00 AM – 8:00 PM",
  /** Named areas served. Shown as their own list — not grouped by PIN. */
  serviceAreas: ["Paschim Vihar", "Peera Garhi", "Meera Bagh"],
  /** PIN codes served, in the owner's order. */
  servicePins: ["110045", "110041", "110063", "110087"],
  founded: "2022",
  /** Google Business Profile URL, for schema.org `sameAs`. */
  googleBusinessProfileUrl: "{{GBP_URL}}",
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

/** The value, or undefined while it is empty or still a placeholder. */
export function filled(value: string): string | undefined {
  return value.trim() === "" || isPlaceholder(value) ? undefined : value;
}

/** "Paschim Vihar, Delhi 110045" — the published area. There is no street line. */
export const areaAddress = `${BUSINESS.locality}, ${BUSINESS.city} ${BUSINESS.pin}`;

/** The three lines shown wherever the address appears (footer, homepage, /about, city pages). */
export const AREA_LINE = `Based in ${areaAddress} — no walk-in shop, we come to you.`;
export const HOURS_LINE = `${BUSINESS.hours} · ${BUSINESS.phone}`;
export const COVERAGE_LINE = `Serving ${BUSINESS.servicePins.join(", ")} and the rest of ${BUSINESS.region}.`;

/** Why the site publishes an area rather than a shop address. */
export const NO_COUNTER_LINE =
  "We have no walk-in counter. Every job is booked as an at-home visit or a free pickup, which is why we publish an area rather than a shop address.";

/** The legal name, only when it differs from the trading name (else it reads twice). */
export const distinctLegalName =
  filled(BUSINESS.legalName) && BUSINESS.legalName !== BUSINESS.tradingName ? BUSINESS.legalName : undefined;

export const businessTelHref = `tel:${BUSINESS.phoneE164}`;

/** The non-affiliation sentence pair used in the footer and on /about. */
export const NON_AFFILIATION = `${TRADEMARK_BRANDS.slice(0, -1).join(", ")} and ${
  TRADEMARK_BRANDS[TRADEMARK_BRANDS.length - 1]
} are trademarks of their respective owners.`;
