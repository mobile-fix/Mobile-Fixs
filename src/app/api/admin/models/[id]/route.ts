import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { modelInputSchema } from "@/lib/validation";
import { deleteModel, updateModel } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("catalog:write");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const { id } = await params;
    const input = await parseJsonBody(request, modelInputSchema.partial());
    const model = await updateModel(id, input);

    return jsonOk({ model });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("catalog:write");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const { id } = await params;
    const result = await deleteModel(id);

    return jsonOk({ deactivated: "isActive" in result && result.isActive === false, id });
  } catch (error) {
    return jsonError(error);
  }
}
