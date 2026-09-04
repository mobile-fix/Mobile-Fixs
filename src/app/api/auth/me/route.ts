import { jsonError, jsonOk } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/auth/me — current staff session, or null when signed out. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    return jsonOk({ user });
  } catch (error) {
    return jsonError(error);
  }
}
