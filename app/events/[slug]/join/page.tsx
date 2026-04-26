import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { LookingForValue } from "@/lib/validations/participation";

import { JoinForm } from "./join-form";

type Params = Promise<{ slug: string }>;

export default async function JoinEventPage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/events/${slug}/join`);
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, name, slug, city, start_date, end_date")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const { data: existing } = await supabase
    .from("event_participants")
    .select("*")
    .eq("event_id", event.id)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="flex flex-1 flex-col px-6 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-lg space-y-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            {existing ? "Edit details" : "Join event"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {event.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Tell others when you&apos;re traveling and what you&apos;re looking
            for. They can reach out via the contact handles on your profile.
          </p>
        </div>

        <JoinForm
          eventId={event.id}
          eventSlug={event.slug}
          existing={
            existing
              ? {
                  origin_city: existing.origin_city,
                  arrival_datetime: existing.arrival_datetime,
                  departure_datetime: existing.departure_datetime,
                  looking_for: existing.looking_for as LookingForValue[],
                  notes: existing.notes ?? "",
                }
              : null
          }
        />
      </div>
    </main>
  );
}
