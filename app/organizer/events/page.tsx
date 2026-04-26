import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { CategoryBadge } from "@/components/category-badge";
import { buttonVariants } from "@/components/ui/button";
import { isVerifiedOrganizer } from "@/lib/auth/organizer";
import { isEventCategory } from "@/lib/events/categories";
import { formatEventDateRange } from "@/lib/events/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function OrganizerEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/organizer/events");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organizer_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!isVerifiedOrganizer(profile?.organizer_status ?? null)) {
    redirect("/organizer/apply");
  }

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, slug, name, category, city, start_date, end_date, is_published",
    )
    .eq("created_by", user.id)
    .order("start_date", { ascending: true });

  return (
    <main className="flex flex-1 flex-col px-6 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-accent">
              Organizer
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Your events
            </h1>
            <p className="mt-2 text-muted-foreground">
              Drafts stay private until you flip the publish toggle.
            </p>
          </div>
          <Link
            href="/organizer/events/new"
            className={cn(
              buttonVariants(),
              "h-11 px-5 bg-accent text-white hover:opacity-90",
            )}
          >
            <Plus className="h-4 w-4" />
            New event
          </Link>
        </header>

        {events && events.length > 0 ? (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {events.map((event) => {
              const category = isEventCategory(event.category)
                ? event.category
                : "other";
              return (
                <li key={event.id}>
                  <Link
                    href={`/organizer/events/${event.id}/edit`}
                    className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {event.name}
                        </h3>
                        <PublishedPill published={event.is_published} />
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
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <p className="text-base font-medium text-foreground">
              No events yet.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first one — it stays a draft until you publish.
            </p>
            <Link
              href="/organizer/events/new"
              className={cn(
                buttonVariants(),
                "mt-6 h-10 px-5 bg-accent text-white hover:opacity-90",
              )}
            >
              <Plus className="h-4 w-4" />
              Create event
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function PublishedPill({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        published
          ? "bg-accent/10 text-accent"
          : "bg-muted text-muted-foreground",
      )}
    >
      {published ? "Live" : "Draft"}
    </span>
  );
}
