-- Tagalong — initial schema.
--
-- Tables:  profiles, events, event_participants
-- Plus:    event_category enum, RLS policies, updated_at + new-user triggers
--
-- Run this once against the Supabase project. Re-running will fail because
-- objects are created without IF NOT EXISTS — that's intentional. For
-- subsequent schema changes, write a new 002_*.sql migration.

------------------------------------------------------------------------
-- 1. Enums
------------------------------------------------------------------------

create type event_category as enum (
  'tech',
  'running',
  'music',
  'sports',
  'conference',
  'college',
  'other'
);

------------------------------------------------------------------------
-- 2. Tables
------------------------------------------------------------------------

-- profiles: 1:1 with auth.users.
-- city + at least one contact handle are required for a profile to be
-- "complete", but enforced in app logic so partial saves stay possible.
create table public.profiles (
  id               uuid        primary key references auth.users(id) on delete cascade,
  full_name        text        not null,
  avatar_url       text,
  bio              text        check (char_length(bio) <= 280),
  city             text,
  telegram_handle  text,
  twitter_handle   text,
  whatsapp_number  text,
  instagram_handle text,
  github_username  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.events (
  id              uuid           primary key default gen_random_uuid(),
  slug            text           unique not null,
  name            text           not null,
  description     text,
  category        event_category not null,
  city            text           not null,
  venue           text,
  start_date      date           not null,
  end_date        date           not null,
  cover_image_url text,
  website_url     text,
  created_by      uuid           references public.profiles(id) on delete set null,
  is_featured     boolean        not null default false,
  created_at      timestamptz    not null default now(),
  check (end_date >= start_date)
);

create index events_start_date_idx           on public.events (start_date);
create index events_category_start_date_idx  on public.events (category, start_date);

create table public.event_participants (
  id                 uuid        primary key default gen_random_uuid(),
  event_id           uuid        not null references public.events(id)   on delete cascade,
  user_id            uuid        not null references public.profiles(id) on delete cascade,
  origin_city        text        not null,
  arrival_datetime   timestamptz not null,
  departure_datetime timestamptz not null,
  looking_for        text[]      not null,
  notes              text        check (char_length(notes) <= 500),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (event_id, user_id),
  check (departure_datetime > arrival_datetime),
  check (
    array_length(looking_for, 1) > 0
    and looking_for <@ array['travel_buddy', 'cab_split', 'accommodation', 'just_meeting_people']
  )
);

create index event_participants_event_id_idx on public.event_participants (event_id);
create index event_participants_user_id_idx  on public.event_participants (user_id);

------------------------------------------------------------------------
-- 3. Triggers
------------------------------------------------------------------------

-- Bump updated_at on every row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger event_participants_set_updated_at
  before update on public.event_participants
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a user signs up.
-- Pulls full_name + avatar_url from Google's OAuth identity payload.
-- Onboarding fills the rest (city + contact handles).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------------------
-- 4. Row Level Security
------------------------------------------------------------------------

alter table public.profiles            enable row level security;
alter table public.events              enable row level security;
alter table public.event_participants  enable row level security;

-- profiles -------------------------------------------------------------

create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users delete own profile"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- events ---------------------------------------------------------------
-- Public read (anon + authenticated). No write policies = only the
-- service_role (which bypasses RLS) can insert/update/delete.

create policy "events are publicly readable"
  on public.events for select
  to anon, authenticated
  using (true);

-- event_participants ---------------------------------------------------

create policy "participants are readable by authenticated users"
  on public.event_participants for select
  to authenticated
  using (true);

create policy "users insert own participation"
  on public.event_participants for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users update own participation"
  on public.event_participants for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users delete own participation"
  on public.event_participants for delete
  to authenticated
  using (auth.uid() = user_id);
