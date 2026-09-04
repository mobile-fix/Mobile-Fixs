"use client";

import { Icon } from "@/components/icons";

/** Opens the browser print dialog — customers keep a paper copy of the booking. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
    >
      <Icon name="print" size={15} />
      Print
    </button>
  );
}
