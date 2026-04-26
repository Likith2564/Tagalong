"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Couldn&apos;t load this event.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Try again, or head back to the events list.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            onClick={reset}
            className="h-10 px-5 bg-accent text-white hover:opacity-90"
          >
            Try again
          </Button>
          <Link
            href="/events"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Back to events
          </Link>
        </div>
      </div>
    </main>
  );
}
