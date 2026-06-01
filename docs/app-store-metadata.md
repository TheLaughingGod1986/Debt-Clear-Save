# App Store Connect Metadata — Debt Freedom v1.0

Copy-paste-ready copy for every metadata field App Store Connect requires.
All character counts respect Apple's limits.

---

## App Information

| Field | Value |
|---|---|
| **Name** | `Debt Freedom` (12/30) |
| **Subtitle** | `See your debt-free date` (23/30) |
| **Bundle ID** | `com.benoats.debtfreedom` |
| **Primary category** | Finance |
| **Secondary category** | (leave blank) |
| **Content rights** | Does not use third-party content |
| **Age rating** | 4+ (no objectionable content) |

### Subtitle alternatives (pick whichever you like best)
- `See your debt-free date` — direct, benefit-led (23 char)
- `Your path to freedom` — aspirational (20 char)
- `Plan your way out of debt` — action-oriented (25 char)
- `A clear path to debt free` — outcome (25 char)

---

## Pricing & Availability

- **Price tier:** Free
- **Territories:** All (or soft-launch: UK, IE, AU, NZ, CA, US)
- **Pre-orders:** No

---

## App Privacy (nutrition label)

Answer the questionnaire as follows:

> **Do you or your third-party partners collect data from this app?**
> **No**

That's the entire answer. v1.0 has zero network calls, zero analytics, zero third-party SDKs. No further questions appear.

**Privacy Policy URL:** required (see launch runbook §7 for a minimum policy).

---

## Version 1.0 fields

### Promotional Text (170 char)

> Take control of your debts in 60 seconds. Add what you owe, set a budget, and see exactly when you'll be debt free — plus how much interest you'll save.

(166/170)

### Description (4000 char)

```
Debt Freedom shows you exactly when you'll be debt free — and how much interest you can save getting there.

Built for anyone juggling credit cards, loans, overdrafts, or store cards, Debt Freedom turns the chaos of multiple debts into one clear plan you can follow month by month.

WHAT YOU GET

• A real debt-free date, not a vague promise
• Side-by-side: total interest under your plan vs paying minimums only
• A month-by-month payoff schedule using the avalanche or snowball strategy
• Tap-to-tick progress tracking with celebrations at every milestone
• A 5-level journey from "Getting Started" to "Debt Freedom"
• A daily countdown — how many days until you're free

PRIVATE BY DESIGN

Your financial data never leaves your phone. Debt Freedom has no accounts, no servers, no analytics, no tracking, and no third-party SDKs. Everything you enter is stored privately on your device. If you delete the app, all your data is removed with it.

WHO IT'S FOR

• Anyone with one or more debts who wants to know the end date
• People who've been overwhelmed by spreadsheets and budgeting apps
• Anyone who wants real numbers, not just vibes, on their path out of debt

PICK YOUR STRATEGY

• Avalanche — clear the highest-interest debt first, minimising total interest paid
• Snowball — clear the smallest balance first for quick wins and momentum

Switch between them with a single tap to see which gets you there faster.

EXTRA PAYMENTS, INSTANT IMPACT

Got a tax refund or a windfall? Log it against any month and see immediately how many months earlier you'll be debt free and how much extra interest you'll save.

NOT FINANCIAL ADVICE

Debt Freedom is a planning tool. Projections are estimates based on the figures you enter. Always check the numbers against your statements and seek qualified advice for major financial decisions.

COMING SOON

Cloud sync across devices, payment reminders, and shared plans for partners — all in a free future update.
```

(approx 1900 / 4000)

### Keywords (100 char, comma-separated, no spaces between)

```
debt,debtfree,payoff,budget,snowball,avalanche,creditcard,loan,finance,planner,tracker,savings,money
```

(102 char — trim one if you hit the cap; remove "savings" → 94 char)

**Trimmed (94 char):**
```
debt,debtfree,payoff,budget,snowball,avalanche,creditcard,loan,finance,planner,tracker,money
```

### Support URL

Required. Hosted privacy/support page (see launch runbook §7).

Example: `https://benoats.github.io/debt-freedom-web/support.html`

### Marketing URL

Optional. Leave blank for v1.0.

### What's New in This Version (4000 char)

```
Welcome to Debt Freedom — the calmest way to plan your way out of debt.

This is version 1.0. You can:

• Add your debts in seconds
• Set a monthly budget
• See your debt-free date instantly
• Track progress month by month
• Earn 5 levels and a stack of milestone badges as you go

Everything stays on your phone. Have feedback? Get in touch from the support link above.
```

### App Review Information

| Field | Value |
|---|---|
| **Sign-in required** | No |
| **Contact first name** | Ben |
| **Contact last name** | Oats |
| **Phone** | (yours) |
| **Email** | `benoats@googlemail.com` |
| **Notes** | See draft below |

#### Notes for the reviewer (draft)

```
Debt Freedom is a fully offline iOS app. There are no user accounts, no sign-in, no servers, no third-party SDKs, and no network calls of any kind. All data the user enters (debts, budget, goals, ticked months) is stored privately on the device via AsyncStorage. No data leaves the phone.

The app is a planning tool, not financial advice — this disclaimer is shown both during onboarding (step 5) and in Settings → About.

To explore the full experience:
1. Launch the app — onboarding starts automatically on first open
2. Add at least one debt on step 2 (e.g. Credit Card £5,000, 24.9% APR, £100/min)
3. Enter a budget on step 3 (e.g. £500/mo)
4. Step 4 reveals the debt-free date instantly
5. Step 5 completes setup
6. On the Plan tab, the Debt Freedom Countdown shows days remaining
7. The Tracker tab lets you tick off months — celebration modals fire on milestones
8. The Awards tab shows level progression and badges
9. Settings → "Reset everything" returns to onboarding

No demo account required.
```

### Promotional artwork / app preview

- **Required:** 1 screenshot per device size (3 sizes; 5 recommended each)
- **Optional:** App Preview video (up to 30s). Skip for v1.0.
- **App Store icon:** automatically extracted from `frontend/assets/icon.png`

See launch runbook §5 for screenshot capture instructions.

---

## Suggested screenshot caption overlays (optional but recommended)

If you add caption text to each screenshot (e.g. in Figma or Sketch):

1. **Countdown hero:** "Know exactly when you'll be free"
2. **Plan + roadmap:** "Every milestone, mapped"
3. **Goals + debts:** "Pay off debts, fund what matters"
4. **Tracker with tick:** "Tick each month. Watch the date move."
5. **Awards with Level 2:** "Five levels. One destination."

---

## Pre-submission self-checklist

Before pressing **Submit to App Review**:

- [ ] Build attached and visible under "Build" section
- [ ] All 3 screenshot sizes uploaded (5 images each)
- [ ] Privacy Policy URL resolves and mentions on-device-only storage
- [ ] Support URL resolves and shows a contact method
- [ ] App Privacy → "Data Not Collected"
- [ ] Age Rating: 4+
- [ ] Subtitle, keywords, description, what's new all populated
- [ ] App Review notes filled in
- [ ] Bundle ID / app name / version / build number all consistent
- [ ] `ITSAppUsesNonExemptEncryption: false` is in app.json (it is — confirms no Apple export-compliance prompt every upload)
- [ ] First-launch experience tested fresh on a real device via TestFlight
- [ ] "Reset everything" tested → onboarding reappears

When all 12 are ticked → Submit.
```
