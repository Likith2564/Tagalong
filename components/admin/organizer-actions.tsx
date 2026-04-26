"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Props = {
  profileId: string;
  status: "pending" | "verified" | "rejected" | "none";
};

export function OrganizerActions({ profileId, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"verify" | "reject" | "revoke" | null>(null);

  async function update(
    next: "verified" | "rejected" | "none",
    busyKind: "verify" | "reject" | "revoke",
    successMessage: string,
  ) {
    if (busy) return;
    setBusy(busyKind);
    const supabase = createClient();
    const payload: {
      organizer_status: "verified" | "rejected" | "none";
      organizer_verified_at?: string | null;
    } = { organizer_status: next };
    if (next === "verified") {
      payload.organizer_verified_at = new Date().toISOString();
    }
    if (next === "none") {
      payload.organizer_verified_at = null;
    }
    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", profileId);
    if (error) {
      toast.error(error.message);
      setBusy(null);
      return;
    }
    toast.success(successMessage);
    router.refresh();
  }

  if (status === "pending") {
    return (
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => update("verified", "verify", "Verified")}
          disabled={busy !== null}
          className="h-8 px-3 bg-accent text-white hover:opacity-90"
        >
          {busy === "verify" ? "Verifying…" : "Verify"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => update("rejected", "reject", "Rejected")}
          disabled={busy !== null}
          className="h-8 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {busy === "reject" ? "Rejecting…" : "Reject"}
        </Button>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => update("none", "revoke", "Revoked")}
        disabled={busy !== null}
        className="h-8 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        {busy === "revoke" ? "Revoking…" : "Revoke"}
      </Button>
    );
  }

  if (status === "rejected") {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => update("none", "revoke", "Reset")}
        disabled={busy !== null}
        className="h-8 px-3"
      >
        {busy === "revoke" ? "Resetting…" : "Reset to none"}
      </Button>
    );
  }

  return null;
}
