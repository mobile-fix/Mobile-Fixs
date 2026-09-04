import { jsonError, jsonOk, parseSearchParams } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { analyticsQuerySchema } from "@/lib/validation";
import { getAnalyticsBundle } from "@/server/services/analytics.service";

export const dynamic = "force-dynamic";

/** GET /api/admin/analytics?days= — every chart on the analytics page in one call. */
export async function GET(request: Request) {
  try {
    await requirePermission("analytics:read");
    const { days } = parseSearchParams(new URL(request.url), analyticsQuerySchema);
    const bundle = await getAnalyticsBundle(days);
    return jsonOk(bundle);
  } catch (error) {
    return jsonError(error);
  }
}
