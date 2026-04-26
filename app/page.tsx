import Link from "next/link";
import { ArrowRight, Compass, MessageCircle, UserPlus } from "lucide-react";

import { EventCard } from "@/components/event-card";
import { buttonVariants } from "@/components/ui/button";
import { isEventCategory } from "@/lib/events/categories";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);
  const { data: featuredRaw } = await supabase
    .from("events")
    .select("slug, name, category, city, start_date, end_date, cover_image_url")
    .eq("is_featured", true)
    .gte("end_date", today)
    .order("start_date", { ascending: true })
    .limit(3);

  const featured = (featuredRaw ?? []).filter((e) => isEventCategory(e.category));

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,107,61,0.18),transparent)]"
          aria-hidden
        />
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-6 py-20 text-center sm:py-28 lg:py-32">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            For travelers, runners, hackers, festival-goers
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Find your travel buddies for any event.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Heading to a hackathon, marathon, festival, or conference? Pick your
            event, share your travel window, and meet others going. Tag along —
            it&apos;s more fun together.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href={user ? "/events" : "/login"}
              className={cn(
                buttonVariants(),
                "h-12 px-7 text-base bg-accent text-white hover:opacity-90",
              )}
            >
              {user ? "Browse events" : "Sign in with Google"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
            {!user ? (
              <Link
                href="/events"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                or peek at upcoming events →
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Three steps. The event itself is the trust filter.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <Step
              number={1}
              icon={<Compass className="h-5 w-5" />}
              title="Find your event"
              body="Browse upcoming hackathons, marathons, festivals, and more from across India."
            />
            <Step
              number={2}
              icon={<UserPlus className="h-5 w-5" />}
              title="Tell others you're going"
              body="Add your travel dates, where you're flying in from, and what you're looking for."
            />
            <Step
              number={3}
              icon={<MessageCircle className="h-5 w-5" />}
              title="Connect off-platform"
              body="See who else is going. Reach out on Telegram, WhatsApp, Twitter, or Instagram. We don't host messages — your DMs stay yours."
            />
          </div>
        </div>
      </section>

      {/* Featured events */}
      {featured.length > 0 ? (
        <section>
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Featured events
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Hand-picked. Sign in to see who&apos;s going.
                </p>
              </div>
              <Link
                href="/events"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                See all events
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((event) => (
                <EventCard key={event.slug} event={event} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Closing CTA */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-6 py-16 text-center sm:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Going somewhere?
          </h2>
          <p className="text-muted-foreground">
            One profile. Every event. Sign in once and tag along to whatever
            comes next.
          </p>
          <Link
            href={user ? "/events" : "/login"}
            className={cn(
              buttonVariants(),
              "h-11 px-6 bg-accent text-white hover:opacity-90",
            )}
          >
            {user ? "Browse events" : "Get started"}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function Step({
  number,
  icon,
  title,
  body,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Step {number}
        </span>
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
