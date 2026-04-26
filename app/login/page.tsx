import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleLoginButton } from "@/components/google-login-button";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(next ?? "/events");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link
            href="/"
            className="text-sm font-medium uppercase tracking-widest text-accent"
          >
            Tagalong
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            Welcome
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to find your travel buddies for any event.
          </p>
        </div>

        {error === "auth_failed" ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            Sign-in didn't go through. Please try again.
          </p>
        ) : null}

        <GoogleLoginButton next={next} />

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our terms and privacy policy.
        </p>
      </div>
    </main>
  );
}
