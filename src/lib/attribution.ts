/**
 * Ad-click attribution for bookings.
 *
 * When a visitor lands from an ad, the URL carries Google's click ID (gclid,
 * or gbraid / wbraid on iOS) and our UTM tags. The visitor rarely books on that
 * first page, so the values are kept in this browser for 90 days and sent with
 * the booking, where staff can match a booking to the ad click that produced it
 * (and upload offline conversions later).
 *
 * First-party only: nothing here is sent anywhere except our own booking API.
 * Storage access is wrapped because it can throw in private windows.
 */

export type Attribution = {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
};

const STORAGE_KEY = "mmf_attribution";
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

const PARAMS: Array<[keyof Attribution, string]> = [
  ["gclid", "gclid"],
  ["gbraid", "gbraid"],
  ["wbraid", "wbraid"],
  ["utmSource", "utm_source"],
  ["utmMedium", "utm_medium"],
  ["utmCampaign", "utm_campaign"],
  ["utmContent", "utm_content"],
];

/** Click IDs and UTM values are short tokens; anything else is ignored. */
const SAFE_VALUE = /^[A-Za-z0-9._~\-{}|]{1,200}$/;

/**
 * Reads attribution parameters from the current URL and stores them. A new ad
 * click replaces the previous one (last click wins); a visit without any
 * parameters leaves the stored values alone.
 */
export function captureAttribution(search: string = window.location.search): void {
  const params = new URLSearchParams(search);
  const found: Attribution = {};
  for (const [key, param] of PARAMS) {
    const value = params.get(param);
    if (value && SAFE_VALUE.test(value)) found[key] = value;
  }
  if (Object.keys(found).length === 0) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...found, savedAt: Date.now() }));
  } catch {
    // Storage unavailable (private mode, blocked): attribution is best-effort.
  }
}

/** The stored attribution, or undefined when there is none or it has expired. */
export function getAttribution(): Attribution | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const { savedAt, ...stored } = JSON.parse(raw) as Attribution & { savedAt?: number };
    if (!savedAt || Date.now() - savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return undefined;
    }
    const clean: Attribution = {};
    for (const [key] of PARAMS) {
      const value = stored[key];
      if (typeof value === "string" && SAFE_VALUE.test(value)) clean[key] = value;
    }
    return Object.keys(clean).length > 0 ? clean : undefined;
  } catch {
    return undefined;
  }
}
