import { clientIp, jsonError, jsonOk, parseJsonBody, parseSearchParams } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { modelInputSchema, modelQuerySchema } from "@/lib/validation";
import { createModel, listModels } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

/** GET /api/admin/models — device models, including deactivated ones. */
export async function GET(request: Request) {
  try {
    await requirePermission("catalog:read");
    const query = parseSearchParams(new URL(request.url), modelQuerySchema);

    const models = await listModels({
      brandId: query.brandId,
      brandSlug: query.brand,
      search: query.search,
      limit: query.limit,
      includeInactive: true,
    });

    return jsonOk({ models });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/admin/models — add a device model. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("catalog:write");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const input = await parseJsonBody(request, modelInputSchema);
    const model = await createModel(input);

    return jsonOk({ model }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
