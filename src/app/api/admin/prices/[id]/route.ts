import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { ValidationError } from "@/lib/errors";
import { priceInputSchema } from "@/lib/validation";
import { deletePrice, updatePrice } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("catalog:write");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const { id } = await params;
    // `.partial()` drops the object-level compare-at refinement, so re-check the
    // relationship here when both values are present in the patch.
    const input = await parseJsonBody(request, priceInputSchema.innerType().partial());
    if (
      input.compareAtPrice !== undefined &&
      input.price !== undefined &&
      input.compareAtPrice <= input.price
    ) {
      throw new ValidationError("Please correct the highlighted fields.", {
        compareAtPrice: ["The compare-at price must be higher than the price."],
      });
    }

    const price = await updatePrice(id, input);
    return jsonOk({ price });
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
    await deletePrice(id);

    return jsonOk({ id, deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
