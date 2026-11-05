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

/** A reference to the business entity, for `provider`, `publisher` and the like. */
export const businessRef = { "@id": businessId } as const;

/**
 * Where the business works: the named localities once the owner fills them in
 * (src/config/business.ts), always followed by Delhi NCR as the overall area.
 */
export function areaServed() {
  const named = BUSINESS.serviceAreas.map(filled).filter((name): name is string => Boolean(name));
  const fromEnv = named.length > 0 ? named : locationConfig.serviceAreas;
  return [
    ...fromEnv.map((name) => ({ "@type": "Place", name })),
    { "@type": "City", name: "Delhi" },
    { "@type": "AdministrativeArea", name: "Delhi NCR" },
  ];
}

/**
 * The full business entity. Emitted once per page by the public site layout,
 * so every page — including the city landing pages — carries it under one @id.
 *
 * Facts come from src/config/business.ts. Any value still a `{{PLACEHOLDER}}`
 * is left out: a placeholder in JSON-LD would be read as a real value.
 */
export function businessSchema() {
  const { latitude, longitude, profiles } = locationConfig;
  const streetAddress = [filled(BUSINESS.addressLine1), BUSINESS.addressLine2]
    .filter(Boolean)
    .join(", ");
  const sameAs = [filled(BUSINESS.googleBusinessProfileUrl), ...profiles].filter(
    (url): url is string => Boolean(url),
  );
  const legalName = filled(BUSINESS.legalName);
  const priceRange = filled(BUSINESS.priceRange);
  const gstin = filled(BUSINESS.gstin);
  const foundingDate = filled(BUSINESS.founded);

  return {
    // MobilePhoneStore is a LocalBusiness subtype; chosen by the owner.
    "@type": "MobilePhoneStore",
    "@id": businessId,
    name: BUSINESS.tradingName,
    ...(legalName ? { legalName } : {}),
    ...(gstin ? { taxID: gstin } : {}),
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
    address: {
      "@type": "PostalAddress",
      ...(streetAddress ? { streetAddress } : {}),
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.state,
      postalCode: BUSINESS.pin,
      addressCountry: "IN",
    },
    ...(latitude && longitude
      ? { geo: { "@type": "GeoCoordinates", latitude, longitude } }
      : {}),
    // Matches BUSINESS.hours: Mon–Sat, 9:00 AM – 8:00 PM.
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "20:00",
    },
    areaServed: areaServed(),
    ...(sameAs.length > 0 ? { sameAs } : {}),
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
