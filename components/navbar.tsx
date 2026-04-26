import Link from "next/link";

import { Logo } from "@/components/logo";
import { NavUserMenu } from "@/components/nav-user-menu";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    full_name: string;
    avatar_url: string | null;
  } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden text-sm sm:block">
            <Link
              href="/events"
              className="font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Events
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/events"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:hidden"
          >
            Events
          </Link>
          {user && profile ? (
            <NavUserMenu
              fullName={profile.full_name}
              email={user.email ?? ""}
              avatarUrl={profile.avatar_url}
            />
          ) : (
            <Link
              href="/login"
              className={cn(
                buttonVariants(),
                "h-9 px-4 bg-accent text-white hover:opacity-90",
              )}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
