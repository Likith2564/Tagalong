"use client";

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
          Couldn&apos;t load events.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Something went wrong on our end. Try again, or refresh the page.
        </p>
        <Button
          onClick={reset}
          className="mt-6 h-10 px-5 bg-accent text-white hover:opacity-90"
        >
          Try again
        </Button>
      </div>
    </main>
  );
}
