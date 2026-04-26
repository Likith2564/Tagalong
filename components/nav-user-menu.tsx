"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarPlus, LogOut, ShieldCheck, Sparkles, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OrganizerStatus } from "@/lib/auth/organizer";
import { createClient } from "@/lib/supabase/client";

type Props = {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  organizerStatus: OrganizerStatus;
  isAdmin: boolean;
};

export function NavUserMenu({
  fullName,
  email,
  avatarUrl,
  organizerStatus,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const initials = getInitials(fullName);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Avatar className="h-9 w-9 border border-border">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
          <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-foreground">{fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/profile" />}>
          <UserRound className="h-4 w-4" />
          Edit profile
        </DropdownMenuItem>

        {isAdmin ? (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <ShieldCheck className="h-4 w-4" />
            Admin dashboard
          </DropdownMenuItem>
        ) : null}

        {organizerStatus === "verified" ? (
          <DropdownMenuItem render={<Link href="/organizer/events" />}>
            <CalendarPlus className="h-4 w-4" />
            Organizer dashboard
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem render={<Link href="/organizer/apply" />}>
            <Sparkles className="h-4 w-4" />
            {organizerStatus === "pending"
              ? "Application pending"
              : "Become an organizer"}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>
          <LogOut className="h-4 w-4" />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
