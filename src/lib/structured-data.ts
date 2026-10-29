import { DEFAULT_HOURS, contactConfig, locationConfig, siteConfig } from "@/lib/config";

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

/** Where the business works: listed areas, else its city, else India. */
export function areaServed() {
  if (locationConfig.serviceAreas.length > 0) {
    return locationConfig.serviceAreas.map((name) => ({ "@type": "City", name }));
  }
  if (locationConfig.city) return { "@type": "City", name: locationConfig.city };
  return { "@type": "Country", name: "India" };
}

/** The full business entity. Emitted once per page by the public site layout. */
export function businessSchema() {
  const { streetAddress, city, region, postalCode, latitude, longitude, profiles } = locationConfig;
  const hasAddress = Boolean(streetAddress || city || postalCode);

  return {
    // Plain LocalBusiness: schema.org has no phone-repair type, and
    // MobilePhoneStore would describe a shop that sells phones.
    "@type": "LocalBusiness",
    "@id": businessId,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.svg`,
    image: `${siteConfig.url}/opengraph-image`,
    telephone: contactConfig.phone,
    email: contactConfig.email,
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, UPI, Credit Card, Debit Card",
    ...(hasAddress
      ? {
          address: {
            "@type": "PostalAddress",
            ...(streetAddress ? { streetAddress } : {}),
            ...(city ? { addressLocality: city } : {}),
            ...(region ? { addressRegion: region } : {}),
            ...(postalCode ? { postalCode } : {}),
            addressCountry: "IN",
          },
        }
      : {}),
    ...(latitude && longitude
      ? { geo: { "@type": "GeoCoordinates", latitude, longitude } }
      : {}),
    // Machine-readable hours exist only for the default schedule. Custom hours
    // in NEXT_PUBLIC_BUSINESS_HOURS are free text, and Google penalises schema
    // that contradicts what the page shows, so they are shown but not marked up.
    ...(contactConfig.hours === DEFAULT_HOURS
      ? {
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            opens: "09:00",
            closes: "20:00",
          },
        }
      : {}),
    areaServed: areaServed(),
    ...(profiles.length > 0 ? { sameAs: profiles } : {}),
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
