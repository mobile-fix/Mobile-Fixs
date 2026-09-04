"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";

/**
 * Copy-to-clipboard button.
 *
 * Confirms in place for two seconds. The clipboard API can be unavailable
 * (insecure origin, denied permission), so failure is reported rather than
 * silently swallowed — a button that appears to work but does not is worse than
 * one that says it could not.
 */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
    >
      <Icon
        name={state === "copied" ? "check" : state === "failed" ? "alert-circle" : "copy"}
        size={15}
      />
      <span>{state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label}</span>
      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied"
          ? `${value} copied to clipboard`
          : state === "failed"
            ? "Could not copy. Select the text and copy it manually."
            : ""}
      </span>
    </button>
  );
}
