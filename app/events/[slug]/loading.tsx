import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-4xl px-6 py-8 sm:py-12">
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="aspect-[16/7] w-full rounded-none" />
      <div className="mx-auto w-full max-w-4xl space-y-6 px-6 py-10 sm:py-16">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </main>
  );
}
