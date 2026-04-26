-- Phase 2.1b — admin port.
--
-- Adds an in-app admin role so verification, event creation, and event
-- editing can happen through the UI instead of the SQL Editor.
--
-- The admin flag itself is set only via the SQL Editor (service_role) — we
-- never expose a way to self-promote to admin.
--
-- Three changes:
--   1. profiles.is_admin column.
--   2. RLS policies that let admins read/write any event.
--   3. Update the organizer-status guard trigger so admins (UI requests with
--      a JWT) can verify/reject organizers — previously only service_role
--      and JWT-less admin contexts could.

------------------------------------------------------------------------
-- 1. profiles: is_admin
------------------------------------------------------------------------

alter table public.profiles
  add column is_admin boolean not null default false;

create index profiles_is_admin_idx
  on public.profiles (is_admin)
  where is_admin = true;

------------------------------------------------------------------------
-- 2. Admins can read/write any event
------------------------------------------------------------------------
-- These are additive to the organizer policies from migration 003.
-- Admin can do anything an organizer can, and more (drafts owned by others,
-- delete any event, etc.).

create policy "admins read all events"
  on public.events for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "admins insert events"
  on public.events for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "admins update events"
  on public.events for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "admins delete events"
  on public.events for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

------------------------------------------------------------------------
-- 3. Update the organizer-status guard trigger to admit admins
------------------------------------------------------------------------
-- The trigger from 003/004 allowed JWT-less requests (SQL Editor) and
-- explicit service_role JWTs through. Now we also let admin users (regular
-- JWT requests where the caller's profile.is_admin = true) pass — that's
-- what makes the in-app verify / reject buttons work.

create or replace function public.guard_organizer_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_admin boolean;
begin
  if old.organizer_status is not distinct from new.organizer_status then
    return new;
  end if;

  -- Admin contexts: SQL Editor (no JWT) or explicit service_role JWT.
  if auth.uid() is null or auth.role() = 'service_role' then
    return new;
  end if;

  -- In-app admins.
  select is_admin into caller_is_admin
    from public.profiles
   where id = auth.uid();

  if caller_is_admin then
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
