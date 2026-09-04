import { z } from "zod";

import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { cuidSchema } from "@/lib/validation";
import { cloneModelPrices } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ sourceModelId: cuidSchema });

/**
 * POST /api/admin/models/[id]/clone-prices
 * Copies a full price book onto a newly added device — the practical way to
 * onboard a model without hand-keying dozens of rows.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("catalog:write");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const { id } = await params;
    const { sourceModelId } = await parseJsonBody(request, bodySchema);
    const result = await cloneModelPrices(sourceModelId, id);

    return jsonOk(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
