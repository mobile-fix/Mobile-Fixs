import { jsonError, jsonOk } from "@/lib/http";
import { requirePermission, requireUser } from "@/lib/auth";
import { listAssignableTechnicians, listStaff } from "@/server/services/auth.service";
import { hasPermission } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/staff
 *
 * Owners see the full roster; everyone else gets the assignable-technician list
 * they need to fill the booking assignment dropdown, and nothing more.
 */
export async function GET() {
  try {
    const user = await requireUser();

    if (hasPermission(user.role, "staff:manage")) {
      const staff = await listStaff();
      return jsonOk({ staff, scope: "full" });
    }

    await requirePermission("bookings:read");
    const technicians = await listAssignableTechnicians();
    return jsonOk({
      staff: technicians.map((technician) => ({
        id: technician.id,
        name: technician.name,
        role: technician.role,
      })),
      scope: "assignable",
    });
  } catch (error) {
    return jsonError(error);
  }
}
