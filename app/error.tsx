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
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="bg-surface flex max-w-md flex-col items-center gap-4 rounded-2xl p-10 text-center shadow-(--shadow-md)">
        <h1 className="font-display text-foreground text-2xl">
          Something went wrong
        </h1>
        <p className="text-ink-soft text-sm">
          An unexpected error occurred. Please try again.
        </p>
        <Button onClick={reset} className="mt-2">
          Try again
        </Button>
      </div>
    </div>
  );
}
