import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { EventForm } from "@/components/organizer/event-form";
import { isVerifiedOrganizer } from "@/lib/auth/organizer";
import { isEventCategory } from "@/lib/events/categories";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

export default async function EditOrganizerEventPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/organizer/events/${id}/edit`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("organizer_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!isVerifiedOrganizer(profile?.organizer_status ?? null)) {
    redirect("/organizer/apply");
  }

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("created_by", user.id)
    .maybeSingle();

  if (!event) notFound();

  return (
    <main className="flex flex-1 flex-col px-6 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <Link
          href="/organizer/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Your events
        </Link>

        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-accent">
              Organizer
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Edit event
            </h1>
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
          mode={{
            kind: "edit",
            eventId: event.id,
            originalSlug: event.slug,
          }}
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
      </div>
    </main>
  );
}
