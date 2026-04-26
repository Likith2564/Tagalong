"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type Props = {
  eventId: string;
};

/**
 * Subscribes to participant changes for one event and triggers an RSC
 * re-fetch whenever someone joins, edits, or leaves. Renders nothing.
 *
 * Uses Supabase Realtime's postgres_changes channel (RLS still applies
 * — subscribers only receive rows they're allowed to read).
 */
export function RealtimeParticipantsListener({ eventId }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`event-participants:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_participants",
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventId, router]);

  return null;
}
