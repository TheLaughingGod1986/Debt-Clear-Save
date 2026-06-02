# Debt Freedom — iOS App

Plan your way out of debt. See exactly when you'll be debt free and how much interest you'll save.

Built with **React Native / Expo**. v1.0 is fully offline — all data stays on the user's device.

---

## Quick start

```bash
cd frontend
npm install
npx expo start --lan   # scan QR in Expo Go on your iPhone (same Wi-Fi)
```

## Build for TestFlight

```bash
cd frontend
npm install -g eas-cli
eas login
eas build --platform ios --profile preview
```

Full instructions in [`docs/launch-runbook.md`](docs/launch-runbook.md).

---

## How it works

The app runs a pure JS projection engine on-device. You enter your debts and budget during a 5-step onboarding wizard; the engine calculates your debt-free date and interest saved instantly. Nothing leaves the phone.

```
OnboardingScreen  →  plan  →  projection engine  →  Plan / Tracker / Awards
                                  (on device)
```

**Payoff strategies:** Avalanche (highest APR first) or Snowball (smallest balance first).  
**Persistence:** AsyncStorage — plan, ticked months, and progress are saved locally.

---

## Repo layout

```
frontend/               React Native / Expo app
  App.js                Root: onboarding → 4-tab app
  app.json              Bundle ID, version, assets
  eas.json              EAS Build profiles
  assets/               icon.png · splash.png
  src/
    engine/             projection.js — pure JS payoff engine
    screens/            Onboarding · Plan · Tracker · Awards · Settings
    components/         ui.js · Celebration.js
    theme/              theme.js (colors, type scale, helpers)

docs/
  launch-runbook.md           Step-by-step to App Store submission
  app-store-metadata.md       App Store Connect copy, ready to paste
  backend-readiness-audit.md  v1.1 cloud architecture decision doc
  public-pages/               GitHub Pages: Privacy · Support · Terms

scripts/
  generate_assets.py    Regenerate icon + splash from brand tokens
```

---

## Public pages

Live on GitHub Pages — used as App Store privacy policy and support URLs:

- **Privacy:** https://thelaughinggod1986.github.io/Debt-Clear-Save/public-pages/privacy.html
- **Support:** https://thelaughinggod1986.github.io/Debt-Clear-Save/public-pages/support.html
- **Terms:** https://thelaughinggod1986.github.io/Debt-Clear-Save/public-pages/terms.html

---

## App identity

| | |
|---|---|
| Name | Debt Freedom |
| Bundle ID | `com.benoats.debtfreedom` |
| Version | 1.0.0 |
| Platform | iOS only |

---

## v1.1 roadmap

- Optional cloud sync via Supabase (design in `docs/backend-readiness-audit.md`)
- Sign in with Apple / Google / Email
- Payment reminders
- SVG balance projection chart
- Shared partner plans
