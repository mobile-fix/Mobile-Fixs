import { jsonOk } from "@/lib/http";

/**
 * GET /api/ping — liveness only.
 *
 * Render's free plan puts the server to sleep after 15 minutes without a
 * request, and the next visitor waits up to a minute for it to wake. A
 * scheduled Cloudflare Worker (cloudflare/keep-awake) calls this every
 * 10 minutes so that never happens.
 *
 * It must never touch the database: the free Neon plan has a monthly compute
 * allowance, and a ping that woke the database every 10 minutes would keep it
 * running around the clock and use that allowance up.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return jsonOk({ status: "ok" });
}
