import type { Metadata } from "next";

import { CustomersTable } from "@/components/admin/CustomersTable";
import { requirePermission } from "@/lib/auth";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requirePermission("customers:read");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Customers
        </h1>
        <p className="mt-1.5 text-ink-muted">
          Every customer who has booked a repair, with their history and current job.
        </p>
      </header>

      <CustomersTable />
    </div>
  );
}
