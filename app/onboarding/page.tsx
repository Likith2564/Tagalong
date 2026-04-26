import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile-form";
import { isProfileComplete } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // If they already filled this out, send them to /profile to edit instead.
  if (isProfileComplete(profile)) {
    redirect("/profile");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-start px-6 py-12 sm:py-20">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Tagalong
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Tell us about yourself
          </h1>
          <p className="mt-2 text-muted-foreground">
            One step before you can join events. Add your city and at least one
            way for fellow attendees to reach you.
          </p>
        </div>
        <ProfileForm
          successHref="/events"
          submitLabel="Save and continue"
          defaultValues={{
            full_name: profile?.full_name ?? "",
            city: profile?.city ?? "",
            bio: profile?.bio ?? "",
            telegram_handle: profile?.telegram_handle ?? "",
            twitter_handle: profile?.twitter_handle ?? "",
            whatsapp_number: profile?.whatsapp_number ?? "",
            instagram_handle: profile?.instagram_handle ?? "",
            github_username: profile?.github_username ?? "",
          }}
        />
      </div>
    </main>
  );
}
