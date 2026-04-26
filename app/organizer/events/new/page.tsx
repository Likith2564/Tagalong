import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { EventForm } from "@/components/organizer/event-form";
import { isVerifiedOrganizer } from "@/lib/auth/organizer";
import { createClient } from "@/lib/supabase/server";

export default async function NewOrganizerEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/organizer/events/new");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organizer_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!isVerifiedOrganizer(profile?.organizer_status ?? null)) {
    redirect("/organizer/apply");
  }

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
        <header>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Organizer
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            New event
          </h1>
          <p className="mt-2 text-muted-foreground">
            Save as a draft first — flip the publish toggle once you&apos;re
            ready.
          </p>
        </header>

        <EventForm
          mode={{ kind: "create" }}
          defaultValues={{
            name: "",
            slug: "",
            category: "tech",
            city: "",
            venue: "",
            start_date: "",
            end_date: "",
            description: "",
            cover_image_url: "",
            website_url: "",
            is_featured: false,
            is_published: false,
          }}
        />
      </div>
    </main>
  );
}
