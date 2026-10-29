import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Seamless logo marquee.
 *
 * Performance notes:
 *  - The scroll is a pure CSS `@keyframes` on `transform` (see `.marquee-track`
 *    in globals.css), so it runs on the compositor thread. No JavaScript, no
 *    rAF loop, no re-render — the component ships zero client bytes.
 *  - The list is rendered twice and the track translates by exactly -50%, so the
 *    second copy lands where the first began and the loop is invisible.
 *  - Only the first copy is exposed to assistive technology (and links to the
 *    brand's /repair page); the duplicate is
 *    `aria-hidden`, otherwise every brand would be announced twice.
 *  - `prefers-reduced-motion` halts the animation via the global media query.
 */

export type MarqueeLogo = {
  src: string;
  alt: string;
  /** Catalogue slug; the first copy links to /repair/<slug>. */
  slug: string;
  /** Tailwind gradient stops revealed behind the logo on hover. */
  gradient: { from: string; to: string };
};

/**
 * The device brands we actually carry parts for — the same eight
 * that lead the seeded catalogue, so the marquee never advertises a brand the
 * booking flow cannot quote.
 */
export const REPAIR_BRANDS: MarqueeLogo[] = [
  { src: "/logos/apple.svg", slug: "apple", alt: "Apple", gradient: { from: "#64748b", to: "#0f172a" } },
  { src: "/logos/samsung.svg", slug: "samsung", alt: "Samsung", gradient: { from: "#1e3a8a", to: "#3260b6" } },
  { src: "/logos/google.svg", slug: "google", alt: "Google", gradient: { from: "#0ea5e9", to: "#0369a1" } },
  { src: "/logos/oneplus.svg", slug: "oneplus", alt: "OnePlus", gradient: { from: "#f43f5e", to: "#be123c" } },
  { src: "/logos/xiaomi.svg", slug: "xiaomi", alt: "Xiaomi", gradient: { from: "#f59e0b", to: "#b45309" } },
  { src: "/logos/oppo.svg", slug: "oppo", alt: "Oppo", gradient: { from: "#10b981", to: "#047857" } },
  { src: "/logos/vivo.svg", slug: "vivo", alt: "Vivo", gradient: { from: "#3260b6", to: "#16244f" } },
  { src: "/logos/realme.svg", slug: "realme", alt: "Realme", gradient: { from: "#ecb31f", to: "#a76d03" } },
];

export function LogoMarquee({
  logos = REPAIR_BRANDS,
  /** Seconds for one full cycle. Longer list → raise this to keep speed even. */
  durationSeconds = 40,
  className,
}: {
  logos?: MarqueeLogo[];
  durationSeconds?: number;
  className?: string;
}) {
  return (
    <section
      aria-label="Device brands we repair"
      className={cn("marquee-viewport relative w-full overflow-hidden", className)}
      style={{
        // Fade both edges so cards enter and leave without a hard cut.
        maskImage:
          "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
      }}
    >
      <div
        className="marquee-track gap-5 px-2.5"
        style={{ "--marquee-duration": `${durationSeconds}s` } as React.CSSProperties}
      >
        {logos.map((logo) => (
          <LogoCard key={logo.alt} logo={logo} />
        ))}
        {/* Second pass: purely visual, so it is hidden from screen readers. */}
        {logos.map((logo) => (
          <LogoCard key={`duplicate-${logo.alt}`} logo={logo} duplicate />
        ))}
      </div>
    </section>
  );
}

function LogoCard({ logo, duplicate }: { logo: MarqueeLogo; duplicate?: boolean }) {
  const cardClasses =
    "group relative h-24 w-40 shrink-0 flex items-center justify-center rounded-full bg-white border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all overflow-hidden";

  const inner = (
    <>
      {/* Brand wash — scaled up and invisible until hover, then settles to fill. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-150 opacity-0 transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100"
        style={{
          backgroundImage: `linear-gradient(135deg, ${logo.gradient.from}, ${logo.gradient.to})`,
        }}
      />

      <img
        src={logo.src}
        alt={duplicate ? "" : `${logo.alt} phone repair`}
        width={220}
        height={48}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="relative z-10 h-6 w-auto max-w-[70%] object-contain opacity-80 transition-all duration-500 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert"
      />
    </>
  );

  // The duplicate pass is aria-hidden, so it must not hold focusable links:
  // only the first copy links through to the brand's landing page.
  if (duplicate) {
    return (
      <div aria-hidden="true" className={cardClasses}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/repair/${logo.slug}`}
      className={cn(cardClasses, "focus-visible:outline-2 focus-visible:outline-offset-2")}
    >
      {inner}
    </Link>
  );
}
