"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl bg-[var(--surface)] p-10 text-center shadow-[var(--shadow-md)]">
        <h1 className="font-display text-2xl text-[var(--foreground)]">
          Something went wrong
        </h1>
        <p className="text-sm text-[var(--ink-soft)]">
          An unexpected error occurred. Please try again.
        </p>
        <Button onClick={reset} className="mt-2">
          Try again
        </Button>
      </div>
    </div>
  );
}
