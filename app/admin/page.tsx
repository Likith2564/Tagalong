import Link from "next/link";
import { ArrowRight, CalendarDays, ShieldCheck, UsersRound } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin();

  const [
    { count: userCount },
    { count: eventCount },
    { count: publishedCount },
    { count: participationCount },
    { count: pendingOrganizerCount },
    { count: verifiedOrganizerCount },
    { data: recentSignups },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .from("event_participants")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organizer_status", "pending"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organizer_status", "verified"),
    supabase
      .from("profiles")
      .select("id, full_name, city, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const draftCount = (eventCount ?? 0) - (publishedCount ?? 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
      <header className="mb-8 space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          The current state of Tagalong, in one screen.
        </p>
      </header>

      {(pendingOrganizerCount ?? 0) > 0 ? (
        <Link
          href="/admin/organizers"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 transition-colors hover:bg-accent/10"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {pendingOrganizerCount} organizer{" "}
                {pendingOrganizerCount === 1 ? "application" : "applications"} need
                review
              </p>
              <p className="text-xs text-muted-foreground">
                Verify or reject from the Organizers tab.
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-accent" />
        </Link>
      ) : null}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Users" value={userCount ?? 0} />
        <MetricCard
          label="Events"
          value={eventCount ?? 0}
          sub={`${publishedCount ?? 0} live · ${draftCount} draft`}
        />
        <MetricCard label="Participations" value={participationCount ?? 0} />
        <MetricCard
          label="Verified organizers"
          value={verifiedOrganizerCount ?? 0}
          sub={
            (pendingOrganizerCount ?? 0) > 0
              ? `${pendingOrganizerCount} pending`
              : undefined
          }
        />
      </section>

      <section className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QuickAction
          href="/admin/events/new"
          icon={<CalendarDays className="h-5 w-5" />}
          title="Add an event"
          body="Publish directly. Bypasses the organizer-verification requirement."
        />
        <QuickAction
          href="/admin/users"
          icon={<UsersRound className="h-5 w-5" />}
          title="Browse users"
          body="See everyone who's signed up. Profile details, organizer status, signup date."
        />
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Recent signups
        </h2>
        {recentSignups && recentSignups.length > 0 ? (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {recentSignups.map((profile) => (
              <li
                key={profile.id}
                className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {profile.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile.city ?? "no city set"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatRelative(profile.created_at)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No signups yet.</p>
        )}
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
        {value.toLocaleString()}
      </p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors hover:bg-muted/40",
      )}
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        {icon}
      </span>
      <div className="flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
      </div>
      <ArrowRight className="h-4 w-4 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function formatRelative(iso: string): string {
  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(iso).getTime()) / 60_000),
  );
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
