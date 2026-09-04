import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/components/admin/LoginForm";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/site/Logo";
import { Alert, Card, LoadingBlock } from "@/components/ui/primitives";
import { USES_DEMO_DATA } from "@/lib/config";

export const metadata: Metadata = {
  title: "Staff Sign In",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo href="/" />
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <Icon name="arrow-left" size={15} />
            Back to site
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-950 text-white dark:bg-brand-700">
              <Icon name="lock" size={26} />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">
              Staff sign in
            </h1>
            <p className="mt-2 text-ink-muted">
              Manage bookings, repairs, pricing and customers.
            </p>
          </div>

          <Card className="mt-8 p-6 sm:p-8">
            <Suspense fallback={<LoadingBlock label="Loading sign-in form" />}>
              <LoginForm />
            </Suspense>
          </Card>

          {USES_DEMO_DATA ? (
            <Alert tone="info" title="Demo credentials" className="mt-6">
              <p>
                This deployment is seeded with sample accounts. Sign in as{" "}
                <code className="font-mono font-semibold">admin@mymobifix.com</code> with the
                password from <code className="font-mono">SEED_ADMIN_PASSWORD</code> (default{" "}
                <code className="font-mono font-semibold">ChangeMe!2024</code>).
              </p>
              <p className="mt-2">
                Also available: <code className="font-mono">manager@mymobifix.com</code> /{" "}
                <code className="font-mono">Manager!2024</code> and{" "}
                <code className="font-mono">tech1@mymobifix.com</code> /{" "}
                <code className="font-mono">Technician!2024</code>, which demonstrate the
                role-restricted views. Change every password before any real deployment.
              </p>
            </Alert>
          ) : null}

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-subtle">
            <Icon name="shield-check" size={14} />
            Sessions expire automatically and can be revoked server-side.
          </p>
        </div>
      </main>
    </div>
  );
}
