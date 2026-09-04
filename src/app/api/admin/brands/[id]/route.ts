import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { brandInputSchema } from "@/lib/validation";
import { deleteBrand, updateBrand } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/brands/[id] */
export async function PATCH(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("catalog:write");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const { id } = await params;
    const input = await parseJsonBody(request, brandInputSchema.partial());
    const brand = await updateBrand(id, input);

    return jsonOk({ brand });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * DELETE /api/admin/brands/[id]
 * Deactivates rather than deletes when models exist, so historical bookings keep
 * resolving. The response says which happened.
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("catalog:write");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const { id } = await params;
    const result = await deleteBrand(id);

    return jsonOk({
      deactivated: "isActive" in result && result.isActive === false,
      id,
    });
  } catch (error) {
    return jsonError(error);
  }
}
