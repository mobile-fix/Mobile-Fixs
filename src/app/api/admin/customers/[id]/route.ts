import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { updateCustomerSchema } from "@/lib/validation";
import { getCustomerById, updateCustomer } from "@/server/services/customer.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/customers/[id] — profile plus full repair history. */
export async function GET(_request: Request, { params }: Params) {
  try {
    await requirePermission("customers:read");
    const { id } = await params;
    const customer = await getCustomerById(id);
    return jsonOk({ customer });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("customers:write");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const { id } = await params;
    const input = await parseJsonBody(request, updateCustomerSchema);
    await updateCustomer(id, input);

    const customer = await getCustomerById(id);
    return jsonOk({ customer });
  } catch (error) {
    return jsonError(error);
  }
}
