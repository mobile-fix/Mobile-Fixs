import { AREA_LINE, BUSINESS, COVERAGE_LINE, businessTelHref } from "@/config/business";

/**
 * The address block, in the one shape used everywhere: the area with the
 * no-shopfront statement, hours and phone, then the PIN codes covered.
 */
export function AreaBlock({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p>{AREA_LINE}</p>
      <p>
        {BUSINESS.hours} ·{" "}
        <a href={businessTelHref} className="font-semibold text-ink hover:underline">
          {BUSINESS.phone}
        </a>
      </p>
      <p>{COVERAGE_LINE}</p>
    </div>
  );
}

