import { z } from "zod";

import { EVENT_CATEGORIES } from "@/lib/events/categories";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const URL_REGEX = /^https?:\/\/[^\s]+$/;

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal(""));
const optionalUrl = (max: number) =>
  z
    .string()
    .max(max)
    .regex(URL_REGEX, "Must be a full URL starting with http(s)://")
    .optional()
    .or(z.literal(""));

export const eventSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name is required")
      .max(120, "Keep it under 120 characters"),
    slug: z
      .string()
      .trim()
      .min(3, "Slug is required")
      .max(80, "Keep it under 80 characters")
      .regex(
        SLUG_REGEX,
        "Lowercase letters, numbers, and dashes only (e.g. hackbangalore-2026)",
      ),
    category: z.enum(EVENT_CATEGORIES as unknown as [string, ...string[]]),
    city: z
      .string()
      .trim()
      .min(1, "City is required")
      .max(100, "Keep it under 100 characters"),
    venue: optionalText(150),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    description: optionalText(2000),
    cover_image_url: optionalUrl(500),
    website_url: optionalUrl(500),
    is_featured: z.boolean(),
    is_published: z.boolean(),
  })
  .refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: "End date must be on or after start date",
    path: ["end_date"],
  });

export type EventFormValues = z.infer<typeof eventSchema>;
