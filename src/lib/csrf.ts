import { ForbiddenError } from "./errors";
import { siteConfig } from "./config";

/**
 * CSRF defence for state-changing requests.
 *
 * Three independent layers, so no single failure is exploitable:
 *   1. The session cookie is `SameSite=Lax`, which browsers already refuse to
 *      attach to cross-site POST requests.
 *   2. `Origin` (falling back to `Referer`) must match this deployment.
 *   3. Requests must carry `X-Requested-With`, a header a cross-origin form post
 *      cannot set without a CORS preflight that this server never approves.
 */
export function assertSameOrigin(request: Request): void {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  const allowedHosts = new Set<string>();
  if (host) allowedHosts.add(host.toLowerCase());
  try {
    allowedHosts.add(new URL(siteConfig.url).host.toLowerCase());
  } catch {
    // A malformed NEXT_PUBLIC_SITE_URL should not disable the check entirely;
    // the Host header comparison above still applies.
  }

  const source = origin ?? referer;
  if (source) {
    let sourceHost: string;
    try {
      sourceHost = new URL(source).host.toLowerCase();
    } catch {
      throw new ForbiddenError("Request blocked: malformed origin.");
    }
    if (!allowedHosts.has(sourceHost)) {
      throw new ForbiddenError("Request blocked: cross-origin requests are not accepted.");
    }
  }

  if (!request.headers.get("x-requested-with")) {
    throw new ForbiddenError("Request blocked: missing required request header.");
  }
}
