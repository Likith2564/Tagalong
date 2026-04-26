/**
 * A profile is "complete" once the user has set a city and at least one
 * contact handle. We enforce this in the app rather than at the DB layer
 * so the auto-create-profile trigger can leave those fields blank on
 * first sign-in. See README §5 for the full rationale.
 */
export type ProfileCompletenessFields = {
  city: string | null;
  telegram_handle: string | null;
  twitter_handle: string | null;
  whatsapp_number: string | null;
  instagram_handle: string | null;
};

export function isProfileComplete(
  profile: ProfileCompletenessFields | null | undefined,
): boolean {
  if (!profile) return false;
  if (!profile.city || profile.city.trim().length === 0) return false;
  return Boolean(
    profile.telegram_handle ||
      profile.twitter_handle ||
      profile.whatsapp_number ||
      profile.instagram_handle,
  );
}
