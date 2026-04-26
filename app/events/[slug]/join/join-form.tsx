"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { LookingForChips } from "@/components/looking-for-chips";
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
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
  participationSchema,
  type ParticipationFormValues,
  type LookingForValue,
} from "@/lib/validations/participation";

type Props = {
  eventId: string;
  eventSlug: string;
  existing: {
    origin_city: string;
    arrival_datetime: string;
    departure_datetime: string;
    looking_for: LookingForValue[];
    notes: string;
  } | null;
};

export function JoinForm({ eventId, eventSlug, existing }: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ParticipationFormValues>({
    resolver: zodResolver(participationSchema),
    mode: "onBlur",
    defaultValues: {
      origin_city: existing?.origin_city ?? "",
      arrival_datetime: existing
        ? isoToLocalInput(existing.arrival_datetime)
        : "",
      departure_datetime: existing
        ? isoToLocalInput(existing.departure_datetime)
        : "",
      looking_for: existing?.looking_for ?? [],
      notes: existing?.notes ?? "",
    },
  });

  async function onSubmit(values: ParticipationFormValues) {
    setSubmitError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError("Session expired. Please sign in again.");
      return;
    }

    const { error } = await supabase.from("event_participants").upsert(
      {
        event_id: eventId,
        user_id: user.id,
        origin_city: values.origin_city.trim(),
        arrival_datetime: new Date(values.arrival_datetime).toISOString(),
        departure_datetime: new Date(values.departure_datetime).toISOString(),
        looking_for: values.looking_for,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      },
      { onConflict: "event_id,user_id" },
    );

    if (error) {
      setSubmitError(error.message);
      return;
    }

    toast.success(existing ? "Updated" : "You're in!");
    router.replace(`/events/${eventSlug}`);
    router.refresh();
  }

  async function handleLeave() {
    if (!existing) return;
    if (
      !confirm("Remove yourself from this event? Others won't see you anymore.")
    ) {
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("You're out");
    router.replace(`/events/${eventSlug}`);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="origin_city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Where are you traveling from?</FormLabel>
              <FormControl>
                <Input placeholder="Bengaluru" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="arrival_datetime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arrival</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="departure_datetime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departure</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="looking_for"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What are you looking for?</FormLabel>
              <FormControl>
                <LookingForChips
                  value={field.value as LookingForValue[]}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>Pick one or more.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g. flying in from Delhi via Indigo, prefer to share an Airbnb near the venue."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional. Up to 500 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            className="h-11 w-full bg-accent text-white hover:opacity-90"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Saving…"
              : existing
                ? "Save changes"
                : "Join event"}
          </Button>
          {existing ? (
            <Button
              type="button"
              variant="ghost"
              className="h-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLeave}
            >
              Leave this event
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  );
}

function isoToLocalInput(iso: string): string {
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
