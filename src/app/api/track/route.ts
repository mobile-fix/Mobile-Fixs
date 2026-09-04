import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { enforceRateLimit } from "@/lib/rate-limit";
import { trackRepairSchema } from "@/lib/validation";
import { trackRepair } from "@/server/services/tracking.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/track — public repair lookup by reference + phone.
 *
 * POST rather than GET so the phone number never lands in a URL, a server log or
 * a browser history entry. Rate limited to stop reference enumeration.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit("tracking", clientIp(request));

    const input = await parseJsonBody(request, trackRepairSchema);
    const repair = await trackRepair(input);

    return jsonOk({ repair });
  } catch (error) {
    return jsonError(error);
  }
}
