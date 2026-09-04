import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { serviceInputSchema } from "@/lib/validation";
import { createService, listServices } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("catalog:read");
    const services = await listServices({ includeInactive: true });
    return jsonOk({ services });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("catalog:write");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const input = await parseJsonBody(request, serviceInputSchema);
    const service = await createService(input);

    return jsonOk({ service }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
