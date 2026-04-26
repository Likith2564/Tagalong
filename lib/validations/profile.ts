import { z } from "zod";

const HANDLE_REGEX = /^[a-zA-Z0-9_.]+$/;
const E164_REGEX = /^\+?[1-9]\d{6,14}$/;

const optionalString = (schema: z.ZodString) =>
  schema.optional().or(z.literal(""));

export const profileSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Keep it under 100 characters"),
    city: z
      .string()
      .trim()
      .min(1, "City is required")
      .max(100, "Keep it under 100 characters"),
    bio: optionalString(z.string().max(280, "Bio must be 280 characters or less")),
    telegram_handle: optionalString(
      z
        .string()
        .max(32, "Too long")
        .regex(HANDLE_REGEX, "Letters, numbers, dots, and underscores only"),
    ),
    twitter_handle: optionalString(
      z
        .string()
        .max(32, "Too long")
        .regex(HANDLE_REGEX, "Letters, numbers, dots, and underscores only"),
    ),
    whatsapp_number: optionalString(
      z.string().regex(E164_REGEX, "Use E.164 format, e.g. +919876543210"),
    ),
    instagram_handle: optionalString(
      z
        .string()
        .max(30, "Too long")
        .regex(HANDLE_REGEX, "Letters, numbers, dots, and underscores only"),
    ),
    github_username: optionalString(
      z
        .string()
        .max(39, "Too long")
        .regex(HANDLE_REGEX, "Letters, numbers, dots, and underscores only"),
    ),
  })
  .refine(
    (data) =>
      Boolean(
        data.telegram_handle ||
          data.twitter_handle ||
          data.whatsapp_number ||
          data.instagram_handle,
      ),
    {
      message:
        "Add at least one contact handle (Telegram, WhatsApp, Twitter, or Instagram)",
      // Surface the error on telegram_handle since it's first in the contact section.
      path: ["telegram_handle"],
    },
  );

export type ProfileFormValues = z.infer<typeof profileSchema>;
