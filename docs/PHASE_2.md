# Tagalong — Phase 2 plan & forward system design

> Phase 1 ships a discovery + trust layer. Phase 2 turns it into a sustainable habit.

This doc projects forward from where we are. The current architecture is described in [README.md](../README.md) (sections 2–10). Read that first if you haven't.

---

## Table of contents

1. [Where we are](#1-where-we-are)
2. [Goals for Phase 2](#2-goals-for-phase-2)
3. [Priority-ranked feature list](#3-priority-ranked-feature-list)
4. [Architecture changes by feature](#4-architecture-changes-by-feature)
5. [Database migration plan](#5-database-migration-plan)
6. [Operational maturity (the unsexy stuff)](#6-operational-maturity-the-unsexy-stuff)
7. [Forward system architecture](#7-forward-system-architecture)
8. [Explicitly NOT in Phase 2](#8-explicitly-not-in-phase-2)
9. [Suggested release cadence](#9-suggested-release-cadence)

---

## 1. Where we are

Phase 1 is shippable. The seven verification gates all pass (see README §15). What that means concretely:

- Anyone can browse events on `/` and `/events`.
- Authed users have a profile with city + ≥ 1 contact handle.
- Authed users can join events with travel windows and `looking_for` tags.
- Other authed users can see participants and reach out via revealed contact handles (Telegram, WhatsApp, Twitter, Instagram).
- Events are admin-managed via `npm run seed` against the service role.
- All access is gated by RLS; the `proxy.ts` layer refreshes sessions and enforces auth + profile-completeness.

The honest truth about Phase 1: it's a **discovery + trust** layer. We don't host coordination — that happens off-platform on whatever messenger people already use. This is deliberate. It keeps the surface area small and the trust model coherent.

### What Phase 1 is missing for real-world use

In rough order of pain:

1. **No way for organizers to add their own events** — admin-only is a bottleneck.
2. **No notifications** — users have to come back manually to check who joined.
3. **No way for users to delete their account** — only manual removal in Supabase Studio.
4. **No real-time updates** — page refresh required to see new participants.
5. **No way to find similar events** — discovery is purely time-ordered + category filter.

Phase 2 picks these off in priority order.

---

## 2. Goals for Phase 2

Three north stars. Everything we build should serve at least one.

| Goal | What it means | How we'll measure |
|---|---|---|
| **Organic event supply** | Organizers list events without us being in the loop. | % of events with `created_by` set vs admin-seeded. |
| **Engagement loop** | Users come back without us nagging. | DAU/MAU; % of users who join ≥ 2 events. |
| **Trust + safety floor** | Phase 2 doesn't degrade the trust model from Phase 1. | Reports per 1000 users; resolution time. |

Things we are NOT optimizing for in Phase 2: monetization, multi-country expansion, mobile apps. Each is its own bet.

---

## 3. Priority-ranked feature list

| # | Feature | Why now | Rough size |
|---|---|---|---|
| 1 | **Organizer flow** + verified-organizer badge ✅ MVP | Removes the admin bottleneck; biggest growth lever. | L — MVP shipped 2026-04-26. Follow-up: in-app admin queue (currently verified via SQL Editor). |
| 2 | **Email digest notifications** | Engagement loop. "3 new people from your city joined Devcon." | M (1 week) |
| 3 | **Account deletion + data export** | GDPR posture; required as we cross a few thousand users. | S (3 days) |
| 4 | **Real-time participant updates** ✅ | Adds polish; uses Supabase Realtime, low effort. | S — shipped 2026-04-26 |
| 5 | **Search + city filter** | Phase 1 only filters by category. Search becomes important > 50 events. | M (4–5 days) |
| 6 | **Smart matching hints** | "5 people arriving within 1h of you." Delight feature. | M (4–5 days) |
| 7 | **Apple sign-in + GitHub sign-in** | Apple is mandatory if we ever ship iOS; GitHub is on-brand for tech events. | S (1 day each) |
| 8 | **Women-only mode** | High-priority for safety; needs care. See §4 below. | L (2 weeks incl. design + feedback rounds) |
| 9 | **Image upload for organizer cover photos** | Currently hot-linking external URLs. Move to Supabase Storage. | S (2 days) |
| 10 | **PWA install + offline support for event pages** | Mobile users live in PWA-able UIs. Cheap to enable once. | S (1 day) |

Items 1–4 are the **must-ship** Phase 2 set. The rest are nice-to-haves that we can pull forward if signal points there.

---

## 4. Architecture changes by feature

This is the meaty section. Each subsection covers what the feature changes about the system.

### 4.1 Organizer flow

**The shift:** events become user-generated, not admin-seeded. We need a new role and an approval queue so we don't lose the "the event is the trust filter" property.

**Database changes:**

```sql
-- Add organizer role on the profile
alter table public.profiles
  add column organizer_status text
    not null default 'none'
    check (organizer_status in ('none', 'pending', 'verified', 'rejected'));

-- Track who applied and when
alter table public.profiles
  add column organizer_applied_at timestamptz,
  add column organizer_verified_at timestamptz;

-- Allow organizers to write events they own
alter table public.events
  add column organizer_status text
    not null default 'draft'
    check (organizer_status in ('draft', 'pending_review', 'live', 'rejected'));
```

**RLS changes:**

```sql
-- Organizers can insert events
create policy "verified organizers insert events"
  on public.events for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and organizer_status = 'verified'
    )
    and created_by = auth.uid()
  );

-- Organizers can update their own events
create policy "organizers update own events"
  on public.events for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- The publicly-readable policy from Phase 1 needs a tweak
drop policy "events are publicly readable" on public.events;

create policy "live events are publicly readable"
  on public.events for select
  to anon, authenticated
  using (organizer_status = 'live');

-- Organizers see their own drafts
create policy "organizers see own events"
  on public.events for select
  to authenticated
  using (created_by = auth.uid());
```

**New routes:**

- `/organizer/apply` — application form (one-time per user).
- `/organizer/events` — list of own events (drafts + live).
- `/organizer/events/new` — create form (multi-step).
- `/organizer/events/[id]/edit` — edit own event.
- `/admin/organizers` — internal queue for reviewing applications. Service-role gated.

**New components:** `OrganizerBadge`, `EventDraftCard`, `OrganizerApplicationForm`.

**Operational:** notify on application submitted → reviewer Slack hook? Or just email. Reviewer toggles `organizer_status` to `verified` from a service-role admin tool.

**Risk:** the "trust filter" weakens if anyone can post events. Mitigation: organizer verification + visible badge on event pages.

### 4.2 Email digest notifications

**The shift:** users opt into a weekly digest of activity on events they've joined.

**Database changes:**

```sql
create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  weekly_digest boolean not null default true,
  on_new_participant boolean not null default false,
  -- For unsubscribe links — never expose user_id in URLs
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**New service:** Resend or Postmark for email delivery. Resend is friendlier for early-stage; Postmark has better deliverability at scale.

**Scheduled jobs:**
- Vercel Cron hits a Route Handler at `/api/cron/digest` weekly (Sundays 10:00 IST).
- That handler queries: for each user with `weekly_digest=true`, find new participants on events they've joined since their last digest, batch-send via Resend.
- Idempotency: track `last_digest_sent_at` per user.

**New routes:**
- `/api/cron/digest` — POST, requires `Authorization: Bearer ${CRON_SECRET}` header.
- `/unsubscribe?token=...` — page that flips `weekly_digest` to false.
- `/profile/notifications` — preferences UI.

**Files to add:**
- `lib/notifications/digest.ts` — query + render logic.
- `lib/notifications/email.tsx` — React Email templates.

**Risk:** sending to wrong addresses, getting flagged as spam. Mitigation: SPF/DKIM/DMARC set up properly on the sending domain, low send volume to start, clean unsubscribe link.

### 4.3 Account deletion + data export

**The shift:** users can delete their account from `/profile`. We honor it.

**Database:** no schema changes — `auth.users` delete cascades through `profiles` and `event_participants` already.

**New route:**
- `/profile/delete` — confirmation modal → calls a Server Action that calls `supabase.auth.admin.deleteUser(uid)` (uses service role).
- `/api/profile/export` — returns a JSON file with all of the user's data (profile + participations).

**Files:**
- `lib/admin/supabase.ts` — server-only client with the service role key. Lint rule blocks importing this from `'use client'` files.

**Risk:** deletion is irreversible. UI must require typing the user's name to confirm.

### 4.4 Real-time participant updates

**The shift:** when someone joins an event, everyone else viewing it sees the new card without refreshing.

**Implementation:** Supabase Realtime subscription.

```ts
// In a client component on /events/[slug]
useEffect(() => {
  const supabase = createClient();
  const channel = supabase
    .channel(`event:${eventId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'event_participants',
      filter: `event_id=eq.${eventId}`,
    }, (payload) => {
      router.refresh(); // RSC re-fetch
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [eventId]);
```

**Database:** enable Realtime on `event_participants` in the Supabase dashboard.

**Trade-off:** `router.refresh()` re-runs the whole RSC query. Fine for participant lists ≤ ~50. Beyond that, consider a more surgical approach (fetch only the new row).

### 4.5 Search + city filter

**The shift:** the events list gets a text search box and a city filter.

**For Phase 2** we use Postgres full-text search (no external service yet):

```sql
alter table public.events
  add column search_vector tsvector
    generated always as (
      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(city, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(venue, '')), 'C')
    ) stored;

create index events_search_idx on public.events using gin (search_vector);
```

Query: `.textSearch('search_vector', query, { type: 'websearch' })`.

**City filter:** distinct query for cities → dropdown. Server component reads `?city=` searchParam.

**Beyond ~10K events,** move to Typesense or Meilisearch (both work fine on Vercel via webhooks). Don't pre-optimize for that.

### 4.6 Smart matching hints

**The shift:** on `/events/[slug]/join` (form), once the user enters arrival/departure datetimes, we show "5 people are arriving within 1h of you". Reduces the cold-start hesitation of being the first to join.

**Implementation:** a server query that runs on the join page after the user blurs the datetime fields. Or compute when rendering the participant list — show "arriving close to you" as a sort.

```sql
-- Find participants whose arrival window overlaps within ± 60 min
select count(*) from public.event_participants
where event_id = $1
  and abs(extract(epoch from (arrival_datetime - $2))) < 3600;
```

No schema changes needed. Just add a small "matches" badge on participant cards: "Arriving close to you", "From your city", "Same departure flight".

### 4.7 Women-only mode

**The shift:** users can opt to see only female-identifying participants on event pages, and be visible only to other women.

This is genuinely hard to design well. The safety-shaped version:

**Database:**

```sql
alter table public.profiles
  add column gender text
    check (gender in ('female', 'male', 'non_binary', 'prefer_not_to_say')),
  add column safe_mode_enabled boolean not null default false;
```

**Visibility rule (in app, since RLS can't easily express "show only when both sides opt in"):** show female + non-binary participants only to female + non-binary viewers who have `safe_mode_enabled`.

**Open questions:** verification (do we trust self-reported gender?), abuse (men signing up as women), trans inclusion (yes), what happens to the rest of the experience for safe-mode users.

**Recommendation:** do a 2-week design sprint with feedback from female users before building. Don't ship speculative safety features.

### 4.8 Multiple OAuth providers

**Apple sign-in** is required if we ever submit to the App Store. Setup is fiddlier than Google (needs Apple Developer account + JWT-signed client secrets). Supabase has a guide.

**GitHub sign-in** is on-brand for tech events. Trivial via Supabase — paste Client ID/Secret like Google.

No schema changes. Just additional buttons on `/login` and additional providers configured in Supabase Dashboard.

### 4.9 Image upload for organizer covers

**The shift:** organizers upload a cover image instead of pasting an Unsplash URL.

**Database:** no changes (`cover_image_url` already exists). The URL just points to Supabase Storage instead of Unsplash.

**New bucket:** `event-covers` in Supabase Storage. Public read, owner-write via RLS on storage.objects.

**Image transforms:** Supabase Storage supports image transformations (`?width=1200&quality=80`) — use these for responsive images and replace the raw `<img>` tags with `next/image` (which currently we avoid because of hot-linking).

### 4.10 PWA install

**The shift:** users on mobile see "Add to Home Screen" and the app feels app-like.

**Files:**
- `public/manifest.json` — name, short_name, icons, theme_color.
- `app/layout.tsx` — `<link rel="manifest" href="/manifest.json" />`.
- `app/icon.png`, `app/apple-icon.png` — icon assets.
- (Optional) Service worker for offline event detail caching.

Cheap, ~1 day. Worth doing once the brand assets are ready.

---

## 5. Database migration plan

Migrations are append-only. Each Phase 2 feature gets its own numbered file:

```
supabase/migrations/
├── 001_initial.sql                 ← Phase 1 (shipped)
├── 002_organizer_flow.sql          ← §4.1
├── 003_notification_preferences.sql ← §4.2
├── 004_search_vector.sql           ← §4.5
├── 005_safe_mode.sql               ← §4.7
└── ...
```

Apply via Dashboard SQL Editor (current flow) or `supabase db push` once the user has the DB password set up locally.

After every migration: `npm run gen:types` to refresh `types/database.ts`.

---

## 6. Operational maturity (the unsexy stuff)

Phase 1 is intentionally light on ops. Phase 2 should add:

| Concern | Phase 1 | Phase 2 plan |
|---|---|---|
| **Error tracking** | None | Sentry on Vercel + the browser. Free tier covers us for a long while. |
| **Analytics** | None | Plausible or PostHog. Privacy-first. PostHog has free product analytics + session replay. |
| **Rate limiting** | None | Upstash Ratelimit on the join + profile-update endpoints. 10 req/min per IP. |
| **CI/CD** | Vercel auto-deploy on push | Add GitHub Actions: type-check + lint + build on every PR. |
| **Database backups** | Supabase auto (free tier: 7 days) | Same. Upgrade to Pro when paying users appear. |
| **Monitoring** | None | UptimeRobot ping on `/` + `/events`. Free tier. |
| **Tests** | None | Add Vitest for `lib/` (validation, format, isProfileComplete). Add Playwright for the sign-in → join → see-yourself flow. |
| **Lint rules** | Default Next.js | Add `eslint-plugin-no-secrets` to catch accidentally-committed tokens. |
| **Type-safe env** | Direct `process.env.X!` | Add `lib/env.ts` with Zod schema. Fail fast on missing vars at boot. |

None of these block features but they mature the codebase from "demo" to "service".

---

## 7. Forward system architecture

The Phase 2 system layers a few new boxes on the Phase 1 diagram:

```
┌─────────────────────────────────────────────────────────────────┐
│                            Browser                               │
│  Next.js (RSC + Client Components)                               │
│  + Realtime WebSocket subscription on event participants         │
│  + PWA shell (Phase 2.10)                                        │
└──────┬───────────────────────────────────────────────────────────┘
       │
       │ HTTPS                                ┌──────────────────┐
       ▼                                      │ Supabase Realtime │ (4.4)
┌──────────────────────────┐ ◄────────────── └──────────────────┘
│  Vercel (Next.js)        │
│  + Vercel Cron → /api/cron/digest (4.2)                  ┌──────────┐
│  + Sentry SDK (§6)       │ ────────────────────────────► │  Resend  │ (4.2)
│  + Upstash Ratelimit     │                               └──────────┘
└──────┬───────────────────┘
       │
       │ supabase-js (typed)
       ▼
┌─────────────────────────────────┐
│       Supabase Postgres         │
│  + organizer_status columns     │ (4.1)
│  + notification_preferences     │ (4.2)
│  + search_vector tsvector       │ (4.5)
│  + safe_mode columns            │ (4.7)
│                                 │
│  + Storage (event-covers)       │ (4.9)
└─────────────────────────────────┘
```

Two new external services: **Resend** (email) and **Sentry** (errors). Both have generous free tiers and are removable later.

### What stays the same

- Next.js App Router with Server Components first.
- Supabase as the single source of truth for auth + data.
- RLS as the primary authorization mechanism.
- shadcn/ui + Tailwind v4 design system.
- The off-platform coordination model — we don't host messaging, ever.

### What changes

- The "events are admin-only" assumption goes away. Most code paths already permit owner-writes on `event_participants`; we extend the same pattern to `events.created_by`.
- An async dimension appears: cron jobs, real-time subscriptions, email send queues. Tested with idempotency keys, not "exactly once".

---

## 8. Explicitly NOT in Phase 2

Same discipline as Phase 1 — say no to obvious-but-wrong features.

| Feature | Why not |
|---|---|
| In-app messaging | Defeats the entire trust model. We're a discovery layer, not a chat. |
| Payment splitting (Razorpay etc.) | Money complicates the trust + liability story. Phase 3 at earliest. |
| Mobile native apps | PWA covers 90% of the value for 5% of the effort. Native is a Phase 4 question. |
| AI-generated event recommendations | We don't have enough data to be useful. Re-evaluate after a year. |
| Group chat per event | Same reason as in-app messaging. Telegram already does this better. |
| Premium / paid tiers | Wait for organic demand. No paid features in Phase 2. |
| Multi-country expansion | Indian market has plenty of room. Don't dilute focus. |
| Internationalization (i18n) | English works for our users today. Revisit at country expansion. |

---

## 9. Suggested release cadence

A loose plan, not a commitment:

| Release | Contents | Goal |
|---|---|---|
| **0.1.0** (today) | Phase 1 shipped to Vercel. | Get into users' hands; collect feedback. |
| **0.2.0** (~3 weeks) | §4.1 organizer flow + §4.3 account deletion. | Unlock organic event supply. |
| **0.3.0** (~5 weeks) | §4.2 email digests + §4.4 real-time. | Engagement loop. |
| **0.4.0** (~7 weeks) | §4.5 search + §4.6 smart matching. | Discovery polish. |
| **0.5.0** (~10 weeks) | §4.7 safe mode (pending design sprint). | Trust + safety. |
| **0.6.0** (~12 weeks) | §4.8–4.10 (OAuth providers, image uploads, PWA). | Last-mile polish. |

Re-evaluate after every release based on what users actually do.

---

## Appendix: Open questions

Things we don't have good answers for yet:

1. **Pricing model.** Is Tagalong free forever for users? Do organizers pay? Is there a transaction fee on travel splits (Phase 3)? Defer.
2. **Liability.** What happens when two users meet via Tagalong and something bad happens? T&C should cover it but the soft answer is "we're a directory, not a service provider". Tighten with legal counsel before scale.
3. **Geographic concentration.** Phase 1 is India-flavored. International events should work but the brand voice + payment-relevant copy assumes India. Decide before global SEO push.
4. **Event lifecycle.** What happens to past events? Hide from list? Archive but keep URLs alive for SEO? Decide before the first event passes.

These are flagged for a Phase 2 product review session, not for me to decide.

---

*Last updated: 2026-04-26. Tracks the state of the codebase at commit-of-this-file.*
