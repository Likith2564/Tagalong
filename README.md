# Tagalong

> Find your travel buddies for any event.

Tagalong is a web app where people attending the same event — hackathons, marathons, music festivals, conferences — can find each other **before** the event to coordinate travel, split cabs from airports/stations, and share accommodation.

The event itself is the trust filter. Users browse upcoming events, join one they're attending, share their travel details, see who else is going, and connect via their preferred contact handle (Telegram, WhatsApp, Twitter, Instagram). Tagalong is a **discovery + trust layer** — actual coordination happens off-platform on whichever messenger users already prefer.

---

## Table of contents

1. [Product overview](#1-product-overview)
2. [System architecture](#2-system-architecture)
3. [Tech stack and rationale](#3-tech-stack-and-rationale)
4. [Data model](#4-data-model)
5. [Authentication & authorization](#5-authentication--authorization)
6. [Routes and pages](#6-routes-and-pages)
7. [Component inventory](#7-component-inventory)
8. [Folder structure](#8-folder-structure)
9. [Design system](#9-design-system)
10. [Security & privacy](#10-security--privacy)
11. [Phase 1 scope vs. future phases](#11-phase-1-scope-vs-future-phases)
12. [Local setup](#12-local-setup)
13. [Google OAuth setup](#13-google-oauth-setup)
14. [Deployment](#14-deployment)
15. [Build execution order](#15-build-execution-order)

---

## 1. Product overview

### Problem

Going to an event in another city is logistically annoying. People want:
- Someone to share an airport/station cab with.
- Someone to split an Airbnb or hotel room with.
- Someone to travel with on the same flight/train.
- Someone to actually meet at the event.

Today this happens in WhatsApp groups, Twitter replies, Discord channels, scattered DMs. Discovery is poor and trust is unclear.

### Solution

A focused directory: **per-event participant boards**. Pick the event you're going to, declare your travel window and what you're looking for, and see everyone else's. Click a contact button to reveal their handle and reach out.

### What Tagalong is *not*

- Not a chat app. We don't host conversations.
- Not a payments app. We don't split bills.
- Not a ticketing platform. We don't sell event tickets.
- Not a social network. There is no feed, follows, or likes.

Keeping the surface area small is deliberate — it is what makes the product trustworthy and shippable.

### Core user journeys

1. **Discover.** Land on homepage → browse featured events → click an event → see who's going (with login wall for participant details).
2. **Join.** Sign in with Google → complete profile (city + at least one contact handle) → join an event with travel details.
3. **Connect.** On an event page, see other participants whose travel windows overlap → click their contact button → DM them on Telegram/WhatsApp/etc.

---

## 2. System architecture

### High-level diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js App (React Server + Client Components)       │   │
│  │   - Server Components: data fetch via Supabase SSR    │   │
│  │   - Client Components: forms, ContactReveal, filters  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┬───────────────┘
                   │                          │
                   │ HTTPS                    │ HTTPS (auth callback)
                   │                          │
       ┌───────────▼──────────┐      ┌────────▼─────────┐
       │  Vercel Edge / Node  │      │  Supabase Auth   │
       │  (Next.js runtime)   │      │  (Google OAuth)  │
       └───────────┬──────────┘      └────────┬─────────┘
                   │                          │
                   │ supabase-js (SSR)        │
                   │                          │
       ┌───────────▼──────────────────────────▼─────────┐
       │              Supabase Postgres                  │
       │   - profiles, events, event_participants        │
       │   - Row Level Security policies                 │
       │   - auth.users (managed by Supabase)            │
       └─────────────────────────────────────────────────┘
```

### Request lifecycle (typical event page load)

1. Browser requests `/events/devcon-2026`.
2. Next.js Server Component runs on Vercel.
3. `lib/supabase/server.ts` reads the user's session cookie (set by `@supabase/ssr`) and creates a request-scoped Supabase client.
4. Server Component queries `events` + `event_participants` joined with `profiles`.
5. Postgres applies RLS — anonymous users see the event but not full participant detail; authenticated users see participants but contact handles are returned only when explicitly requested.
6. HTML is streamed to the browser. Interactive bits (`ContactReveal`, filters) hydrate as Client Components.

### Boundaries

- **Auth state** lives in Supabase, propagated via cookies through `@supabase/ssr` so both server and client components see the same session.
- **Business logic** lives in Server Components and Route Handlers (`app/api/.../route.ts`). The browser never holds the service role key.
- **Validation** is duplicated: Zod schemas on the client for fast UX, re-checked on the server before any write. Database constraints are the final backstop.

---

## 3. Tech stack and rationale

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router)** | Server Components → less JS shipped; built-in routing; first-class Vercel deploy. The session-refresh helper lives in `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`). |
| Language | **TypeScript (strict)** | Catches schema mismatches at compile time; works hand-in-hand with generated Supabase types. |
| Styling | **Tailwind v4** | Utility-first; CSS-first config (no `tailwind.config.ts` — design tokens live in `app/globals.css` under `@theme`). |
| UI primitives | **shadcn/ui (`base-nova` preset)** | Built on `@base-ui/react`. Components are copy-in and live in `components/ui/`. |
| Database | **Supabase Postgres** | Real Postgres — no lock-in. RLS gives us authorization at the row level for free. |
| Auth | **Supabase Auth + Google OAuth** | One provider, lowest-friction sign-in. No password reset flow to build. |
| Forms | **react-hook-form + zod** | Uncontrolled forms (fast), schema-first validation reusable on the server. |
| Hosting | **Vercel** | Zero-config Next.js deployment; previews per PR. |
| Icons | **lucide-react** | Pairs with shadcn/ui by default. |
| Toasts | **sonner** | Lightweight, accessible toaster. Mounted once in the root layout. |

### Why not …

- **Why not NextAuth?** Supabase Auth already issues sessions and we need Supabase anyway. One auth system is simpler than two.
- **Why not Prisma?** Supabase has a typed query builder (`supabase-js`) and generated types. Adding Prisma would mean two sources of truth for the schema.
- **Why not tRPC?** Server Components already give us typed server↔client data flow. tRPC shines for client-heavy SPAs; we are server-rendered.

---

## 4. Data model

### Tables

#### `profiles`

One-to-one with `auth.users`. Created on first sign-in (via trigger or app-level upsert in onboarding).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | references `auth.users(id)` on delete cascade |
| `full_name` | `text` not null | Pre-filled from Google identity. |
| `avatar_url` | `text` | From Google. |
| `bio` | `text` | Optional, ≤ 280 chars. |
| `city` | `text` not null | Home city. |
| `telegram_handle` | `text` | Optional. |
| `twitter_handle` | `text` | Optional. |
| `whatsapp_number` | `text` | Optional. E.164 format. |
| `instagram_handle` | `text` | Optional. |
| `github_username` | `text` | Optional, social proof for tech events. |
| `created_at` | `timestamptz` default `now()` | |
| `updated_at` | `timestamptz` default `now()` | Updated by trigger. |

**App-level constraint:** at least one of `telegram_handle`, `twitter_handle`, `whatsapp_number`, `instagram_handle` must be set before profile is considered complete. Enforced in onboarding (Zod) and in any participation write path. Not a DB constraint because we want to allow draft/partial saves later.

#### `events`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK default `gen_random_uuid()` | |
| `slug` | `text` unique not null | URL-safe identifier. |
| `name` | `text` not null | |
| `description` | `text` | Markdown allowed. |
| `category` | `event_category` enum not null | `'tech' \| 'running' \| 'music' \| 'sports' \| 'conference' \| 'college' \| 'other'` |
| `city` | `text` not null | |
| `venue` | `text` | |
| `start_date` | `date` not null | |
| `end_date` | `date` not null | |
| `cover_image_url` | `text` | |
| `website_url` | `text` | |
| `created_by` | `uuid` | references `profiles(id)`; null for seeded events. |
| `is_featured` | `boolean` default `false` | Highlighted on homepage. |
| `created_at` | `timestamptz` default `now()` | |

Index on `(start_date)` and `(category, start_date)` for the events list.

#### `event_participants`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK default `gen_random_uuid()` | |
| `event_id` | `uuid` not null | references `events(id)` on delete cascade |
| `user_id` | `uuid` not null | references `profiles(id)` on delete cascade |
| `origin_city` | `text` not null | Where they're traveling from. |
| `arrival_datetime` | `timestamptz` not null | |
| `departure_datetime` | `timestamptz` not null | |
| `looking_for` | `text[]` not null | Subset of `{'travel_buddy', 'cab_split', 'accommodation', 'just_meeting_people'}`. |
| `notes` | `text` | ≤ 500 chars (DB check constraint). |
| `created_at` | `timestamptz` default `now()` | |
| `updated_at` | `timestamptz` default `now()` | |

`UNIQUE (event_id, user_id)` — a user joins each event at most once. Re-joining is an update.

### Row Level Security (RLS)

All tables have RLS enabled.

| Table | Read | Write |
|---|---|---|
| `profiles` | Authenticated users can read all profiles (needed to render participant cards). | Owner only (`auth.uid() = id`). |
| `events` | Public — `anon` and `authenticated` (homepage browsing). | `service_role` only in Phase 1 (admin-managed). |
| `event_participants` | Authenticated users only. | Owner only (`auth.uid() = user_id`); on delete same. |

**Why profiles are readable by all authenticated users:** rendering a participant card requires the participant's name, avatar, city, and which contact handles exist. Hiding profiles would force a join-with-contact-redaction RPC for every list. Readable-but-handles-revealed-on-click is simpler and equally safe (handles are revealed only via the `ContactReveal` component which requires authentication).

### Generated types

Run `supabase gen types typescript --project-id <id> > types/database.ts` after each migration. Import as `Database` everywhere — no `any`.

---

## 5. Authentication & authorization

### Sign-in flow (Google OAuth)

```
User clicks "Continue with Google"
        │
        ▼
supabase.auth.signInWithOAuth({ provider: 'google' })
        │
        ▼
Redirect to Google consent screen
        │
        ▼
Google redirects back to https://<project>.supabase.co/auth/v1/callback
        │
        ▼
Supabase exchanges code for session, sets cookie, redirects to
http://localhost:3000/auth/callback?code=...   (in dev)
        │
        ▼
Our /auth/callback Route Handler exchanges code → session via @supabase/ssr,
then checks if profile exists / is complete:
   - missing → redirect to /onboarding
   - complete → redirect to /events
```

### Profile completeness check

A profile is "complete" when:
- `city` is set, and
- at least one of `telegram_handle`, `twitter_handle`, `whatsapp_number`, `instagram_handle` is set.

This check runs:
- in the auth callback (decides where to redirect post-login);
- in middleware on protected routes (sends incomplete users to `/onboarding`);
- on the server before any `event_participants` write.

### Session handling

`@supabase/ssr` is the single integration point.

- `lib/supabase/client.ts` — `createBrowserClient(url, anonKey)` for Client Components.
- `lib/supabase/server.ts` — `createServerClient(url, anonKey, { cookies })` for Server Components and Route Handlers.
- `middleware.ts` — refreshes the session cookie on every request and gates protected routes.

Never hold the **service role key** anywhere except server-side admin scripts (e.g. seed loader). It bypasses RLS.

### Authorization summary

- Anyone (including `anon`) can read events.
- Authenticated users can read profiles and event_participants.
- Only the owner can write their own profile or participation.
- Event creation is admin-only in Phase 1 — done by inserting via the service role from a script or the Supabase dashboard.

---

## 6. Routes and pages

### Public

| Path | Type | Description |
|---|---|---|
| `/` | Server | Landing — hero, "how it works" 3 steps, featured events grid, footer. |
| `/login` | Server | Single Google login button. Redirects authed users to `/events`. |
| `/auth/callback` | Route Handler | Exchanges OAuth code for session, decides onboarding vs. events redirect. |

### Authenticated

| Path | Type | Description |
|---|---|---|
| `/events` | Server | All upcoming events. Client filter bar (category, city). Sort by date asc. |
| `/events/[slug]` | Server | Event detail + participant list. "Join" CTA if not yet joined. |
| `/events/[slug]/join` | Server (form) | Participation form: origin city, arrival/departure datetime, looking_for tags, notes. Edits existing row if already joined. |
| `/onboarding` | Server (form) | First-time profile setup. |
| `/profile` | Server (form) | Edit own profile. |

### Proxy (session refresh + auth gate)

`proxy.ts` (the Next 16 successor to `middleware.ts`) runs on every non-static request:
- Refreshes the Supabase session cookie via `lib/supabase/middleware.ts → updateSession`.
- Public paths (`/`, `/login`, `/auth/*`) pass through.
- No session on a protected path → redirect to `/login?next=<original>`.
- Session but incomplete profile (no city, or no contact handle) → redirect to `/onboarding`. The `/onboarding` page itself is exempt to avoid a redirect loop.

### Loading and error UX

Every async page has:
- a `loading.tsx` skeleton sibling, and
- an `error.tsx` boundary with a friendly retry button.

---

## 7. Component inventory

All components are typed. Server-rendered by default; `'use client'` only when interactivity is required.

| Component | Client/Server | Purpose |
|---|---|---|
| `Navbar` | Server (with client `NavUserMenu`) | Logo + "Events" + profile dropdown (when signed in) or "Sign in" CTA (when not). Mounted once in the root layout. |
| `NavUserMenu` | Client | Avatar trigger + dropdown with "Edit profile" and "Sign out". Calls `supabase.auth.signOut()` on sign-out. |
| `Logo` | Server | Coral dot + "tagalong" wordmark. Links to `/`. |
| `Footer` | Server | Logo + tagline + small set of nav links. Mounted in root layout. |
| `EventCard` | Server | Cover image, name, dates, city, category badge. Used on `/` (featured) and `/events`. |
| `EventFilters` | Client | Category chip filter. Reads/writes `?category=` searchParam; the Server Component re-fetches. |
| `CategoryBadge` | Server | Color-coded pill driven by `lib/events/categories.ts`. |
| `ParticipantCard` | Server (with client `ContactReveal`) | Avatar, name, origin → destination, looking_for tags, notes, contact buttons. |
| `ContactReveal` | Client | Per-handle button. First click reveals the handle and shows a copy-to-clipboard control + opens an external chat link. |
| `GoogleLoginButton` | Client | Calls `supabase.auth.signInWithOAuth({ provider: 'google' })`. Inline official Google G logomark per brand guidelines. |
| `LookingForChips` | Client | Multi-select chips for `looking_for` values used in the join form. |
| `ProfileForm` | Client | Shared form used by both `/onboarding` and `/profile`. Different `successHref` and submit label per usage. |
| `JoinForm` | Client | Participation form. Upserts on submit; offers a "Leave this event" button when editing an existing row. |

### shadcn/ui primitives installed

`button`, `input`, `label`, `textarea`, `select`, `dropdown-menu`, `dialog`, `avatar`, `badge`, `skeleton`, `sonner` (toast), `form`. Built on `@base-ui/react` (the `base-nova` preset, not Radix). One quirk: the `Button` does **not** support `asChild` — for a Link styled as a button, apply `buttonVariants()` to the `<Link>` directly.

---

## 8. Folder structure

```
tagalong/
├── app/
│   ├── page.tsx                      # /                   (landing)
│   ├── layout.tsx                    # Root layout — Navbar + Footer + Toaster
│   ├── globals.css                   # Tailwind v4 @theme tokens (Tagalong palette)
│   ├── login/
│   │   └── page.tsx                  # /login
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts              # /auth/callback        (OAuth code exchange)
│   ├── onboarding/
│   │   └── page.tsx                  # /onboarding
│   ├── profile/
│   │   └── page.tsx                  # /profile              (edit profile)
│   └── events/
│       ├── page.tsx                  # /events
│       ├── loading.tsx
│       ├── error.tsx
│       └── [slug]/
│           ├── page.tsx              # /events/:slug
│           ├── loading.tsx
│           ├── error.tsx
│           └── join/
│               ├── page.tsx          # /events/:slug/join    (server shell)
│               └── join-form.tsx     #                       (client form)
│
├── components/
│   ├── ui/                           # shadcn primitives
│   ├── navbar.tsx
│   ├── nav-user-menu.tsx
│   ├── logo.tsx
│   ├── footer.tsx
│   ├── event-card.tsx
│   ├── event-filters.tsx
│   ├── category-badge.tsx
│   ├── participant-card.tsx
│   ├── contact-reveal.tsx
│   ├── google-login-button.tsx
│   ├── looking-for-chips.tsx
│   └── profile-form.tsx              # shared by /onboarding and /profile
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client (cookies)
│   │   └── middleware.ts             # updateSession() — used by proxy.ts
│   ├── auth/
│   │   └── profile.ts                # isProfileComplete()
│   ├── events/
│   │   ├── categories.ts             # Category metadata + type guard
│   │   └── format.ts                 # formatEventDateRange()
│   ├── validations/
│   │   ├── profile.ts                # Zod schema for profile / onboarding
│   │   └── participation.ts          # Zod schema for join form
│   └── utils.ts                      # cn()
│
├── types/
│   └── database.ts                   # Generated by `npm run gen:types`
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial.sql
│   └── config.toml                   # supabase CLI config
│
├── scripts/
│   └── seed.mjs                      # Seeds events via service_role
│
├── proxy.ts                          # Next 16 — session refresh + auth gate
├── next.config.ts
├── postcss.config.mjs                # Tailwind v4 PostCSS plugin
├── components.json                   # shadcn config
├── tsconfig.json
├── package.json
├── .env.local.example
└── README.md
```

> Tailwind v4 doesn't use a `tailwind.config.ts`. Design tokens are declared inside `app/globals.css` under `@theme inline { ... }`, which Tailwind reads at build time.

---

## 9. Design system

### Vibe

Friendly, not corporate. "Tag along, it'll be fun" — not "Enterprise Event Coordination Platform™". Lots of whitespace, rounded corners, subtle shadows.

### Color palette

```
Background:   #FFFBF5   (warm off-white)
Surface:      #FFFFFF
Text primary: #1F1B16   (near-black, warm-leaning)
Text muted:   #6B6258
Accent:       #FF6B3D   (coral-orange — primary CTAs, links)
Accent dark:  #E55525   (hover state)
Border:       #EDE6DB
Success:      #2F9E6E
Warning:      #D89B1F
Danger:       #C8453B
```

Tokens live in `app/globals.css` as CSS variables under `:root`, exposed as Tailwind utilities via `@theme inline`. Use them directly: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-accent`, `bg-cat-tech`, etc.

### Category colors (badges)

| Category | Hex | Use |
|---|---|---|
| `tech` | `#5B8DEF` | hackathons, devcons |
| `running` | `#2F9E6E` | marathons, trail runs |
| `music` | `#B96BD5` | festivals, concerts |
| `sports` | `#E5894A` | tournaments |
| `conference` | `#7E7C8F` | summits |
| `college` | `#D5A03B` | fests |
| `other` | `#8A8275` | fallback |

### Typography

- Headings: **Inter** 600/700, tight tracking on H1.
- Body: **Inter** 400/500.
- Code/handles (where shown): **JetBrains Mono** 500.

### Shape

- `rounded-2xl` for cards, `rounded-xl` for inputs, `rounded-full` for avatars and chips.
- Shadow: `shadow-sm` on cards default; `shadow-md` on hover for clickable cards.

### Mobile-first

Every screen designed at 375px first. Breakpoints: `sm:640`, `md:768`, `lg:1024`. Two-column event grid kicks in at `md`, three at `lg`.

---

## 10. Security & privacy

### Threat model (Phase 1)

| Threat | Mitigation |
|---|---|
| Random users browsing & scraping contact handles | Handles only readable when authenticated **and** revealed via `ContactReveal` (per-click). No bulk profile listing endpoint. |
| Logged-in user editing someone else's profile or participation | RLS: writes restricted to `auth.uid() = id`/`user_id`. Re-checked server-side. |
| Spammy participation (one user joining 100 events with junk text) | Notes capped at 500 chars; `unique(event_id, user_id)` prevents dupes. Future: rate-limit per user per hour. |
| Fake events created to phish | Phase 1 events are admin-only. RLS denies non-service-role inserts. |
| OAuth open-redirect | `/auth/callback` only redirects to a fixed allow-list of internal paths. `next` param is sanitized. |
| Service role key leak | Lives only in `.env.local` and Vercel server env. Never imported in any file under `app/` that has `'use client'`. Lint rule will enforce. |

### Privacy posture

- No tracking pixels in Phase 1.
- Avatars are hot-linked from Google (no storage cost; cleared if Google revokes).
- Account deletion = `auth.users` row delete, which cascades to `profiles` and `event_participants`. Endpoint to be added in Phase 2.

---

## 11. Phase 1 scope vs. future phases

### Phase 1 — what we ship now

Everything in this README: auth, profiles, event browsing, joining, participant lists, admin-managed events, seeded data, mobile-responsive UI.

### Explicitly **not** in Phase 1

- In-app messaging or chat (use Telegram/WhatsApp instead — that's the point).
- Payment splitting / cost calculators.
- Email or push notifications.
- User-created events (admin-only for now).
- Women-only filter (deferred until safety design is right).
- Rating / review system.
- Multiple OAuth providers (Google only).
- Search beyond category + city filter.

### Phase 2

A full plan with architecture changes, migration SQL, ops maturity, and release cadence lives in [docs/PHASE_2.md](docs/PHASE_2.md). The short version below.

### Phase 2 candidates (rough order)

1. **Organizer flow** — verified organizers can create their own events; lightweight approval queue.
2. **Notifications** — email digest "3 new people just joined Devcon 2026 from your city".
3. **Smart matching hints** — "5 people arriving within 1h of you".
4. **Women-only mode** — opt-in segregated participant view, after we've designed it with input.
5. **Account deletion + data export** — GDPR posture even though we're not bound yet.
6. **Multiple auth providers** — Apple, GitHub.

---

## 12. Local setup

### Prerequisites

- Node.js ≥ 20.6 (we use the built-in `--env-file` flag)
- npm (the Supabase CLI is installed as a dev dependency, not globally)
- A Supabase project at https://supabase.com (free tier is fine)

### One-time

```bash
# 1. Clone & install
git clone <repo>
cd tagalong
npm install

# 2. Copy env template and fill in values from your Supabase project
cp .env.local.example .env
#  → Settings → API gives you NEXT_PUBLIC_SUPABASE_URL + anon + service_role
#  → Account → Tokens gives you SUPABASE_ACCESS_TOKEN (needed for type gen)

# 3. Apply the initial migration
#  → Open the Supabase Dashboard SQL Editor
#  → Paste supabase/migrations/001_initial.sql, Run

# 4. Generate TypeScript types from the live schema
npm run gen:types

# 5. Seed events (uses service_role to bypass RLS — admin only)
npm run seed

# 6. Set up Google OAuth — see §13 below

# 7. Run dev server
npm run dev
```

App runs on `http://localhost:3000`.

### `.env.local.example`

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only, never expose
SUPABASE_ACCESS_TOKEN=              # account-level PAT for `gen:types` + CLI
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production these are set in the Vercel project settings (and `NEXT_PUBLIC_SITE_URL` becomes the deployed URL). `SUPABASE_ACCESS_TOKEN` is only needed locally.

### npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server. |
| `npm run build` | Production build + type-check. |
| `npm run start` | Run the production build. |
| `npm run lint` | Run ESLint. |
| `npm run seed` | Insert seed events using `SUPABASE_SERVICE_ROLE_KEY` (idempotent). |
| `npm run gen:types` | Regenerate `types/database.ts` from the live hosted schema. |

---

## 13. Google OAuth setup

You'll do this once per Supabase project (dev + prod). Both can share the same Google OAuth credentials by adding multiple redirect URIs.

1. **Google Cloud Console** → create project "Tagalong".
2. APIs & Services → Library → enable **Google Identity** (and **Google+ API** if prompted; some setups require it for profile scope).
3. APIs & Services → Credentials → Create credentials → **OAuth client ID** → Application type **Web application**.
4. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://<your-vercel-domain>`
5. Authorized redirect URIs:
   - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback` (production Supabase project)
   - `http://localhost:54321/auth/v1/callback` (local Supabase if using `supabase start`)
6. Save → copy **Client ID** and **Client Secret**.
7. **Supabase Dashboard** → Authentication → Providers → Google → paste both, toggle Enabled.
8. Supabase Dashboard → Authentication → URL Configuration → set:
   - **Site URL** = `http://localhost:3000` for dev, `https://<vercel-domain>` for prod.
   - **Redirect URLs** include `http://localhost:3000/**` and `https://<vercel-domain>/**`.

For local dev against a hosted Supabase project, point `NEXT_PUBLIC_SUPABASE_URL` at the hosted URL — easier than running OAuth against the local stack (which needs extra config).

---

## 14. Deployment

### Vercel

1. Push repo to GitHub.
2. Import into Vercel — framework auto-detected as Next.js.
3. Set env vars (same keys as `.env.local`, with prod values).
4. Deploy. Each PR gets a preview URL automatically.

### Supabase

1. Create a Supabase project for production (separate from dev).
2. Push migrations: `supabase db push` against the prod project ref.
3. Configure Google OAuth in the prod project (redirect URI uses the prod Supabase URL).
4. Update Vercel env vars with prod Supabase URL + anon key + service role key.

### Post-deploy checks

- [ ] Homepage loads without auth.
- [ ] Google sign-in works on the deployed URL.
- [ ] First-time login lands on `/onboarding`.
- [ ] Joining an event creates a row visible to other users.
- [ ] RLS denies cross-user writes (manual test from Supabase Studio with a different JWT).

---

## 15. Build execution order

The original Phase 1 plan was seven steps. All seven landed.

| # | Step | Status | Verification |
|---|---|---|---|
| 1 | Scaffold Next.js + dependencies | ✅ done | `npm run dev` serves a page on `http://localhost:3000` |
| 2 | Supabase clients + migration SQL + RLS policies | ✅ done | 3 tables live in Studio with RLS enabled; types generated |
| 3 | Google OAuth + onboarding | ✅ done | Sign-in → `/onboarding` → submit → `/events` |
| 4 | Events list + event detail | ✅ done | 8 seeded events render; filter works; detail page loads |
| 5 | Join-event flow | ✅ done | Join form upserts; participant card renders on detail page; "Leave" works |
| 6 | Landing page polish + Navbar | ✅ done | Hero + how-it-works + featured events; profile dropdown; sign-out |
| 7 | Seed data + README polish + deployment checklist | ✅ done | `npm run seed` is idempotent; this README documents the actual code |

---

## License

MIT — see [LICENSE](./LICENSE).
