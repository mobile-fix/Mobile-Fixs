import { jsonError, jsonOk, parseSearchParams } from "@/lib/http";
import { modelQuerySchema } from "@/lib/validation";
import { listModels } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/catalog/models?brandId=&search=&limit=
 * Powers both the brand-filtered model grid and the type-ahead search, so the
 * customer never scrolls a list of 57 devices looking for theirs.
 */
export async function GET(request: Request) {
  try {
    const query = parseSearchParams(new URL(request.url), modelQuerySchema);

    const models = await listModels({
      brandId: query.brandId,
      brandSlug: query.brand,
      search: query.search,
      limit: query.limit,
    });

    return jsonOk({ models }, { meta: { count: models.length } });
  } catch (error) {
    return jsonError(error);
  }
}
