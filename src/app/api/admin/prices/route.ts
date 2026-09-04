import { clientIp, jsonError, jsonOk, parseJsonBody, parseSearchParams } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { priceInputSchema, pricingQuerySchema } from "@/lib/validation";
import { listPrices, upsertPrice } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

/** GET /api/admin/prices — full price book, including unavailable rows. */
export async function GET(request: Request) {
  try {
    await requirePermission("catalog:read");
    const query = parseSearchParams(new URL(request.url), pricingQuerySchema);

    const result = await listPrices({
      brandSlug: query.brand,
      modelSearch: query.model,
      serviceSlug: query.service,
      partGrade: query.partGrade,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
      includeUnavailable: true,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * POST /api/admin/prices — create or replace the price for one
 * (model × service × part grade) combination.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("catalog:write");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const input = await parseJsonBody(request, priceInputSchema);
    const price = await upsertPrice(input);

    return jsonOk({ price }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
