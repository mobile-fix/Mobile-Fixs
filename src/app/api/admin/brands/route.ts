import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { brandInputSchema } from "@/lib/validation";
import { createBrand, listBrands } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

/** GET /api/admin/brands — all brands, including deactivated ones. */
export async function GET() {
  try {
    await requirePermission("catalog:read");
    const brands = await listBrands({ includeInactive: true });
    return jsonOk({ brands });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/admin/brands — add a device brand. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("catalog:write");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const input = await parseJsonBody(request, brandInputSchema);
    const brand = await createBrand(input);

    return jsonOk({ brand }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
