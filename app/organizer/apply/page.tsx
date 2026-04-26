import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, Sparkles, XCircle } from "lucide-react";

import { ApplyButton } from "@/components/organizer/apply-button";
import { buttonVariants } from "@/components/ui/button";
import { asOrganizerStatus } from "@/lib/auth/organizer";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function OrganizerApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/organizer/apply");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organizer_status, organizer_applied_at, organizer_verified_at")
    .eq("id", user.id)
    .maybeSingle();

  const status = asOrganizerStatus(profile?.organizer_status);

  if (status === "verified") {
    redirect("/organizer/events");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-start px-6 py-12 sm:py-16">
      <div className="w-full max-w-xl space-y-10">
        <header>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Organizer
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Host your event on Tagalong
          </h1>
          <p className="mt-3 text-muted-foreground">
            Tagalong currently shows a hand-picked list of events. Apply to
            become a verified organizer and you&apos;ll be able to publish your
            own. We review every application by hand to keep the quality bar.
          </p>
        </header>

        {status === "none" ? (
          <ApplyState
            icon={<Sparkles className="h-5 w-5" />}
            tone="accent"
            title="Ready to apply?"
            body="One click to apply. We'll review and reach out via email — usually within 24-48 hours."
            cta={<ApplyButton />}
          />
        ) : null}

        {status === "pending" ? (
          <ApplyState
            icon={<Clock className="h-5 w-5" />}
            tone="muted"
            title="Application received"
            body={
              profile?.organizer_applied_at
                ? `Submitted ${formatRelative(profile.organizer_applied_at)}. We're reviewing it.`
                : "We're reviewing it."
            }
            cta={
              <Link
                href="/events"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 px-5",
                )}
              >
                Browse events
              </Link>
            }
          />
        ) : null}

        {status === "rejected" ? (
          <ApplyState
            icon={<XCircle className="h-5 w-5" />}
            tone="danger"
            title="Application not approved"
            body="Your application wasn't approved this time. If you think this was a mistake, drop us a line."
            cta={
              <a
                href="mailto:hello@tagalong.example"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 px-5",
                )}
              >
                Contact us
              </a>
            }
          />
        ) : null}

        <section className="space-y-3 rounded-2xl border border-border bg-surface p-5 text-sm text-muted-foreground">
          <h2 className="text-sm font-semibold text-foreground">
            What being a verified organizer gives you
          </h2>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              Publish events directly — drafts stay private until you launch.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              Edit details anytime: dates, venue, cover image, description.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              Your name and verification badge show on the event page — attendees
              know who they&apos;re trusting.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}

function ApplyState({
  icon,
  tone,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  tone: "accent" | "muted" | "danger";
  title: string;
  body: string;
  cta: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-6 sm:p-8",
        tone === "accent" && "border-accent/30 bg-accent/5",
        tone === "muted" && "border-border bg-surface",
        tone === "danger" && "border-destructive/30 bg-destructive/5",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full",
            tone === "accent" && "bg-accent/15 text-accent",
            tone === "muted" && "bg-muted text-foreground",
            tone === "danger" && "bg-destructive/15 text-destructive",
          )}
        >
          {icon}
        </span>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      <p className="text-sm leading-relaxed text-foreground/80">{body}</p>
      <div className="pt-1">{cta}</div>
    </section>
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
