"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";

type Theme = "light" | "dark";

/**
 * Light/dark toggle.
 *
 * The class is applied by an inline script in the document head before paint
 * (see `ThemeScript`), so there is no flash of the wrong theme on load. This
 * component only reflects and updates that state.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("mmf-theme", next);
    } catch {
      // Private browsing or blocked storage — the toggle still works for this
      // page view, it just will not be remembered.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      // Before hydration the real theme is unknown, so the control is inert but
      // still occupies its space to avoid a layout shift.
      aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} theme` : "Toggle theme"}
      title={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} theme` : "Toggle theme"}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink-muted transition-colors duration-200 hover:bg-sunken hover:text-ink ${className ?? ""}`}
    >
      {mounted ? (
        <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
      ) : (
        <span className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}

/**
 * Applies the stored theme before first paint.
 *
 * This must be an inline script in `<head>`: any React-driven approach runs
 * after hydration, by which point the wrong background has already been painted.
 */
export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem('mmf-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&m)){document.documentElement.classList.add('dark')}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
