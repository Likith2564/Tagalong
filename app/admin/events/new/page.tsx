import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { EventForm } from "@/components/organizer/event-form";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminNewEventPage() {
  await requireAdmin();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10 sm:py-14">
      <Link
        href="/admin/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All events
      </Link>
      <header className="my-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          New event
        </h1>
        <p className="mt-2 text-muted-foreground">
          Created as admin — bypasses the organizer-verification requirement.
        </p>
      </header>

      <EventForm
        mode={{ kind: "create" }}
        successHref="/admin/events"
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
          is_published: true,
        }}
      />
    </main>
  );
}
