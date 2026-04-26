import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { isEventCategory } from "@/lib/events/categories";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ category?: string }>;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category } = await searchParams;
  const validCategory =
    category && isEventCategory(category) ? category : null;

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("events")
    .select(
      "slug, name, category, city, start_date, end_date, cover_image_url",
    )
    .gte("end_date", today)
    .order("start_date", { ascending: true });

  if (validCategory) {
    query = query.eq("category", validCategory);
  }

  const { data: events, error } = await query;

  if (error) {
    throw error;
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Events
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Upcoming events
          </h1>
          <p className="text-muted-foreground">
            Pick the one you&apos;re going to. Travel together.
          </p>
        </header>

        <EventFilters />

        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState category={validCategory} />
        )}
      </div>
    </main>
  );
}

function EmptyState({ category }: { category: string | null }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <p className="text-base font-medium text-foreground">
        {category
          ? `No upcoming ${category} events yet.`
          : "No upcoming events yet."}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Check back soon — new events are added every week.
      </p>
    </div>
  );
}
