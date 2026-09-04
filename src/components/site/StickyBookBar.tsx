"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/Button";
import { telHref } from "@/lib/config";

/**
 * Mobile sticky action bar.
 *
 * Appears only after the user scrolls past the hero, so it never covers the
 * primary CTA it duplicates. Hidden on the booking flow itself (where it would
 * compete with the wizard's own controls) and in the admin area.
 *
 * The bar reserves its own height via padding on `body` so it cannot obscure the
 * end of the page content.
 */
export function StickyBookBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const suppressed =
    pathname.startsWith("/book") || pathname.startsWith("/admin") || pathname.startsWith("/track");

  useEffect(() => {
    if (suppressed) {
      setVisible(false);
      return;
    }

    const onScroll = () => setVisible(window.scrollY > 620);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [suppressed]);

  useEffect(() => {
    document.body.style.paddingBottom = visible ? "5.25rem" : "";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [visible]);

  if (suppressed || !visible) return null;

  return (
    <div className="no-print animate-slide-up fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-xl backdrop-blur-lg lg:hidden">
      <div className="flex items-center gap-3">
        <a
          href={telHref}
          aria-label="Call MyMobiFix"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
        >
          <Icon name="phone" size={19} />
        </a>
        <ButtonLink href="/book" size="lg" fullWidth iconRight="arrow-right">
          Book a Repair
        </ButtonLink>
      </div>
    </div>
  );
}
