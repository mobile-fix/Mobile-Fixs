import { BUSINESS, filled } from "@/config/business";
import { contactConfig, locationConfig, siteConfig } from "@/lib/config";

/**
 * Shared schema.org building blocks.
 *
 * The business is described once, under a stable @id, and every other entity
 * (services, the website, offers) points at that @id. Google then sees one
 * business rather than several unlinked ones with slightly different details.
 */

export const businessId = `${siteConfig.url}/#business`;
export const websiteId = `${siteConfig.url}/#website`;
export const serviceId = `${siteConfig.url}/#service`;

/** A reference to the business entity, for `provider`, `publisher` and the like. */
export const businessRef = { "@id": businessId } as const;

/**
 * Where the business works: the named areas from src/config/business.ts plus
 * the overall region (West Delhi), each as a Place. Delhi only, matching the
 * ad targeting.
 */
export function areaServed() {
  return [...BUSINESS.serviceAreas, BUSINESS.region].map((name) => ({
    "@type": "Place",
    name: `${name}, ${BUSINESS.city}`,
  }));
}

const OPENING_HOURS = {
  "@type": "OpeningHoursSpecification",
  // Matches BUSINESS.hours: Mon–Sat, 9:00 AM – 8:00 PM.
  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  opens: "09:00",
  closes: "20:00",
} as const;

/**
 * The full business entity. Emitted once per page by the public site layout,
 * so every page — including the city landing pages — carries it under one @id.
 *
 * Facts come from src/config/business.ts. Any value still a `{{PLACEHOLDER}}`
 * is left out: a placeholder in JSON-LD would be read as a real value.
 */
export function businessSchema() {
  const { latitude, longitude, profiles } = locationConfig;
  const sameAs = [filled(BUSINESS.googleBusinessProfileUrl), ...profiles].filter(
    (url): url is string => Boolean(url),
  );
  const legalName = filled(BUSINESS.legalName);
  const priceRange = filled(BUSINESS.priceRange);
  const foundingDate = filled(BUSINESS.founded);

  return {
    // MobilePhoneStore is a LocalBusiness subtype; chosen by the owner.
    "@type": "MobilePhoneStore",
    "@id": businessId,
    name: BUSINESS.tradingName,
    ...(legalName ? { legalName } : {}),
    ...(foundingDate ? { foundingDate } : {}),
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.svg`,
    image: `${siteConfig.url}/opengraph-image`,
    telephone: BUSINESS.phoneE164,
    email: contactConfig.email,
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, UPI, Credit Card, Debit Card",
    ...(priceRange ? { priceRange } : {}),
    // Locality only: there is no shop, so no street address is published.
    address: {
      "@type": "PostalAddress",
      addressLocality: `${BUSINESS.locality}, ${BUSINESS.city}`,
      addressRegion: BUSINESS.state,
      postalCode: BUSINESS.pin,
      addressCountry: "IN",
    },
    ...(latitude && longitude
      ? { geo: { "@type": "GeoCoordinates", latitude, longitude } }
      : {}),
    openingHoursSpecification: OPENING_HOURS,
    areaServed: areaServed(),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/**
 * The service itself: doorstep phone part replacement, provided by the
 * business, in the areas it covers, during its hours.
 */
export function serviceSchema() {
  return {
    "@type": "Service",
    "@id": serviceId,
    name: "Doorstep phone part replacement",
    serviceType: "Mobile phone component replacement",
    description:
      "Screen, battery, charging port, back glass and camera replacement done in person at the customer's address, or after a free pickup. No walk-in shop.",
    provider: businessRef,
    areaServed: areaServed(),
    hoursAvailable: OPENING_HOURS,
  };
}

/** The website entity, published by the business. */
export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": websiteId,
    url: siteConfig.url,
    name: siteConfig.name,
    inLanguage: "en-IN",
    publisher: businessRef,
  };
}
