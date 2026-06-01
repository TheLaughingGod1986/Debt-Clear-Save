# Debt Freedom — Launch Runbook

Step-by-step from here to "Submitted for App Review". Commands are listed in the
order you need to run them. Anything that requires your Apple credentials is
marked **(you)** — I can't do those from this side.

---

## Prerequisites

- ✅ Apple Developer Program enrolled (`benoats@…`)
- ✅ Bundle ID: `com.benoats.debtfreedom`
- ✅ App name: `Debt Freedom`
- ✅ Icon + splash assets generated in `frontend/assets/`
- ✅ `eas.json` configured (`frontend/eas.json`)
- ✅ `app.json` configured with bundle ID, build number, no-encryption flag

---

## 1 · One-off CLI setup

```bash
# Install EAS CLI globally
npm install -g eas-cli@latest

# Sign in to Expo (creates a free account at expo.dev if you don't have one)
eas login

# (you) Link this project to an Expo account/owner
cd frontend && eas init
```

`eas init` will:
- create an `expo.owner` field in `app.json` if missing
- assign a unique project ID
- ask whether to create a new Expo project or link an existing one — choose **new**

After `eas init`, commit the updated `app.json`.

---

## 2 · Create the App Store Connect listing **(you)**

You need an App ID **before** the first `eas submit`. Do this in App Store Connect:

1. Go to <https://appstoreconnect.apple.com/apps>
2. **+** → **New App**
3. Fill:
   - **Platform:** iOS
   - **Name:** Debt Freedom
   - **Primary language:** English (UK)
   - **Bundle ID:** `com.benoats.debtfreedom` (select from dropdown — if missing, register it at <https://developer.apple.com/account/resources/identifiers/list> first)
   - **SKU:** `debt-freedom-ios` (any unique string)
   - **User access:** Full Access
4. Once created, note the **App ID** (a numeric string in the URL once you're on the app's page) — this goes into `eas.json` `submit.production.ios.ascAppId`
5. Note your **Apple Team ID** from <https://developer.apple.com/account#MembershipDetailsCard> — this goes into `submit.production.ios.appleTeamId`

Then update `frontend/eas.json` with both IDs and commit.

---

## 3 · First TestFlight build

```bash
cd frontend

# Build a TestFlight-suitable .ipa in the cloud (~15-25 min)
# First build will prompt to generate signing credentials — say yes; EAS
# manages them on Apple's behalf.
eas build --platform ios --profile preview
```

The build URL prints when it completes. When the bundle finishes uploading to
Apple, it appears in App Store Connect → TestFlight → iOS Builds within ~10 min.

While you wait, the build itself can also be downloaded as an `.ipa` from the
EAS build page for offline install.

---

## 4 · TestFlight smoke test **(you)**

1. App Store Connect → TestFlight → iOS Builds → the new build appears
2. Add yourself as an Internal Tester
3. Install **TestFlight** on your iPhone (App Store) if you haven't
4. Open TestFlight → install Debt Freedom
5. Run through the full onboarding (5 steps) → land on Plan tab → tick a month
   on Tracker → verify celebration modal fires → check Awards/Settings
6. Force-quit + reopen — verify the plan persists
7. Reset everything from Settings — verify onboarding reappears

If anything misbehaves, iterate: code fix → `eas build --platform ios --profile preview` → reinstall in TestFlight.

---

## 5 · Capture App Store screenshots

You need screenshots in **three** required iPhone resolutions:

| Display size | Resolution | Example device |
|---|---|---|
| 6.7" | 1290 × 2796 px | iPhone 15 Pro Max / 16 Plus |
| 6.5" | 1242 × 2688 px | iPhone 11 Pro Max / XS Max |
| 5.5" | 1242 × 2208 px | iPhone 8 Plus |

Easiest path: run the TestFlight build in a single physical iPhone, then use Xcode's **Devices and Simulators → Take Screenshot** to capture at the right resolution. Or use the iOS Simulator (`xcrun simctl`) — but Xcode isn't installed on this Mac yet, so the physical-device path is fastest.

Suggested screen list (5 images, in order):
1. **Countdown hero** (Plan tab top) — the "X days remaining" emotional headline
2. **Mini roadmap + Future snapshot** (scroll down on Plan)
3. **Goals + Debts list** (further down on Plan)
4. **Tracker with one month ticked** — shows progress + overpay button
5. **Awards with Level 2** — shows the gamification

Save into `docs/screenshots/<size>/` for version control.

---

## 6 · Fill App Store Connect metadata **(you)**

In App Store Connect → your app → **App Information**:

- **Name:** Debt Freedom
- **Subtitle:** Your path to financial freedom *(30 chars max — currently 32, see metadata draft for fits)*
- **Category:** Primary = Finance, Secondary = Productivity (optional)
- **Content Rights:** does not contain third-party content → No

Under **Pricing & Availability**:
- Free
- All territories enabled (or just UK/US/Canada/Australia/Ireland for a softer launch)

Under **App Privacy** (the nutrition label):
- Data Collection: **No, we do not collect data from this app**
  - This is true because v1.0 has zero network calls — everything stays on device.
- Privacy Policy URL: required. See section 7.

Under the version (1.0):
- **Promotional Text** (170 chars): see metadata draft
- **Description** (4000 chars): see metadata draft
- **Keywords** (100 chars, comma-separated): see metadata draft
- **Support URL:** required. Section 7.
- **Marketing URL:** optional, leave blank for now
- **Version:** 1.0
- **What's New in This Version:** "Initial release."
- **App Review Information:**
  - Sign-in required? **No**
  - Contact name + email + phone (yours)
  - Notes for the reviewer: see metadata draft

Then upload the build (it auto-attaches once it appears) and upload the 5 screenshots per size.

---

## 7 · Privacy policy + Support URL **(you, 2 minutes)**

Both are mandatory. The static HTML is already in this repo at
`docs/public-pages/` — privacy, support, terms, plus a landing index.

To put them live:

1. Open <https://github.com/TheLaughingGod1986/Debt-Clear-Save/settings/pages>
2. **Source:** branch `main`, folder `/docs`
3. **Save** → wait ~2 minutes for first deploy

Resulting URLs (paste these into App Store Connect):

```
Privacy: https://thelaughinggod1986.github.io/Debt-Clear-Save/public-pages/privacy.html
Support: https://thelaughinggod1986.github.io/Debt-Clear-Save/public-pages/support.html
Terms:   https://thelaughinggod1986.github.io/Debt-Clear-Save/public-pages/terms.html
```

Before going live, replace the `support@example.com` placeholder in
`docs/public-pages/*.html` with your real address (or set up a forwarding
alias):

```bash
cd docs/public-pages
sed -i '' 's/support@example.com/<your real address>/g' *.html
git commit -am "Use real support email" && git push
```

Full details + custom-domain instructions in `docs/public-pages/README.md`.

---

## 8 · Submit for review

In App Store Connect → version 1.0 page → top right **Add for Review** →
**Submit to App Review**.

Review typically takes 1–3 days. Common rejection triggers I'd watch for:
- Missing privacy policy URL → fixed in step 7
- Missing financial-advice disclaimer → already in Settings + onboarding step 5
- Screenshots show different UI than the build → just match the screens
- "Account required to use the app" — N/A for v1.0 (no accounts at all)

If rejected, fix the issue, increment `ios.buildNumber` in `app.json`, rebuild,
re-attach the build, resubmit. Resubmits are reviewed quickly (usually <24 h).

---

## 9 · Future builds

For subsequent TestFlight or App Store uploads:

```bash
# bump version + build number in app.json
# then:
cd frontend
eas build --platform ios --profile production
eas submit --platform ios --latest
```

The `autoIncrement` flag in `eas.json`'s production profile keeps build numbers
unique across uploads automatically.

---

## Quick command reference

```bash
# Local dev
npx expo start --lan

# Production-ish bundle compile (catches errors before EAS)
curl -s "http://127.0.0.1:8081/node_modules/expo/AppEntry.bundle?platform=ios&dev=false&minify=true" -o /tmp/b.js -w "HTTP %{http_code}\n"

# Cloud build for TestFlight (preview)
eas build --platform ios --profile preview

# Cloud build + auto-submit to App Store (production)
eas build --platform ios --profile production --auto-submit

# Just submit the most recent build
eas submit --platform ios --latest

# See all builds
eas build:list --platform ios --limit 10
```
