import { NextResponse, type NextRequest } from "next/server";

import { isProfileComplete } from "@/lib/auth/profile";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = new Set(["/", "/login"]);
const PUBLIC_PREFIXES = ["/auth/", "/_next/", "/api/"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return response;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authed user — check profile completeness for routes that need it.
  if (pathname !== "/onboarding") {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "city, telegram_handle, twitter_handle, whatsapp_number, instagram_handle",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (!isProfileComplete(profile)) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return response;
}

export const config = {
  // Match every path except static assets and image files. The proxy
  // body itself decides which paths are public.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
