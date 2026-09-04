import type { Metadata } from "next";

import { MessagesList } from "@/components/admin/MessagesList";
import { requirePermission } from "@/lib/auth";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await requirePermission("messages:read");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Messages
        </h1>
        <p className="mt-1.5 text-ink-muted">
          Enquiries from the contact form. Opening an unread message marks it read.
        </p>
      </header>

      <MessagesList />
    </div>
  );
}
