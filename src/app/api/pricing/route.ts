import { jsonError, jsonOk, parseSearchParams } from "@/lib/http";
import { pricingQuerySchema } from "@/lib/validation";
import { listPrices } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/pricing — the public price book, filterable by brand, model,
 * service and part grade, and paginated.
 */
export async function GET(request: Request) {
  try {
    const query = parseSearchParams(new URL(request.url), pricingQuerySchema);

    const result = await listPrices({
      brandSlug: query.brand,
      modelSearch: query.model,
      serviceSlug: query.service,
      partGrade: query.partGrade,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
