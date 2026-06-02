# CLAUDE.md — Debt Freedom

This file orients Claude Code to the project. Read it before making changes.

## What this is

**Debt Freedom** — an iOS app that shows users exactly when they'll be debt free and how much interest they'll save. Built with React Native / Expo, fully offline in v1.0.

## Architecture

```
frontend/           React Native / Expo (JavaScript)
  App.js            Root: onboarding gate → 4-tab app
  app.json          Bundle ID: com.benoats.debtfreedom · name: Debt Freedom
  eas.json          EAS Build profiles (development / preview / production)
  assets/           icon.png · adaptive-icon.png · splash.png
  src/
    engine/
      projection.js Pure JS projection engine (multi-debt, avalanche/snowball,
                    overpayments, goals). No network calls. Runs on-device.
    screens/
      OnboardingScreen.js  5-step activation wizard (Welcome→Debts→Budget→
                           Projection→Save). First launch only.
      PlanScreen.js        Debt Freedom Countdown hero + roadmap + debts/goals
      TrackerScreen.js     Month-by-month tick-offs + overpayments
      AwardsScreen.js      5-level progression + milestone badges
      SettingsScreen.js    Debts/goals editor + strategy switch + reset
    components/
      ui.js           Design-system primitives (Kicker, StatCard, GrowBar,
                      Segmented, TabBar, MilestoneTimeline, …)
      Celebration.js  Animated milestone modal
    theme/
      theme.js        Colors, type scale, spacing, radius, helpers (gbp,
                      monthLabel, yearsMonths, daysUntil, laneFor)

docs/
  backend-readiness-audit.md   Full audit of v1.0 vs v1.1 cloud requirements
  launch-runbook.md            Step-by-step: EAS Build → TestFlight → App Store
  app-store-metadata.md        All App Store Connect copy, ready to paste
  public-pages/                GitHub Pages site (Privacy · Support · Terms)

scripts/
  generate_assets.py   Generates icon + splash PNGs from brand tokens (Pillow)
```

## Data flow (v1.0)

Everything is on-device. Zero network calls. Zero backend.

```
OnboardingScreen  →  plan object  →  App.js (useState + AsyncStorage)
                                         ↓
                                  projection.js (buildProjection)
                                         ↓
                             PlanScreen / TrackerScreen / AwardsScreen
```

**AsyncStorage keys:**
- `dcs3.plan` — the user's full plan (debts, goals, budget, strategy, overpayments)
- `dcs3.done` — Set of ticked month indices
- `dcs3.tab` — last active tab
- `dcs3.onboarded` — `'1'` once onboarding is complete

## The projection engine

`frontend/src/engine/projection.js` — pure JS, no framework imports. Takes a plan object and a `Set` of done months; returns full month-by-month rows, debt-free month, interest totals, milestone events.

Default plan shape:
- `debts[]` — id, name, type, balance, original, apr, minPayment
- `goals[]` — id, name, target
- `monthlyBudget` — number
- `allowanceYou` / `allowancePartner` — personal spend kept aside
- `saveWhileInDebt` — protected savings amount while debt remains
- `strategy` — `'avalanche'` | `'snowball'`
- `overpayments` — `{ [monthIndex]: amount }`

## App identity

| Field | Value |
|---|---|
| App name | Debt Freedom |
| Bundle ID | `com.benoats.debtfreedom` |
| Version | 1.0.0 |
| Build number | 1 |
| Orientation | Portrait only |
| Tablet | No |

## How to run locally

```bash
cd frontend
npm install
npx expo start --lan   # scan QR in Expo Go on your iPhone (same Wi-Fi)
```

## How to build for TestFlight

```bash
cd frontend
npm install -g eas-cli
eas login
eas build --platform ios --profile preview
```

See `docs/launch-runbook.md` for the full step-by-step.

## Public pages (GitHub Pages)

Live at `https://thelaughinggod1986.github.io/Debt-Clear-Save/public-pages/`

- Privacy: `.../privacy.html`
- Support: `.../support.html`
- Terms:   `.../terms.html`

Source: `docs/public-pages/`. Served from the `main` branch `/docs` folder.

## v1.1 backlog (post-App Store launch)

1. **Supabase cloud sync** — anonymous session on first launch → link Apple/Google/Email identity in onboarding step 5. Full schema + RLS + service layer design in `docs/backend-readiness-audit.md`.
2. **Sign in with Apple / Google / Email** — buttons exist in onboarding step 5 but are currently disabled (no backend yet).
3. **SVG projection chart** — multi-line balance/savings/net-worth chart using `react-native-svg`.
4. **Payment reminders** — push notifications via Expo Notifications.
5. **Shared / partner mode** — joint plans with two avatars.

## Conventions

- No TypeScript in v1.0 (planned for v1.1 alongside Supabase).
- No hardcoded colours — use `colors.*` from `theme.js`.
- No direct AsyncStorage access outside `App.js`.
- Projection is always recomputed from source data — never persist derived values.
- Financial disclaimer is shown in onboarding step 5 and Settings → About.

## Guardrails

- This is a personal-finance planning tool, not regulated advice. Don't add features that present outputs as financial advice.
- The app must not contain any backend admin secrets.
- The Supabase service role key must never enter the mobile bundle in v1.1 (use Edge Functions for privileged operations).
