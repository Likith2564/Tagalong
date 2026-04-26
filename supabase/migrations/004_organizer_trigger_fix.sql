-- Phase 2.1 hotfix — make the organizer-status guard work from the SQL Editor.
--
-- The original trigger (migration 003) checked `auth.role() = 'service_role'`
-- to bypass the guard for admin operations. That works when the service-role
-- JWT is present, but the Supabase Dashboard SQL Editor runs as the
-- `postgres` user with no JWT at all, so the bypass never matched and admin
-- verifies were blocked.
--
-- Fix: also bypass when there's no authenticated user (i.e. `auth.uid()` is
-- null). This is safe because RLS already blocks JWT-less UPDATEs from
-- regular client paths — only admin contexts (SQL Editor, service role) can
-- reach the trigger without a JWT.

create or replace function public.guard_organizer_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.organizer_status is not distinct from new.organizer_status then
    return new;
  end if;

  -- Admin contexts: SQL Editor (no JWT) or explicit service_role JWT.
  if auth.uid() is null or auth.role() = 'service_role' then
    return new;
  end if;

  -- Regular authenticated user: enforce the state machine.
  if old.organizer_status = 'verified' then
    raise exception 'verified organizer status cannot be changed by user';
  end if;

  if new.organizer_status not in ('none', 'pending') then
    raise exception 'organizer_status % cannot be set by user', new.organizer_status;
  end if;

  return new;
end;
$$;
