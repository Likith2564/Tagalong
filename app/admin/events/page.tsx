import Link from "next/link";
import { Plus } from "lucide-react";

import { CategoryBadge } from "@/components/category-badge";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { isEventCategory } from "@/lib/events/categories";
import { formatEventDateRange } from "@/lib/events/format";
import { cn } from "@/lib/utils";

export default async function AdminEventsPage() {
  const { supabase } = await requireAdmin();

  const { data: events } = await supabase
    .from("events")
    .select(
      `
        id,
        slug,
        name,
        category,
        city,
        start_date,
        end_date,
        is_published,
        is_featured,
        created_at,
        created_by,
        profiles:created_by ( full_name )
      `,
    )
    .order("start_date", { ascending: true });

  const total = events?.length ?? 0;
  const liveCount = (events ?? []).filter((e) => e.is_published).length;
  const draftCount = total - liveCount;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Events
          </h1>
          <p className="text-muted-foreground">
            All events across all organizers. {liveCount} live · {draftCount}{" "}
            draft.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className={cn(
            buttonVariants(),
            "h-10 px-5 bg-accent text-white hover:opacity-90",
          )}
        >
          <Plus className="h-4 w-4" />
          New event
        </Link>
      </header>

      {!events || events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center text-muted-foreground">
          No events yet.
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {events.map((event) => {
            const category = isEventCategory(event.category)
              ? event.category
              : "other";
            const organizerName =
              (event.profiles as { full_name: string } | null)?.full_name ??
              "Tagalong";
            return (
              <li key={event.id}>
                <Link
                  href={`/admin/events/${event.id}/edit`}
                  className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {event.name}
                      </h3>
                      <PublishedPill published={event.is_published} />
                      {event.is_featured ? (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <CategoryBadge category={category} />
                      <span>
                        {formatEventDateRange(
                          event.start_date,
                          event.end_date,
                        )}{" "}
                        · {event.city}
                      </span>
                      <span className="text-muted-foreground/50">·</span>
                      <span>by {organizerName}</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-accent">
                    Edit →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function PublishedPill({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        published
          ? "bg-accent/10 text-accent"
          : "bg-muted text-muted-foreground",
      )}
    >
      {published ? "Live" : "Draft"}
    </span>
  );
}
