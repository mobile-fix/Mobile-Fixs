import { BUSINESS, COVERAGE_LINE } from "@/config/business";

/**
 * A map centred on the locality we work from — not a shop pin, because there
 * is no shop. Keyless Google Maps embed (allowed by the CSP's frame-src),
 * lazy-loaded so it costs nothing until it scrolls into view.
 */
export function AreaMap({ className }: { className?: string }) {
  const query = encodeURIComponent(`${BUSINESS.locality}, ${BUSINESS.city} ${BUSINESS.pin}`);
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <iframe
          title={`Map of ${BUSINESS.locality}, ${BUSINESS.city}, the area MyMobiFix works from`}
          src={`https://www.google.com/maps?q=${query}&z=14&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-72 w-full border-0 sm:h-80"
        />
      </div>
      <figcaption className="mt-3 text-sm text-ink-muted">{COVERAGE_LINE}</figcaption>
    </figure>
  );
}
