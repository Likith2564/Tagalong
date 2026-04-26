"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORY_META,
  EVENT_CATEGORIES,
  type EventCategory,
} from "@/lib/events/categories";
import { createClient } from "@/lib/supabase/client";
import { eventSchema, type EventFormValues } from "@/lib/validations/event";

type Mode =
  | { kind: "create" }
  | { kind: "edit"; eventId: string; originalSlug: string };

type Props = {
  mode: Mode;
  defaultValues: EventFormValues;
  /** Where to navigate after a successful save / delete. Default: organizer dashboard. */
  successHref?: string;
};

export function EventForm({
  mode,
  defaultValues,
  successHref = "/organizer/events",
}: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues,
    mode: "onBlur",
  });

  async function onSubmit(values: EventFormValues) {
    setSubmitError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError("Session expired. Please sign in again.");
      return;
    }

    const nullIfEmpty = (v: string | undefined) => {
      const trimmed = v?.trim();
      return trimmed && trimmed.length > 0 ? trimmed : null;
    };

    const payload = {
      slug: values.slug.trim(),
      name: values.name.trim(),
      category: values.category as EventCategory,
      city: values.city.trim(),
      venue: nullIfEmpty(values.venue),
      start_date: values.start_date,
      end_date: values.end_date,
      description: nullIfEmpty(values.description),
      cover_image_url: nullIfEmpty(values.cover_image_url),
      website_url: nullIfEmpty(values.website_url),
      is_featured: values.is_featured,
      is_published: values.is_published,
      created_by: user.id,
    };

    const { error } =
      mode.kind === "create"
        ? await supabase.from("events").insert(payload)
        : await supabase.from("events").update(payload).eq("id", mode.eventId);

    if (error) {
      // 23505 = unique_violation (slug collision). Show a friendlier message.
      if (error.code === "23505") {
        form.setError("slug", {
          message: "Slug is taken. Try a different one.",
        });
        return;
      }
      setSubmitError(error.message);
      return;
    }

    toast.success(
      mode.kind === "create" ? "Event created" : "Changes saved",
    );
    router.replace(successHref);
    router.refresh();
  }

  async function handleDelete() {
    if (mode.kind !== "edit") return;
    if (!confirm("Delete this event? Participants will lose access.")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", mode.eventId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Event deleted");
    router.replace(successHref);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event name</FormLabel>
              <FormControl>
                <Input placeholder="HackBangalore 2026" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL slug</FormLabel>
              <FormControl>
                <Input placeholder="hackbangalore-2026" {...field} />
              </FormControl>
              <FormDescription>
                Becomes <code className="font-mono">/events/{field.value || "your-slug"}</code>.
                Lowercase, dashes only.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EVENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_META[cat].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Bengaluru" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="venue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue</FormLabel>
              <FormControl>
                <Input placeholder="IIIT Bangalore" {...field} />
              </FormControl>
              <FormDescription>Optional.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What's the event about? Lineup, format, what attendees should expect."
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional. Up to 2000 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cover_image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormDescription>
                Optional. We&apos;ll add image uploads in a future release.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event website</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <FormField
            control={form.control}
            name="is_published"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <FormLabel className="text-sm font-medium">
                    Publish this event
                  </FormLabel>
                  <FormDescription>
                    Off = save as a draft only you can see. On = appears in the
                    public events list.
                  </FormDescription>
                </div>
                <ToggleSwitch
                  checked={field.value}
                  onChange={field.onChange}
                  ariaLabel="Publish this event"
                />
              </FormItem>
            )}
          />
        </div>

        {submitError ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            type="submit"
            className="h-11 px-6 bg-accent text-white hover:opacity-90"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Saving…"
              : mode.kind === "create"
                ? "Create event"
                : "Save changes"}
          </Button>
          {mode.kind === "edit" ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
            >
              Delete event
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
        (checked ? "bg-accent" : "bg-border")
      }
    >
      <span
        className={
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform " +
          (checked ? "translate-x-5" : "translate-x-0.5")
        }
      />
    </button>
  );
}
