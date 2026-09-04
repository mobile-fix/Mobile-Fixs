import { jsonError, jsonOk } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { clearSessionCookie, revokeCurrentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/logout
 * Revokes the session server-side before clearing the cookie, so a copied token
 * is dead even if the cookie survives.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await revokeCurrentSession();
    await clearSessionCookie();
    return jsonOk({ signedOut: true });
  } catch (error) {
    return jsonError(error);
  }
}
