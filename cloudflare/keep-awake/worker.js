/**
 * MyMobiFix keep-awake — a Cloudflare Worker on the free plan.
 *
 * Render's free plan stops the site's server after 15 minutes with no
 * requests, and the next visitor — often someone who just clicked an ad —
 * waits up to a minute while it starts again. This Worker's cron trigger
 * (every 10 minutes, see wrangler.toml) calls /api/ping so the server never
 * goes idle long enough to stop.
 *
 * /api/ping answers without touching the database, so the database can still
 * sleep between real visitors.
 *
 * Setup is in DEPLOYMENT.md, "Free hosting: Cloudflare". The file is plain
 * JavaScript so it can be pasted straight into the Cloudflare dashboard.
 */

const DEFAULT_PING_URL = "https://www.mymobifix.com/api/ping";

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(ping(env.PING_URL || DEFAULT_PING_URL));
  },

  // Opening the Worker's own URL runs one ping and shows the result, which is
  // the quickest way to check the setup works.
  async fetch(_request, env) {
    const result = await ping(env.PING_URL || DEFAULT_PING_URL);
    return Response.json(result, { status: result.ok ? 200 : 502 });
  },
};

async function ping(url) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "mymobifix-keep-awake" },
      redirect: "manual",
      // A copy served from Cloudflare's cache would never reach Render, and
      // the server would fall asleep while the ping still looked healthy.
      cache: "no-store",
    });
    const result = { ok: response.ok, status: response.status, ms: Date.now() - started };
    if (!response.ok) console.error("keep-awake: unexpected response", url, result);
    return result;
  } catch (error) {
    const result = { ok: false, error: String(error), ms: Date.now() - started };
    console.error("keep-awake: request failed", url, result);
    return result;
  }
}
