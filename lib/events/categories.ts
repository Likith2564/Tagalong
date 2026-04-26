import type { Database } from "@/types/database";

export type EventCategory = Database["public"]["Enums"]["event_category"];

type CategoryMeta = {
  label: string;
  /** Tailwind text color for the category dot. */
  dotClass: string;
  /** Tailwind background tint for the badge. */
  bgClass: string;
  /** Tailwind text color for the badge. */
  textClass: string;
};

export const EVENT_CATEGORIES: readonly EventCategory[] = [
  "tech",
  "running",
  "music",
  "sports",
  "conference",
  "college",
  "other",
] as const;

export const CATEGORY_META: Record<EventCategory, CategoryMeta> = {
  tech: {
    label: "Tech",
    dotClass: "bg-cat-tech",
    bgClass: "bg-cat-tech/10",
    textClass: "text-cat-tech",
  },
  running: {
    label: "Running",
    dotClass: "bg-cat-running",
    bgClass: "bg-cat-running/10",
    textClass: "text-cat-running",
  },
  music: {
    label: "Music",
    dotClass: "bg-cat-music",
    bgClass: "bg-cat-music/10",
    textClass: "text-cat-music",
  },
  sports: {
    label: "Sports",
    dotClass: "bg-cat-sports",
    bgClass: "bg-cat-sports/10",
    textClass: "text-cat-sports",
  },
  conference: {
    label: "Conference",
    dotClass: "bg-cat-conference",
    bgClass: "bg-cat-conference/10",
    textClass: "text-cat-conference",
  },
  college: {
    label: "College",
    dotClass: "bg-cat-college",
    bgClass: "bg-cat-college/10",
    textClass: "text-cat-college",
  },
  other: {
    label: "Other",
    dotClass: "bg-cat-other",
    bgClass: "bg-cat-other/10",
    textClass: "text-cat-other",
  },
};

export function isEventCategory(value: string): value is EventCategory {
  return (EVENT_CATEGORIES as readonly string[]).includes(value);
}
