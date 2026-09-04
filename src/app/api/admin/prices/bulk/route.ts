import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { bulkPriceUpdateSchema } from "@/lib/validation";
import { bulkAdjustPrices } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/prices/bulk — apply a percentage adjustment across a
 * selection of prices in one transaction (seasonal promotion, cost increase).
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("catalog:write");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const input = await parseJsonBody(request, bulkPriceUpdateSchema);
    const result = await bulkAdjustPrices(input.ids, input.adjustPercent);

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
