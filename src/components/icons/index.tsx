import type { SVGProps } from "react";

/**
 * Icon system.
 *
 * Every icon is an inline SVG on a shared 24×24 grid with `currentColor` strokes
 * — no emoji, no icon font, no network request. Decorative icons get
 * `aria-hidden`; an icon that carries meaning on its own takes a `title`, which
 * turns it into an `img` role with an accessible name.
 */

export type IconName =
  // Navigation & chrome
  | "menu" | "close" | "chevron-down" | "chevron-right" | "chevron-left" | "chevron-up"
  | "arrow-right" | "arrow-left" | "arrow-up-right" | "external"
  // Repair services
  | "screen" | "battery" | "charging" | "backglass" | "camera" | "selfie"
  | "speaker" | "microphone" | "water" | "button" | "software" | "diagnostic" | "wrench"
  // Service types
  | "store" | "truck" | "home"
  // Trust & marketing
  | "shield-check" | "badge-check" | "sparkles" | "clock" | "tag" | "star"
  | "star-half" | "star-outline" | "award" | "leaf" | "lock" | "zap"
  // Contact
  | "phone" | "mail" | "map-pin" | "whatsapp" | "message"
  // Admin & UI
  | "dashboard" | "calendar" | "users" | "package" | "chart" | "settings"
  | "logout" | "search" | "filter" | "plus" | "edit" | "trash" | "check"
  | "alert-triangle" | "alert-circle" | "info" | "refresh" | "loader"
  | "download" | "print" | "copy" | "sun" | "moon" | "eye" | "eye-off"
  | "device" | "list" | "inbox" | "trending-up" | "trending-down" | "minus"
  | "check-circle" | "x-circle" | "clock-history" | "user" | "rupee";

type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: IconName;
  size?: number | string;
  /** Supplying a title makes the icon meaningful to assistive technology. */
  title?: string;
};

/** Stroke-based paths (Lucide geometry) drawn on a 24×24 viewBox. */
const PATHS: Record<IconName, React.ReactNode> = {
  menu: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
  close: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  "chevron-up": <path d="m6 15 6-6 6 6" />,
  "arrow-right": <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  "arrow-left": <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
  "arrow-up-right": <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
  external: <><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M21 14v7H3V3h7" /></>,

  screen: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2.5" />
      <path d="M9 18h6" />
      <path d="m8.5 6.5 3.5 3.5-3.5 3.5" opacity="0.5" />
      <path d="M15.5 13.5 12 10" opacity="0.5" />
    </>
  ),
  battery: (
    <>
      <rect x="2" y="7" width="16" height="10" rx="2.5" />
      <path d="M22 11v2" />
      <path d="M6 10.5v3" />
      <path d="M10 10.5v3" />
    </>
  ),
  charging: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="m12.5 8-2 4h3l-2 4" />
    </>
  ),
  backglass: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2.5" />
      <path d="m9 7 6 10" opacity="0.65" />
      <path d="m14 6-3 5 2 2-2.5 4" opacity="0.65" />
    </>
  ),
  camera: (
    <>
      <path d="M14.5 4h-5L8 6.5H5A2 2 0 0 0 3 8.5v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-3Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </>
  ),
  selfie: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2.5" />
      <circle cx="12" cy="8" r="1.6" />
      <path d="M8.5 16.5a3.5 3.5 0 0 1 7 0" />
    </>
  ),
  speaker: (
    <>
      <path d="M11 5 6.5 9H3v6h3.5L11 19z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  microphone: (
    <>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v4" />
      <path d="M8.5 22h7" />
    </>
  ),
  water: <path d="M12 2.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5Z" />,
  button: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2.5" />
      <path d="M21 8.5v3" />
      <path d="M3 8v2.5" />
      <path d="M3 12.5V15" />
    </>
  ),
  software: (
    <>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m13.5 5-3 14" />
    </>
  ),
  diagnostic: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M8 11h1.5l1 2.5 2-5 1 2.5H15" />
    </>
  ),
  wrench: <path d="M14.7 6.3a4.5 4.5 0 0 0 5.9 5.9L21 12l-8.5 8.5a2.5 2.5 0 0 1-3.5-3.5L17.5 8.5Z" />,

  store: (
    <>
      <path d="M3 9.5 4.5 4h15L21 9.5" />
      <path d="M3 9.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M5 12v8h14v-8" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  truck: (
    <>
      <path d="M2 6.5h11v10H2z" />
      <path d="M13 10h4l4 3.5v3h-8" />
      <circle cx="7" cy="18.5" r="2" />
      <circle cx="17" cy="18.5" r="2" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),

  "shield-check": (
    <>
      <path d="M12 2.5 4.5 5.5v6c0 4.7 3.2 8.5 7.5 10 4.3-1.5 7.5-5.3 7.5-10v-6Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  "badge-check": (
    <>
      <path d="m12 2 2.3 2 3.1-.3 1 3 2.7 1.6-1.1 2.9 1.1 2.9-2.7 1.6-1 3-3.1-.3L12 22l-2.3-2-3.1.3-1-3L2.9 15.7 4 12.8 2.9 9.9l2.7-1.6 1-3 3.1.3Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3.5 13.6 8 18 9.5 13.6 11 12 15.5 10.4 11 6 9.5 10.4 8Z" />
      <path d="M18.5 15.5 19.3 18l2.2.8-2.2.8-.8 2.4-.8-2.4-2.2-.8 2.2-.8Z" />
    </>
  ),
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5.5l3.5 2" /></>,
  "clock-history": (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3 4v4.5h4.5" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  tag: (
    <>
      <path d="M20.5 12.5 12 21 3 12V3h9Z" />
      <circle cx="7.5" cy="7.5" r="1.4" />
    </>
  ),
  rupee: <><path d="M7 4h10" /><path d="M7 9h10" /><path d="M14 4c0 4-3 5-7 5l7 11" /></>,
  star: <path d="m12 3.5 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.9l6-.9Z" fill="currentColor" />,
  "star-half": (
    <>
      <path d="m12 3.5 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.9l6-.9Z" />
      <path d="M12 3.5v13.8l-5.4 2.8 1-6L3.3 9.9l6-.9Z" fill="currentColor" stroke="none" />
    </>
  ),
  "star-outline": <path d="m12 3.5 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.9l6-.9Z" />,
  award: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="m8.5 14-1.5 7 5-2.5 5 2.5-1.5-7" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4c0 9-5.5 14-12 14a5 5 0 0 1 0-10c4 0 7-1.5 12-4Z" />
      <path d="M4 21c2-6 6-9 12-11" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  zap: <path d="M13.5 2.5 5 13.5h6L10.5 21.5 19 10.5h-6Z" />,

  phone: (
    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />
  ),
  mail: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  "map-pin": (
    <>
      <path d="M12 21.5c4-4.5 7-8 7-11a7 7 0 1 0-14 0c0 3 3 6.5 7 11Z" />
      <circle cx="12" cy="10.5" r="2.6" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M3.5 20.5 5 16.4A8.4 8.4 0 1 1 8.2 19.5Z" />
      <path d="M9 9.2c.3 2.4 2.4 4.5 4.8 4.8.5 0 1-.4 1.1-.9l.1-.7-2-.9-.8.9a5.7 5.7 0 0 1-1.6-1.6l.9-.8-.9-2-.7.1c-.5.1-.9.6-.9 1.1Z" />
    </>
  ),
  message: (
    <path d="M21 12a8 8 0 0 1-8 8H4l1.6-3.2A8 8 0 1 1 21 12Z" />
  ),

  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="8.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="2" />
      <rect x="3" y="14.5" width="7.5" height="6.5" rx="2" />
      <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 5.6" />
      <path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  package: (
    <>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5Z" />
      <path d="m3.5 7.5 8.5 4.5 8.5-4.5" />
      <path d="M12 12v9" />
    </>
  ),
  device: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 3.5v17h17" />
      <path d="M7.5 15.5v-3" />
      <path d="M12 15.5v-7" />
      <path d="M16.5 15.5v-5" />
    </>
  ),
  "trending-up": <><path d="m3 16 5.5-5.5 3.5 3.5L21 5.5" /><path d="M16 5.5h5v5" /></>,
  "trending-down": <><path d="m3 8 5.5 5.5 3.5-3.5L21 18.5" /><path d="M16 18.5h5v-5" /></>,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.5 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z" />
    </>
  ),
  logout: (
    <>
      <path d="M9.5 21H5.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 16 4-4-4-4" />
      <path d="M20 12H9.5" />
    </>
  ),
  search: <><circle cx="11" cy="11" r="7" /><path d="m20.5 20.5-4-4" /></>,
  filter: <path d="M3.5 5h17l-6.5 8v6l-4 2v-8Z" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  edit: (
    <>
      <path d="M12 20h8" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </>
  ),
  trash: (
    <>
      <path d="M3.5 6h17" />
      <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" />
      <path d="M6 6.5 7 20a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 20l1-13.5" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  "check-circle": <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.7 2.7L16 9" /></>,
  "x-circle": <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6" /><path d="m15 9-6 6" /></>,
  "alert-triangle": (
    <>
      <path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4.5" />
      <path d="M12 17h.01" />
    </>
  ),
  "alert-circle": <><circle cx="12" cy="12" r="9" /><path d="M12 7.5V13" /><path d="M12 16.5h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 16v-4.5" /><path d="M12 8h.01" /></>,
  refresh: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
      <path d="M21 3v5h-5" />
    </>
  ),
  loader: <><path d="M12 3v4" opacity="1" /><path d="M12 17v4" opacity="0.3" /><path d="M5.6 5.6 8.5 8.5" opacity="0.85" /><path d="m15.5 15.5 2.9 2.9" opacity="0.45" /><path d="M3 12h4" opacity="0.7" /><path d="M17 12h4" opacity="0.55" /><path d="M5.6 18.4 8.5 15.5" opacity="0.6" /><path d="M15.5 8.5l2.9-2.9" opacity="0.4" /></>,
  download: <><path d="M12 3.5v11" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M4 19.5h16" /></>,
  print: (
    <>
      <path d="M7 8.5V3.5h10v5" />
      <rect x="3.5" y="8.5" width="17" height="8" rx="2" />
      <path d="M7 14.5h10v6H7z" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
      <path d="M4.5 15.5A2 2 0 0 1 3.5 14V5.5a2 2 0 0 1 2-2H14a2 2 0 0 1 1.5.7" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.9 4.9 6.3 6.3" />
      <path d="m17.7 17.7 1.4 1.4" /><path d="M2 12h2" /><path d="M20 12h2" />
      <path d="m4.9 19.1 1.4-1.4" /><path d="m17.7 6.3 1.4-1.4" />
    </>
  ),
  moon: <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
  "eye-off": (
    <>
      <path d="M10 5.7A8.6 8.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 4" />
      <path d="M6.3 7.6A16.7 16.7 0 0 0 2.5 12S6 18.5 12 18.5a8.9 8.9 0 0 0 3.8-.8" />
      <path d="M3 3l18 18" />
    </>
  ),
  list: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3.5 6h.01" /><path d="M3.5 12h.01" /><path d="M3.5 18h.01" /></>,
  inbox: (
    <>
      <path d="M3.5 13h5l1.5 2.5h4L15.5 13h5" />
      <path d="M5.5 4.5h13l2 8.5v5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-5Z" />
    </>
  ),
};

/** Icons drawn as filled shapes rather than strokes. */
const FILLED: ReadonlySet<IconName> = new Set(["star", "water", "zap", "filter", "message", "phone", "moon", "tag"]);

export function Icon({ name, size = 20, title, className, ...props }: IconProps) {
  const isFilled = FILLED.has(name);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={isFilled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={isFilled ? 0 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      // A decorative icon is skipped by screen readers; a titled one is announced.
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}

/** Maps a service `iconKey` from the database to a real icon, with a safe default. */
export function serviceIcon(iconKey: string): IconName {
  const key = iconKey as IconName;
  return key in PATHS ? key : "wrench";
}

/**
 * Brand marks are rendered as a monogram tile rather than as reproduced company
 * logos — we do not ship third-party trademarks as assets.
 */
export function BrandMonogram({
  name,
  className,
  size = 40,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const letters = name
    .replace(/[^A-Za-z ]/g, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      className={className}
      style={{ width: size, height: size }}
      aria-hidden="true"
      data-brand-monogram={name}
    >
      <span className="flex h-full w-full items-center justify-center rounded-xl bg-brand-950 font-display text-[0.8em] font-bold tracking-tight text-white dark:bg-brand-800">
        {letters || "?"}
      </span>
    </span>
  );
}
