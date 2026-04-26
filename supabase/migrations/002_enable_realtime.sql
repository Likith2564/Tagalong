-- Phase 2.4 — enable Supabase Realtime on event_participants.
--
-- This adds the table to the supabase_realtime publication, which is what
-- Realtime broadcasts INSERT/UPDATE/DELETE events from. RLS still applies
-- (subscribers only receive rows they're allowed to read), so we don't need
-- to relax any policies.
--
-- One-time. Re-running is a no-op (publication membership is idempotent
-- via the explicit guard below).

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'event_participants'
  ) then
    alter publication supabase_realtime add table public.event_participants;
  end if;
end $$;
