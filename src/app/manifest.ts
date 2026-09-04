import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";

/** Web app manifest — lets customers add the tracker to a home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — Mobile Phone Repair`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f5f8fd",
    theme_color: "#0f172a",
    orientation: "portrait-primary",
    categories: ["business", "utilities"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Book a repair", url: "/book", description: "Start a new repair booking" },
      { name: "Track a repair", url: "/track", description: "Check the status of a repair" },
      { name: "Repair prices", url: "/pricing", description: "Search the price list" },
    ],
  };
}
