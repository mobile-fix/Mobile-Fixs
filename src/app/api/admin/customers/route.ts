import { jsonError, jsonOk, parseSearchParams } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { customerListQuerySchema } from "@/lib/validation";
import { listCustomers } from "@/server/services/customer.service";

export const dynamic = "force-dynamic";

/** GET /api/admin/customers — searchable, paginated customer directory. */
export async function GET(request: Request) {
  try {
    await requirePermission("customers:read");
    const query = parseSearchParams(new URL(request.url), customerListQuerySchema);

    const result = await listCustomers({
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
