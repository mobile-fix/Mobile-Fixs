import { RateLimitError } from "./errors";

/**
 * Fixed-window rate limiter.
 *
 * Backed by an in-process Map, which is correct for a single instance and for
 * this project's development/demo deployment. For a multi-instance production
 * rollout, set `RATE_LIMIT_REDIS_URL` and swap `hit()` for a Redis `INCR`+`EXPIRE`
 * — the call sites and the thrown error stay identical.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Stops the Map growing without bound in a long-running process. */
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitRule = {
  /** Requests allowed inside the window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
};

export const RATE_LIMITS = {
  login: { limit: 5, windowSeconds: 300 },
  booking: { limit: 5, windowSeconds: 600 },
  tracking: { limit: 20, windowSeconds: 300 },
  contact: { limit: 3, windowSeconds: 900 },
  quote: { limit: 60, windowSeconds: 60 },
  adminWrite: { limit: 120, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitName = keyof typeof RATE_LIMITS;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function checkRateLimit(name: RateLimitName, identifier: string): RateLimitResult {
  const rule = RATE_LIMITS[name];
  const now = Date.now();
  sweep(now);

  const key = `${name}:${identifier}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowSeconds * 1000 });
    return { allowed: true, remaining: rule.limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count > rule.limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return { allowed: true, remaining: rule.limit - existing.count, retryAfterSeconds };
}

/** Throws a `RateLimitError` (→ HTTP 429 with `Retry-After`) when exceeded. */
export function enforceRateLimit(name: RateLimitName, identifier: string): void {
  const result = checkRateLimit(name, identifier);
  if (!result.allowed) throw new RateLimitError(result.retryAfterSeconds);
}

/** Clears a bucket after a successful action, e.g. a valid login. */
export function resetRateLimit(name: RateLimitName, identifier: string): void {
  buckets.delete(`${name}:${identifier}`);
}
