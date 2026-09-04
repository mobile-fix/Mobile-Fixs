import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { updateMessageStatusSchema } from "@/lib/validation";
import { updateMessageStatus } from "@/server/services/content.service";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/messages/[id] — mark an enquiry read or resolved. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("messages:read");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const { id } = await params;
    const input = await parseJsonBody(request, updateMessageStatusSchema);
    const message = await updateMessageStatus(id, input.status);

    return jsonOk({ message: { id: message.id, status: message.status } });
  } catch (error) {
    return jsonError(error);
  }
}
