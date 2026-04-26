import { NextResponse, type NextRequest } from "next/server";

import { isProfileComplete } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

const SAFE_NEXT_PATHS = /^\/(events|profile)(\/[\w\-/]*)?$/;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/events";
  // Open-redirect guard: only allow internal paths from a known allow-list.
  const next = SAFE_NEXT_PATHS.test(nextParam) ? nextParam : "/events";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", url.origin));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", url.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", url.origin));
  }

  // The handle_new_user trigger creates a row on first sign-in, but it may
  // race or be missing in edge cases — `maybeSingle` lets us treat absence
  // as "incomplete" rather than throwing.
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "city, telegram_handle, twitter_handle, whatsapp_number, instagram_handle",
    )
    .eq("id", user.id)
    .maybeSingle();

  const target = isProfileComplete(profile) ? next : "/onboarding";
  return NextResponse.redirect(new URL(target, url.origin));
}
