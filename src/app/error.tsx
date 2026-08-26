"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Catches render errors in the public pages — most likely a database outage on a
 * force-dynamic route. Shows something human instead of a stack trace.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[render error]", error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-muted">
        This page failed to load. It is usually temporary — trying again often fixes it.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted/70">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Back home
        </Link>
      </div>
    </div>
  );
}
