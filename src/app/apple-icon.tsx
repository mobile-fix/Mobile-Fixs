import { ImageResponse } from "next/og";

/**
 * iOS home-screen icon. Safari ignores SVG icons, so without this a saved
 * bookmark falls back to a screenshot of the page.
 */

// Edge for the same reason as opengraph-image.tsx.
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0f172a" }}>
        <svg width="180" height="180" viewBox="0 0 40 40">
          <rect width="40" height="40" fill="#0f172a" />
          <rect x="12" y="8.5" width="16" height="23" rx="3.4" fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="1.9" />
          <path d="m15.8 20.4 3.1 3.2 6-6.7" fill="none" stroke="#ecb31f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17.6 28.6h4.8" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
