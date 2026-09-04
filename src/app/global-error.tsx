"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary.
 *
 * Replaces the whole document when the root layout itself fails, so it must
 * render its own `<html>` and `<body>` and cannot rely on the app's CSS being
 * loaded — hence the inline styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#f5f8fd",
          color: "#0f172a",
          fontFamily: "ui-sans-serif, system-ui, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ maxWidth: "30rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            MyMobiFix is temporarily unavailable
          </h1>
          <p style={{ marginTop: "0.75rem", lineHeight: 1.6, color: "#475569" }}>
            Something failed at the application level. Please try again in a moment.
          </p>
          {error.digest ? (
            <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#64748b" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#ca8a04",
              color: "#0f172a",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
