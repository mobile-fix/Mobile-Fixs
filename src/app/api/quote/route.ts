import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { quoteSchema } from "@/lib/validation";
import { buildQuote } from "@/server/services/pricing.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/quote — priced estimate for a device + repair basket.
 *
 * This is the *same* function the booking service uses to compute the final
 * total, so what the estimator shows is provably what gets charged.
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

    return jsonOk({ quote });
  } catch (error) {
    return jsonError(error);
  }
}
