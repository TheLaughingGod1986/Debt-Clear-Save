# Backend Readiness Audit — Debt Freedom

**Date:** 2026-05-29
**Auditor:** Claude (acting as backend / launch engineer)
**Scope:** Determine whether the app is backend-ready for App Store submission with real user accounts and cloud persistence.

---

## TL;DR

| | |
|---|---|
| **Backend in use by the RN app** | **None.** 100% on-device (AsyncStorage). |
| **Cloud accounts** | **None.** Sign-in buttons are alert stubs. |
| **Existing FastAPI service** | Present but **unwired** to the new UI. Used only by the legacy CC+DMP engine (which is no longer reachable through the app). |
| **Hardcoded dev URLs / secrets** | **None found.** `.env` files absent. No Supabase keys, tokens, or HTTP calls anywhere. |
| **Production gaps for cloud v1** | All of: auth, schema, RLS, services layer, env management, account deletion, data export. |
| **Risk for current local-only plan (Plan A)** | **LOW** — app is internally consistent and shippable as a local app today. |
| **Risk for "real accounts + sync" plan** | **HIGH** — every piece below needs to be built. Estimate **3–4 weeks** end-to-end. |

The blocker is **not** scattered hacks to fix — there is essentially **no backend integration to refactor**. That's a feature, not a bug: it means we build cleanly from a known-good local baseline.

---

## 1. Data Storage Audit

### What is currently local-only

| Data | Where | Hydrated from | Persisted to |
|---|---|---|---|
| Active plan (debts, goals, budget, payday, strategy, overpayments) | `App.js` `plan` state | `AsyncStorage` key `dcs3.plan` | `AsyncStorage` |
| Ticked months (progress) | `App.js` `done` Set | `dcs3.done` | `AsyncStorage` |
| Last active tab | `App.js` `tab` | `dcs3.tab` | `AsyncStorage` |
| Onboarding completed flag | `App.js` `onboarded` | `dcs3.onboarded` | `AsyncStorage` |
| `DEFAULT_PLAN` (sample data) | `frontend/src/engine/projection.js` line 20 | — | shipped in bundle, used as `useState` initial value |

### Grep results

```
AsyncStorage.getItem    × 4   (App.js lines 89–92)
AsyncStorage.setItem    × 4   (App.js lines 107–116)
localStorage            × 0
fetch(/axios/supabase   × 0   (zero network calls in the app)
DEFAULT_PLAN reference  × 4   (engine source + import sites)
"saved locally" copy    × 1   (OnboardingScreen step 5 stub alert)
TODO / FIXME            × 0   (genuine technical-debt markers absent)
```

### What must move to backend

For a cloud-account app, **everything user-owned** must live server-side:
- `plan` (one row per user → `debt_plans` + child rows in `debts`, `goals`)
- `done` (ticked months → could collapse into per-debt `payments` table for accuracy)
- onboarding completion state (can be derived from "does the user have a plan?", no column needed)

### What can safely remain local

- `tab` (purely UI state; meaningless across devices)
- A read-through cache of the user's plan (for offline tolerance and instant launch). Server is the source of truth; cache is invalidated on writes.

### What will break after reinstalling the app today

**Everything.** Today, reinstall = total data loss. The user has to redo onboarding from scratch. This is expected for "Plan A local-only v1" but is a complete blocker for "cloud accounts v1".

---

## 2. Auth Audit

### Current state: all stubbed

`frontend/src/screens/OnboardingScreen.js` step 5 has three buttons (Apple / Google / Email) that all call this:

```js
const stub = (provider) =>
  Alert.alert(
    `${provider} sign-in`,
    'Cloud sync is coming in our next update. For now, your plan saves on this device.',
    [{ text: 'Continue locally', onPress: onFinish }]
  );
```

Every button is functionally a "Skip for now" with extra copy. No OAuth, no Supabase, no Apple authentication services, no Google Sign-In SDK installed.

### Flow support matrix

| Flow | Implemented | Notes |
|---|---|---|
| Continue with Apple | ❌ stub | `expo-apple-authentication` not installed |
| Continue with Google | ❌ stub | `expo-auth-session` / `@react-native-google-signin` not installed |
| Continue with Email | ❌ stub | No password/magic-link flow |
| Skip / guest mode | ✅ works | This is currently the **only** path through onboarding |
| Account creation | ❌ | No signup screen |
| Session persistence | ❌ | No session object exists |
| Logout | ❌ | No way to "log out" because no one logs in |
| Account deletion | ❌ | No account exists to delete (App Store **requires** this if any signup exists — App Store Guideline 5.1.1(v)) |

### Recommendation

**Supabase Auth** is the right call:
- One SDK covers Apple / Google / Email / Magic Link / Anonymous
- Built-in JWT, session persistence, refresh tokens
- Row Level Security policies replace bespoke auth middleware
- Free tier comfortably covers a v1 launch
- Account deletion is a single RPC call

Recommended flow:
1. **Guest mode is the default** (matches Plan A spec — never block value behind sign-up).
   - On first launch, Supabase creates an **anonymous session** (`auth.signInAnonymously()`). The "user" is a real `auth.users` row with no email; all data is properly scoped via RLS.
2. **Onboarding writes to Supabase from day one**, using the anonymous session. No local-only path. This eliminates the migration step entirely.
3. **"Save your plan" step 5** then becomes "upgrade your account" — converting the anonymous user to a permanent one by **linking** an Apple/Google/Email identity to the existing session. All rows stay attached, no migration code needed.
4. If a user nukes the app without ever linking → data lost (anonymous, no recovery vector). This is the right trade-off vs. forcing sign-up upfront.

---

## 3. Backend Schema Requirements

None of the tables in the brief exist yet. Designing them against Supabase / Postgres:

### `profiles`
```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```
(Supabase convention: `profiles.id` mirrors `auth.users.id`. No separate `auth_user_id` column needed.)

### `debt_plans`
```sql
create table debt_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Debt Freedom Plan',
  monthly_budget numeric(10,2) not null default 0,
  personal_allowance numeric(10,2) not null default 0,
  payday_day smallint check (payday_day between 1 and 31),
  currency text not null default 'GBP',
  strategy text not null default 'avalanche' check (strategy in ('avalanche','snowball')),
  -- cached projection summary; recomputed on write
  debt_free_date date,
  total_starting_debt numeric(12,2),
  total_remaining_debt numeric(12,2),
  total_interest_estimate numeric(12,2),
  total_interest_saved_estimate numeric(12,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on debt_plans(user_id) where is_active;
```

### `debts`
```sql
create table debts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references debt_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('credit_card','loan','overdraft','store_card','car_finance','other')),
  name text not null,
  balance numeric(12,2) not null default 0,
  starting_balance numeric(12,2) not null default 0,
  apr numeric(5,2) not null default 0,
  minimum_payment numeric(10,2) not null default 0,
  payment_due_day smallint check (payment_due_day between 1 and 31),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on debts(plan_id, sort_order) where is_active;
create index on debts(user_id);
```

### `payments`
```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references debts(id) on delete cascade,
  plan_id uuid not null references debt_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  payment_date date not null default current_date,
  payment_type text not null default 'scheduled' check (payment_type in ('scheduled','overpayment','minimum')),
  note text,
  created_at timestamptz not null default now()
);
create index on payments(debt_id, payment_date desc);
create index on payments(user_id, payment_date desc);
```
This replaces today's "ticked months" `Set` — far more accurate and supports real-world deviation from plan.

### `milestones`
```sql
create table milestones (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references debt_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  milestone_type text not null check (milestone_type in (
    'first_debt_cleared','debt_cleared','debt_free','net_positive',
    'goal_met','all_goals','level_up')),
  title text not null,
  description text,
  achieved_at timestamptz not null default now(),
  metadata jsonb
);
create index on milestones(user_id, achieved_at desc);
```

### `user_settings`
```sql
create table user_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'GBP',
  reminder_enabled boolean not null default false,
  payday_reminder_enabled boolean not null default false,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Bonus tables not in the brief but needed

- `goals` — the engine already supports named savings goals. Mirror the `debts` table structure.
- `app_events` (optional) — analytics trail for activation funnel metrics. Skip for v1 if Apple's privacy review is the concern.

---

## 4. API / Data Access Layer Audit

### Current structure

```
frontend/src/
  engine/projection.js     ← pure JS engine (keep)
  components/              ← UI
  screens/                 ← UI
  theme/                   ← tokens
```

No services layer. No lib. No types. No TypeScript. **Zero abstraction over data access** — `App.js` reads/writes AsyncStorage directly.

### Required structure (per brief)

```
frontend/src/
  lib/
    supabase.js          ← single client instance, anon key from EAS env
  services/
    authService.js
    debtPlanService.js
    debtService.js
    paymentService.js
    milestoneService.js
    settingsService.js
  hooks/
    useAuth.js
    useActivePlan.js
    useDebts.js
    usePayments.js
  types/database.js      ← generated via `supabase gen types` (optional w/o TS)
```

UI components must consume hooks; hooks consume services; services consume `lib/supabase`. No `import { supabase } from '../lib/supabase'` in any screen file.

### TypeScript decision point

The brief lists `.ts` paths (`authService.ts`). The project is currently JS-only.
**Recommendation:** add TypeScript at this point. Cost is one day. Benefit: catches the entire class of bug where a UI component passes a malformed object to the database. Without it, the lack of compile-time guarantees becomes the single biggest source of production errors when the data layer is real.
**If we don't migrate:** add `frontend/src/types/database.js` with JSDoc typedefs and use them everywhere. Less safe, but cheaper.

---

## 5. App Store Production Requirements

| Check | Status |
|---|---|
| Production Supabase URL | ❌ — no Supabase configured |
| Production anon key | ❌ — n/a until Supabase exists |
| Service role key in app | ✅ — none committed (none exists yet) |
| `localhost` URLs in shipped JS | ✅ — none (the `LAN_HOST` ref was deleted in the cleanup pass) |
| Development API URLs | ✅ — none |
| Committed secrets | ✅ — `.env` files absent from repo and gitignored |
| Environment separation (dev/preview/prod) | ❌ — only one shape exists (none) |
| EAS env var setup | ❌ — `eas.json` doesn't exist yet (Task #13) |
| Privacy policy URL | ❌ — none drafted |
| Account deletion support | ❌ — required by App Store if accounts exist |
| Data export readiness (GDPR) | ❌ — required for UK launch |

### EAS env layout (when implemented)

```jsonc
// eas.json
{
  "build": {
    "development": { "env": { "EXPO_PUBLIC_SUPABASE_URL": "<dev-url>", "EXPO_PUBLIC_SUPABASE_ANON_KEY": "<dev-anon>" } },
    "preview":     { "env": { "EXPO_PUBLIC_SUPABASE_URL": "<staging-url>", "EXPO_PUBLIC_SUPABASE_ANON_KEY": "<staging-anon>" } },
    "production":  { "env": { "EXPO_PUBLIC_SUPABASE_URL": "<prod-url>", "EXPO_PUBLIC_SUPABASE_ANON_KEY": "<prod-anon>" } }
  }
}
```
`EXPO_PUBLIC_*` env vars are inlined at build time and are **safe to ship** — Supabase anon keys are designed to be public; RLS provides the actual security.

The service-role key **never enters the mobile bundle**. If we need privileged operations (account deletion, admin reports), they go through Supabase Edge Functions where the service role key lives server-side.

---

## 6. Offline / Guest Mode Decision

Per the brief, two competing models:

**Option A — Guest local, migrate on sign-up (the brief's default)**
- Onboard locally → AsyncStorage
- On sign-up, batch-upsert local plan to Supabase
- Switch to "online" mode
- Pros: zero network on first launch; no auth round-trip cost
- Cons: needs a migration code path that has to be 100% reliable (it's the worst time to lose data)

**Option B — Anonymous session from launch 1 (recommended)**
- On first launch, `supabase.auth.signInAnonymously()` — silent, no UI
- Onboarding writes directly to Supabase via the anonymous session
- On step 5, user converts anonymous → permanent by **linking** an Apple/Google/Email identity
- Pros: **no migration code ever exists**. Anonymous users have proper RLS scoping. App Review sees a real backend from page 1.
- Cons: requires connectivity on first launch (Supabase has a `cacheConfig` option but it's not bulletproof). Anonymous users count against MAU on the free tier (currently generous).

**Recommendation: Option B**, with AsyncStorage as a read-through cache for fast app launch. If the first-launch connectivity case ever becomes a real issue, fall back to a degraded local-first flow without breaking the schema.

---

## 7. Required Backend Behaviour

| Behaviour | Today | Cloud v1 mechanism |
|---|---|---|
| Create user profile after signup | ❌ | Trigger on `auth.users` insert → `profiles` row |
| Create debt plan after onboarding | ❌ (writes to AsyncStorage) | `debtPlanService.create()` posts to `debt_plans` |
| Add/edit/delete debts | ✅ in UI, ❌ persistence | `debtService` |
| Save monthly budget / allowance / payday | ✅ in UI, ❌ persistence | columns on `debt_plans` |
| Record payments | ❌ (only "tick a month" exists) | `payments` table, `paymentService.create()` |
| Recalculate payoff projection | ✅ client-side (JS engine) | Stays client-side; results cached on `debt_plans` for fast home-screen render across devices |
| Track milestones | ❌ persistence | `milestoneService` writes a row when engine first surfaces a milestone for the user |
| Sync across restarts | ❌ | RLS-scoped query on app load |
| Restore after reinstall | ❌ | Same as above |
| Migrate guest plan | ❌ | Not needed under Option B (anonymous account already exists) |

---

## 8. Security / RLS

To be enabled on **every** user-owned table:

```sql
alter table profiles      enable row level security;
alter table debt_plans    enable row level security;
alter table debts         enable row level security;
alter table payments      enable row level security;
alter table milestones    enable row level security;
alter table user_settings enable row level security;
```

Standard policy set (template — repeat per table, swapping `t`):

```sql
-- t = the table name
create policy "t_select_own" on t for select using (auth.uid() = user_id);
create policy "t_insert_own" on t for insert with check (auth.uid() = user_id);
create policy "t_update_own" on t for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "t_delete_own" on t for delete using (auth.uid() = user_id);
```

`profiles` and `user_settings` use `id` instead of `user_id` — adjust accordingly.

### Verification step (post-migration)

Write a smoke test that signs in two anonymous users (A and B), inserts a plan for each, then tries to read each other's data — must return zero rows. This goes in `frontend/scripts/rls-smoke-test.js` and runs in CI before any production deploy.

---

## 9. Projection Logic

### Where calculations happen today

`frontend/src/engine/projection.js` — pure JS, runs on every state change via `useMemo`. Inputs: a plan + set of ticked months. Outputs: full row-by-row simulation, debt-free month, interest totals, milestone events.

### Decision

**Client-side projection stays in v1.** Reasons:
1. Deterministic — same inputs always produce the same outputs
2. Already exists and is tested
3. ~5–20ms even on a low-end iPhone for a 28-month plan
4. Means **no backend compute** to maintain, secure, or scale

### What must be persisted vs. recomputed

| Value | Persisted | Recomputed on load | Why |
|---|---|---|---|
| Debts (balance, APR, min) | ✅ | — | Source of truth |
| Payments (real) | ✅ | — | Source of truth |
| Goals | ✅ | — | Source of truth |
| Plan settings (budget, strategy, payday) | ✅ | — | Source of truth |
| Projection rows | ❌ | ✅ | Pure derivation; storing them creates staleness bugs |
| Debt-free date | Cached on `debt_plans.debt_free_date` | ✅ (truth) | Cached for cross-device home-screen speed; invalidated on any write |
| Interest saved estimate | Cached | ✅ | Same as above |

The cache columns get refreshed on every write to `debts` / `payments` (server-side trigger preferred; client-side update acceptable for v1).

---

## 10. Risk Level

| Path | Risk | Why |
|---|---|---|
| **Plan A — Local-only v1 launch (current)** | 🟢 **LOW** | App is internally consistent, all data flows through AsyncStorage, no broken stubs in the active flow. Sign-in buttons gracefully degrade to "Skip". Privacy nutrition label is the simplest possible: "Data Not Collected". |
| **Plan B — Cloud-accounts v1 launch** | 🔴 **HIGH** | Every section above must be built before submission. Three weeks minimum. Account deletion + privacy policy are mandatory; failing either = rejection. |

The honest read: **stay on Plan A for the initial App Store submission**. Ship the app the user already has. Build cloud as v1.1 once we have actual users telling us they need multi-device sync.

---

## 11. Recommended Implementation Order (when cloud lands)

This is the v1.1 plan — to be executed **after** the local-only v1 ships.

1. **Supabase project setup** — create org, two projects (`debt-freedom-prod`, `debt-freedom-dev`), enable Apple + Google OAuth providers
2. **Schema migrations** — SQL files in `backend/supabase/migrations/`, applied via Supabase CLI
3. **RLS policies + smoke test** — every table locked down before any client integration
4. **TypeScript migration** — 1 day investment, pays for itself the first week
5. **`lib/supabase.js`** — single client, env-driven URL + anon key
6. **`services/authService`** — anonymous sign-in on launch, identity linking on step 5, logout, delete
7. **Profile auto-creation** — Postgres trigger on `auth.users` insert
8. **`services/debtPlanService`, `debtService`, `paymentService`** — CRUD with optimistic local cache
9. **Replace `App.js` AsyncStorage hydration with `useActivePlan()` hook** — feature-flag the swap so we can A/B for a day
10. **Replace `OnboardingScreen` step 5 stubs with real identity linking**
11. **Account deletion screen in Settings** (App Store requirement)
12. **Privacy policy + Settings link** (App Store requirement)
13. **Data export (GDPR)** — Settings → "Email me my data" → Edge Function → email with JSON attachment
14. **Loading + error states** — every service call needs both
15. **Integration smoke test** — Detox or Maestro: anonymous user → onboard → reload → see data
16. **Submit v1.1**

Estimated: **3 weeks of focused engineering**.

---

## Decision Required

Before any of section 11 begins, confirm:

1. **Cloud now, or cloud as v1.1?** (Recommended: v1.1.)
2. If now: **add TypeScript at the same time?** (Recommended: yes.)
3. **Supabase or self-host?** (Recommended: Supabase — free tier is fine for v1.1; self-hosting Postgres + Auth + Edge Functions costs ~10× the eng time for the same outcome.)
4. **Anonymous-from-launch (Option B) or migrate-on-signup (Option A)?** (Recommended: B.)

Once those are answered, I can produce a precise per-task implementation plan with migration SQL ready to apply.
