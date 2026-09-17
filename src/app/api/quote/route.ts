import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { quoteSchema } from "@/lib/validation";
import { buildQuote, toPublicQuote } from "@/server/services/pricing.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/quote — repair summary (time and warranty) for a device + basket.
 *
 * Runs the same engine the booking service uses, but returns it through
 * `toPublicQuote`, so no price ever leaves the server on a public route.
 */
export async function POST(request: Request) {
  try {
    enforceRateLimit("quote", clientIp(request));
    const input = await parseJsonBody(request, quoteSchema);

    const quote = await buildQuote({
      modelId: input.modelId,
      items: input.items,
      serviceType: input.serviceType,
    });

    return jsonOk({ quote: toPublicQuote(quote) });
  } catch (error) {
    return jsonError(error);
  }
}
