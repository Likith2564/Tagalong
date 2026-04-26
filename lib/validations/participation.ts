import { z } from "zod";

export const LOOKING_FOR_OPTIONS = [
  { value: "travel_buddy", label: "Travel buddy" },
  { value: "cab_split", label: "Cab split" },
  { value: "accommodation", label: "Accommodation share" },
  { value: "just_meeting_people", label: "Just meeting people" },
] as const;

export type LookingForValue = (typeof LOOKING_FOR_OPTIONS)[number]["value"];
const LOOKING_FOR_VALUES = LOOKING_FOR_OPTIONS.map((o) => o.value) as [
  LookingForValue,
  ...LookingForValue[],
];

export const participationSchema = z
  .object({
    origin_city: z
      .string()
      .trim()
      .min(1, "Origin city is required")
      .max(100, "Keep it under 100 characters"),
    arrival_datetime: z.string().min(1, "Arrival time is required"),
    departure_datetime: z.string().min(1, "Departure time is required"),
    looking_for: z
      .array(z.enum(LOOKING_FOR_VALUES))
      .min(1, "Pick at least one"),
    notes: z
      .string()
      .max(500, "Notes can be at most 500 characters")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => new Date(data.departure_datetime) > new Date(data.arrival_datetime),
    {
      message: "Departure must be after arrival",
      path: ["departure_datetime"],
    },
  );

export type ParticipationFormValues = z.infer<typeof participationSchema>;
