import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile-form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="flex flex-1 flex-col items-center justify-start px-6 py-12 sm:py-16">
      <div className="w-full max-w-md space-y-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Profile
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Edit your profile
          </h1>
          <p className="mt-2 text-muted-foreground">
            Keep your details fresh — these are what other attendees see.
          </p>
        </div>
        <ProfileForm
          submitLabel="Save changes"
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
