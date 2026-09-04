"use client";

import { useEffect } from "react";

import { Icon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/Button";

/**
 * Route-level error boundary.
 *
 * Shows a recoverable state with a working retry, and never renders the raw
 * error message — production stack traces can leak internals. The digest is
 * shown so a customer can quote it to support.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this is where an error reporter (Sentry et al.) would go.
    console.error("[route error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-900/40 dark:text-danger-300">
          <Icon name="alert-triangle" size={28} />
        </span>

        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">
          Something went wrong
        </h1>
        <p className="measure mx-auto mt-3 text-ink-muted">
          This page failed to load. It is usually temporary — try again, and if it keeps happening
          let us know and we will look into it.
        </p>

        {error.digest ? (
          <p className="mt-4 text-xs text-ink-subtle">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        ) : null}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset} iconLeft="refresh" size="lg">
            Try again
          </Button>
          <ButtonLink href="/" variant="outline" size="lg">
            Back to home
          </ButtonLink>
          <ButtonLink href="/contact" variant="ghost" size="lg">
            Report the problem
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
