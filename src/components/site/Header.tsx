"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { contactConfig, telHref, whatsappChatHref, whatsappDisplay } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Site header.
 *
 * Desktop: a single row that gains a border and blur once the page scrolls, so
 * it never competes with the hero at rest.
 * Mobile: a hamburger opening a full-height panel with the primary action pinned
 * at the bottom, within thumb reach.
 */

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile panel whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 transition-[background-color,box-shadow,border-color] duration-300",
        scrolled
          ? "border-b border-line bg-surface/85 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-surface/70"
          : "border-b border-transparent bg-transparent",
      )}
    >
      {/* Utility strip — the trust and contact line above the main nav. */}
      <div className="hidden border-b border-line/70 bg-brand-950 text-white lg:block">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <p className="flex items-center gap-2 font-medium text-white/85">
            <Icon name="shield-check" size={14} className="text-accent-400" />
            Certified technicians · Quality parts · Warranty on every repair
          </p>
          <div className="flex items-center gap-5">
            <a
              href={telHref}
              className="flex items-center gap-1.5 font-medium text-white/85 transition-colors hover:text-accent-300"
            >
              <Icon name="phone" size={13} />
              {contactConfig.phone}
            </a>
            <a
              href={whatsappChatHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-semibold text-white transition-colors hover:text-accent-300"
            >
              <Icon name="whatsapp" size={13} />
              WhatsApp {whatsappDisplay}
            </a>
            <Link
              href="/track"
              className="flex items-center gap-1.5 font-semibold text-accent-300 transition-colors hover:text-accent-200"
            >
              <Icon name="search" size={13} />
              Track Repair
            </Link>
          </div>
        </div>
      </div>

      <nav className="container-page flex h-16 items-center justify-between gap-4 lg:h-18" aria-label="Main">
        <Logo />

        <ul className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200",
                  isActive(link.href)
                    ? "text-brand-700 dark:text-accent-300"
                    : "text-ink-muted hover:bg-sunken hover:text-ink",
                )}
              >
                {link.label}
                {isActive(link.href) ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-accent-500"
                  />
                ) : null}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:flex" />
          <Link
            href="/track"
            className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-sunken hover:text-ink lg:hidden xl:block"
          >
            Track Repair
          </Link>
          <ButtonLink href="/book" size="md" className="hidden sm:inline-flex" iconRight="arrow-right">
            Book a Repair
          </ButtonLink>

          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-ink transition-colors hover:bg-sunken lg:hidden"
          >
            <Icon name={menuOpen ? "close" : "menu"} size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile panel */}
      {menuOpen ? (
        <div className="fixed inset-0 top-16 z-30 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            ref={panelRef}
            id="mobile-menu"
            className="animate-fade-in relative flex h-[calc(100dvh-4rem)] flex-col overflow-y-auto border-t border-line bg-surface"
          >
            <ul className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold transition-colors",
                      isActive(link.href)
                        ? "bg-brand-50 text-brand-800 dark:bg-brand-950/70 dark:text-brand-100"
                        : "text-ink hover:bg-sunken",
                    )}
                  >
                    {link.label}
                    <Icon name="chevron-right" size={17} className="text-ink-subtle" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/track"
                  className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold text-ink hover:bg-sunken"
                >
                  Track Repair
                  <Icon name="search" size={17} className="text-ink-subtle" />
                </Link>
              </li>
            </ul>

            <div className="mt-auto space-y-3 border-t border-line bg-sunken p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between">
                <a
                  href={telHref}
                  className="flex items-center gap-2 text-sm font-semibold text-ink-muted"
                >
                  <Icon name="phone" size={16} />
                  {contactConfig.phone}
                </a>
                <ThemeToggle />
              </div>
              <ButtonLink
                href={whatsappChatHref()}
                external
                size="lg"
                variant="outline"
                fullWidth
                iconLeft="whatsapp"
              >
                Chat on WhatsApp
              </ButtonLink>
              <ButtonLink href="/book" size="lg" fullWidth iconRight="arrow-right">
                Book a Repair
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
