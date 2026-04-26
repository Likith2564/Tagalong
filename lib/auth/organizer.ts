export type OrganizerStatus = "none" | "pending" | "verified" | "rejected";

const VALID: readonly OrganizerStatus[] = [
  "none",
  "pending",
  "verified",
  "rejected",
];

/**
 * Narrow the loose `string` type from generated DB types to the actual
 * enum-via-CHECK values. Falls back to "none" if somehow neither matches
 * (would only happen if the DB constraint changes without this code).
 */
export function asOrganizerStatus(value: string | null | undefined): OrganizerStatus {
  if (value && (VALID as readonly string[]).includes(value)) {
    return value as OrganizerStatus;
  }
  return "none";
}

export function isVerifiedOrganizer(status: OrganizerStatus | string | null): boolean {
  return asOrganizerStatus(status) === "verified";
}
