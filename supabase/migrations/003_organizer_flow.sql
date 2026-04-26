-- Phase 2.1 — organizer flow.
--
-- Lets verified organizers create their own events instead of relying on
-- admin seeding via service_role. Three changes:
--
--   1. profiles gains organizer_status + timestamps (none → pending → verified).
--   2. events gains is_published (organizers can save drafts before launch).
--   3. RLS on events is rewritten so verified organizers can write their own,
--      and only published events are publicly readable.
--
-- A security trigger on profiles prevents users from self-promoting to
-- 'verified' — only service_role can perform that transition.

------------------------------------------------------------------------
-- 1. profiles: organizer columns
------------------------------------------------------------------------

alter table public.profiles
  add column organizer_status text not null default 'none'
    check (organizer_status in ('none', 'pending', 'verified', 'rejected')),
  add column organizer_applied_at  timestamptz,
  add column organizer_verified_at timestamptz;

create index profiles_organizer_status_idx
  on public.profiles (organizer_status)
  where organizer_status in ('pending', 'verified');

------------------------------------------------------------------------
-- 2. events: is_published flag
------------------------------------------------------------------------

alter table public.events
  add column is_published boolean not null default false;

-- Existing seeded events were already public — keep them that way.
update public.events set is_published = true;

create index events_is_published_start_date_idx
  on public.events (is_published, start_date);

------------------------------------------------------------------------
-- 3. RLS — events
------------------------------------------------------------------------

-- The Phase 1 read policy was "events are publicly readable" with no
-- conditions. Replace it with a published-only one, plus a separate
-- self-read policy so organizers see their own drafts.

drop policy if exists "events are publicly readable" on public.events;

create policy "published events are publicly readable"
  on public.events for select
  to anon, authenticated
  using (is_published = true);

create policy "organizers see own events"
  on public.events for select
  to authenticated
  using (created_by = auth.uid());

-- Verified organizers can insert events they own.
create policy "verified organizers insert own events"
  on public.events for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and organizer_status = 'verified'
    )
  );

-- Organizers can update events they created (verification check too —
-- a revoked organizer can't keep editing).
create policy "verified organizers update own events"
  on public.events for update
  to authenticated
  using (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and organizer_status = 'verified'
    )
  )
  with check (created_by = auth.uid());

create policy "organizers delete own events"
  on public.events for delete
  to authenticated
  using (created_by = auth.uid());

------------------------------------------------------------------------
-- 4. Security trigger — block self-promotion on profiles
------------------------------------------------------------------------

-- Without this, the existing "users update own profile" policy would let
-- a user simply set their own organizer_status to 'verified'. The trigger
-- enforces that:
--   - service_role can do anything (admins verifying applications)
--   - users can move 'none' ↔ 'pending' (apply / withdraw)
--   - users cannot reach 'verified' or 'rejected' on their own
--   - 'verified' is sticky — only service_role can change it
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

  if auth.role() = 'service_role' then
    return new;
  end if;

  if old.organizer_status = 'verified' then
    raise exception 'verified organizer status cannot be changed by user';
  end if;

  if new.organizer_status not in ('none', 'pending') then
    raise exception 'organizer_status % cannot be set by user', new.organizer_status;
  end if;

  return new;
end;
$$;

create trigger profiles_guard_organizer_status
  before update on public.profiles
  for each row execute function public.guard_organizer_status();
