"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Icon, type IconName } from "@/components/icons";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api-client";
import { ROLE_LABEL, hasPermission, type Permission, type Role } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";

/**
 * Admin shell: sidebar, top bar and mobile drawer.
 *
 * Navigation items are filtered by the signed-in role, but that is presentation
 * only — the server re-checks the same permission on every route and every API
 * call, so hiding a link is never what keeps anyone out.
 */

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  permission: Permission;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", permission: "bookings:read", exact: true },
  { href: "/admin/bookings", label: "Bookings", icon: "list", permission: "bookings:read" },
  { href: "/admin/customers", label: "Customers", icon: "users", permission: "customers:read" },
  { href: "/admin/catalog", label: "Catalogue & pricing", icon: "package", permission: "catalog:read" },
  { href: "/admin/analytics", label: "Analytics", icon: "chart", permission: "analytics:read" },
  { href: "/admin/messages", label: "Messages", icon: "inbox", permission: "messages:read" },
];

export function AdminShell({
  user,
  pendingCount,
  unreadMessages,
  children,
}: {
  user: { id: string; name: string; email: string; role: Role };
  pendingCount: number;
  unreadMessages: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const visibleNav = NAV.filter((item) => hasPermission(user.role, item.permission));

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await api.post("/api/auth/logout");
      toast.success("Signed out");
      router.replace("/admin/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out", "Please try again.");
      setSigningOut(false);
    }
  };

  const badgeFor = (href: string) =>
    href === "/admin/bookings" ? pendingCount : href === "/admin/messages" ? unreadMessages : 0;

  const navList = (
    <ul className="space-y-1">
      {visibleNav.map((item) => {
        const active = isActive(item);
        const badge = badgeFor(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200",
                active
                  ? "bg-brand-950 text-white dark:bg-brand-700"
                  : "text-ink-muted hover:bg-sunken hover:text-ink",
              )}
            >
              <Icon name={item.icon} size={18} />
              <span className="flex-1">{item.label}</span>
              {badge > 0 ? (
                <span
                  className={cn(
                    "tabular rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                    active ? "bg-white/20 text-white" : "bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-100",
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex min-h-dvh bg-canvas">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="border-b border-line px-5 py-4">
          <Logo href="/admin" />
        </div>

        <nav aria-label="Admin sections" className="flex-1 overflow-y-auto p-3">
          {navList}
        </nav>

        <div className="border-t border-line p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <Icon name="external" size={17} />
            View public site
          </Link>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
          />
          <div className="animate-fade-in relative flex h-full w-72 max-w-[85vw] flex-col border-r border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo href="/admin" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-subtle hover:bg-sunken hover:text-ink"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <nav aria-label="Admin sections" className="flex-1 overflow-y-auto p-3">
              {navList}
            </nav>
            <div className="border-t border-line p-3">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-muted hover:bg-sunken hover:text-ink"
              >
                <Icon name="external" size={17} />
                View public site
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-lg">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                aria-expanded={drawerOpen}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink transition-colors hover:bg-sunken lg:hidden"
              >
                <Icon name="menu" size={19} />
              </button>
              <div className="lg:hidden">
                <Logo href="/admin" showWordmark={false} size={32} />
              </div>
              <p className="hidden text-sm font-semibold text-ink-muted lg:block">
                {visibleNav.find(isActive)?.label ?? "Admin"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              <div className="flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-1.5">
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-950 text-[11px] font-bold text-white dark:bg-brand-700"
                >
                  {initials(user.name)}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate text-xs font-semibold text-ink">{user.name}</span>
                  <span className="block text-[11px] text-ink-subtle">
                    {ROLE_LABEL[user.role]}
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                aria-label="Sign out"
                title="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink-muted transition-colors hover:bg-danger-50 hover:text-danger-700 disabled:opacity-50 dark:hover:bg-danger-900/40 dark:hover:text-danger-200"
              >
                <Icon name={signingOut ? "loader" : "logout"} size={18} className={signingOut ? "animate-spin-slow" : undefined} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
