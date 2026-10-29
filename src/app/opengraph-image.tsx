import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/config";

/**
 * Default link-preview image (WhatsApp, Facebook, X, LinkedIn, Google Discover).
 *
 * Drawn from code rather than shipped as a PNG so the brand name stays in step
 * with NEXT_PUBLIC_BRAND_NAME. Pages inherit it unless they define their own.
 */

// Edge: the Node build of next/og cannot load its bundled font from a Windows
// path, which breaks local development there. Edge works on every platform.
export const runtime = "edge";
export const alt =`${siteConfig.name} — doorstep mobile phone repair with warranty`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #16244f 0%, #1e3a8a 60%, #274d97 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* The site icon, redrawn at preview size. */}
          <svg width="96" height="96" viewBox="0 0 40 40">
            <rect width="40" height="40" rx="11" fill="#0f172a" />
            <rect x="12" y="8.5" width="16" height="23" rx="3.4" fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="1.9" />
            <path d="m15.8 20.4 3.1 3.2 6-6.7" fill="none" stroke="#ecb31f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17.6 28.6h4.8" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: -1 }}>{siteConfig.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Mobile phone repair at your doorstep
          </div>
          <div style={{ fontSize: 34, color: "#cbd5f5" }}>
            iPhone · Samsung · OnePlus · Xiaomi · all Android phones
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 28 }}>
          {["Screen", "Battery", "Charging port", "Warranty on every repair"].map((label, index) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 999,
                background: index === 3 ? "#ecb31f" : "rgba(255,255,255,0.12)",
                color: index === 3 ? "#16244f" : "#ffffff",
                fontWeight: index === 3 ? 700 : 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
