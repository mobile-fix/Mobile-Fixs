import type { Metadata } from "next";

import { CatalogManager } from "@/components/admin/CatalogManager";
import { Alert } from "@/components/ui/primitives";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/constants";

export const metadata: Metadata = { title: "Catalogue & pricing" };
export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
  const user = await requirePermission("catalog:read");
  const canWrite = hasPermission(user.role, "catalog:write");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Catalogue &amp; pricing
        </h1>
        <p className="mt-1.5 text-ink-muted">
          Everything customers can select. Changes take effect on the public site immediately — no
          deploy required.
        </p>
      </header>

      {!canWrite ? (
        <Alert tone="info" title="Read-only access">
          Your role can view the catalogue but not change it. Ask an owner or manager to make
          pricing changes.
        </Alert>
      ) : null}

      <CatalogManager canWrite={canWrite} />
    </div>
  );
}
