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
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/lib/validations/profile";

type Props = {
  defaultValues: ProfileFormValues;
  /**
   * Where to navigate on save. Omit to stay on the page and show a toast
   * instead — used by the /profile edit screen.
   */
  successHref?: string;
  submitLabel?: string;
};

export function ProfileForm({
  defaultValues,
  successHref,
  submitLabel = "Save and continue",
}: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: "onBlur",
  });

  async function onSubmit(values: ProfileFormValues) {
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

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: values.full_name.trim(),
      city: values.city.trim(),
      bio: nullIfEmpty(values.bio),
      telegram_handle: nullIfEmpty(values.telegram_handle),
      twitter_handle: nullIfEmpty(values.twitter_handle),
      whatsapp_number: nullIfEmpty(values.whatsapp_number),
      instagram_handle: nullIfEmpty(values.instagram_handle),
      github_username: nullIfEmpty(values.github_username),
    });

    if (error) {
      setSubmitError(error.message);
      return;
    }

    if (successHref) {
      router.replace(successHref);
      router.refresh();
    } else {
      toast.success("Profile saved");
      form.reset(values);
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" autoComplete="name" {...field} />
              </FormControl>
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
              <FormDescription>Where you&apos;re based.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A line or two about yourself."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional. Up to 280 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-1 pt-2">
          <p className="text-sm font-medium text-foreground">Contact handles</p>
          <p className="text-xs text-muted-foreground">
            Add at least one. Other attendees use these to reach you.
          </p>
        </div>

        <FormField
          control={form.control}
          name="telegram_handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telegram</FormLabel>
              <FormControl>
                <Input placeholder="username (no @)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="whatsapp_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp</FormLabel>
              <FormControl>
                <Input
                  placeholder="+919876543210"
                  inputMode="tel"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                With country code, e.g. +91 for India.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="twitter_handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Twitter / X</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instagram_handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instagram</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="github_username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GitHub</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormDescription>
                Optional — useful for hackathons & tech events.
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

        <Button
          type="submit"
          className="h-11 w-full bg-accent text-white hover:opacity-90"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
