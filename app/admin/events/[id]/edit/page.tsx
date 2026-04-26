import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { EventForm } from "@/components/organizer/event-form";
import { requireAdmin } from "@/lib/auth/admin";
import { isEventCategory } from "@/lib/events/categories";

type Params = Promise<{ id: string }>;

export default async function AdminEditEventPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  // No created_by filter — admins can edit any event.
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!event) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10 sm:py-14">
      <Link
        href="/admin/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All events
      </Link>

      <header className="my-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Edit event
          </h1>
          <p className="mt-2 text-muted-foreground">
            Editing as admin. Changes apply directly.
          </p>
        </div>
        {event.is_published ? (
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            View public page
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </header>

      <EventForm
        mode={{ kind: "edit", eventId: event.id, originalSlug: event.slug }}
        successHref="/admin/events"
        defaultValues={{
          name: event.name,
          slug: event.slug,
          category: isEventCategory(event.category) ? event.category : "tech",
          city: event.city,
          venue: event.venue ?? "",
          start_date: event.start_date,
          end_date: event.end_date,
          description: event.description ?? "",
          cover_image_url: event.cover_image_url ?? "",
          website_url: event.website_url ?? "",
          is_featured: event.is_featured,
          is_published: event.is_published,
        }}
      />
    </main>
  );
}
