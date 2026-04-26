import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Resolves the current user + admin flag in one trip. Returns null when
 * not signed in. Used by admin pages to guard access without each page
 * re-implementing the same select.
 */
export async function getAdminContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) return null;

  return {
    supabase,
    user,
    profile,
  };
}

/**
 * Use at the top of any admin page. Redirects non-admins out.
 * Throws control-flow via `redirect`; never returns null when called.
 */
export async function requireAdmin() {
  const ctx = await getAdminContext();
  if (!ctx) {
    redirect("/");
  }
  return ctx;
}
