import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, ExternalLink, MapPin } from "lucide-react";

import { CategoryBadge } from "@/components/category-badge";
import { ParticipantCard } from "@/components/participant-card";
import { RealtimeParticipantsListener } from "@/components/realtime-participants-listener";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { isVerifiedOrganizer } from "@/lib/auth/organizer";
import {
  CATEGORY_META,
  isEventCategory,
} from "@/lib/events/categories";
import { formatEventDateRange } from "@/lib/events/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export default async function EventDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!event || !isEventCategory(event.category)) {
    notFound();
  }

  const meta = CATEGORY_META[event.category];

  const { data: organizer } = event.created_by
    ? await supabase
        .from("profiles")
        .select("full_name, avatar_url, organizer_status")
        .eq("id", event.created_by)
        .maybeSingle()
    : { data: null };

  const organizerVerified = isVerifiedOrganizer(
    organizer?.organizer_status ?? null,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: participants } = await supabase
    .from("event_participants")
    .select(
      `
        user_id,
        origin_city,
        arrival_datetime,
        departure_datetime,
        looking_for,
        notes,
        created_at,
        profiles (
          full_name,
          avatar_url,
          bio,
          telegram_handle,
          twitter_handle,
          whatsapp_number,
          instagram_handle
        )
      `,
    )
    .eq("event_id", event.id)
    .order("arrival_datetime", { ascending: true });

  const rows = (participants ?? []).filter(
    (
      p,
    ): p is typeof p & {
      profiles: NonNullable<typeof p.profiles>;
    } => p.profiles !== null,
  );

  const participantCount = rows.length;
  const userHasJoined = Boolean(user && rows.some((p) => p.user_id === user.id));

  return (
    <main className="flex flex-1 flex-col">
      <RealtimeParticipantsListener eventId={event.id} />
      <div className="mx-auto w-full max-w-4xl px-6 py-6 sm:py-10">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All events
        </Link>
      </div>

      <div
        className={cn(
          "relative aspect-[16/7] w-full overflow-hidden border-y border-border",
          meta.bgClass,
        )}
      >
        {event.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center",
              meta.textClass,
            )}
            aria-hidden
          >
            <span className="text-4xl font-semibold opacity-40">
              {meta.label}
            </span>
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-10 px-6 py-10 sm:py-16">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <CategoryBadge category={event.category} />
            <span className="text-sm text-muted-foreground">
              {formatEventDateRange(event.start_date, event.end_date)}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {event.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {event.venue ? `${event.venue}, ${event.city}` : event.city}
            </span>
            {event.website_url ? (
              <a
                href={event.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-accent hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Event website
              </a>
            ) : null}
          </div>
        </header>

        {organizer ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
            <Avatar className="h-10 w-10 border border-border">
              {organizer.avatar_url ? (
                <AvatarImage src={organizer.avatar_url} alt={organizer.full_name} />
              ) : null}
              <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                {organizer.full_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Hosted by
              </p>
              <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-foreground">
                {organizer.full_name}
                {organizerVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        ) : null}

        {event.description ? (
          <p className="max-w-2xl whitespace-pre-line text-base leading-relaxed text-foreground/90">
            {event.description}
          </p>
        ) : null}

        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Who&apos;s going
              </h2>
              <p className="text-sm text-muted-foreground">
                {participantCount === 0
                  ? "Nobody yet — be the first."
                  : `${participantCount} ${participantCount === 1 ? "person" : "people"} so far.`}
              </p>
            </div>
            <Link
              href={`/events/${event.slug}/join`}
              className={cn(
                buttonVariants(),
                "h-10 px-5 bg-accent text-white hover:opacity-90",
              )}
            >
              {userHasJoined ? "Edit your details" : "Join this event"}
            </Link>
          </div>

          {participantCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
              <p className="text-base font-medium text-foreground">
                No travel buddies yet.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Hit <span className="font-medium">Join this event</span> to
                show up here. Others will reach out.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {rows.map((p) => (
                <ParticipantCard
                  key={p.user_id}
                  isYou={user?.id === p.user_id}
                  participant={{
                    full_name: p.profiles.full_name,
                    avatar_url: p.profiles.avatar_url,
                    bio: p.profiles.bio,
                    origin_city: p.origin_city,
                    arrival_datetime: p.arrival_datetime,
                    departure_datetime: p.departure_datetime,
                    looking_for: p.looking_for,
                    notes: p.notes,
                    telegram_handle: p.profiles.telegram_handle,
                    twitter_handle: p.profiles.twitter_handle,
                    whatsapp_number: p.profiles.whatsapp_number,
                    instagram_handle: p.profiles.instagram_handle,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
