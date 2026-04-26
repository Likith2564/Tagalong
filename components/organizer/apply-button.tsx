"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function ApplyButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApply() {
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        organizer_status: "pending",
        organizer_applied_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Application submitted!");
    router.refresh();
  }

  return (
    <Button
      type="button"
      onClick={handleApply}
      disabled={loading}
      className="h-11 px-6 bg-accent text-white hover:opacity-90"
    >
      {loading ? "Submitting…" : "Apply to organize"}
    </Button>
  );
}
