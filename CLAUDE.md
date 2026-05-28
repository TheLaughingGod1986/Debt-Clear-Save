# CLAUDE.md — Project context for Claude Code

This file orients you (Claude Code) to the project. Read it fully before making changes.

## What this is

**Road to Debt Freedom** — a debt-payoff + savings tracker with a decoupled architecture:

- **Backend:** FastAPI (Python). Pure calculation engine + REST API + SQLite persistence.
- **Frontend:** React Native / Expo (JavaScript). Runs on a real iPhone via Expo Go.

The app models a real 36-month plan to clear a credit card and a Debt Management
Plan (DMP), then build a house deposit. It is already functional and tested — you
are continuing development, not starting from scratch.

## Project layout

```
backend/app/
  engine.py     Pure £2,092 "waterfall" payoff logic. NO framework imports.
  database.py   SQLAlchemy models: plans, month_progress. SQLite.
  schemas.py    Pydantic request/response contracts.
  main.py       FastAPI endpoints (CRUD + projection + progress).
frontend/
  App.js        Tab navigation + shared state (Plan / Tracker / Settings).
  src/api/client.js   fetch wrapper. NOTE: API_BASE must point at the backend LAN IP.
  src/theme/theme.js  Design tokens (mirror the printed wall sheets).
  src/components/ui.js
  src/screens/  OverviewScreen, TrackerScreen, SettingsScreen.
```

## The financial model (do not silently change these numbers)

Total monthly budget is held flat at **£2,092** in every phase (no lifestyle creep).
Every month deploys the FULL budget — when a debt needs less than its slot, the
leftover cascades to the next target so nothing sits idle.

| Phase | Months | CC | DMP | Save |
|-------|--------|----|-----|------|
| 1 | 1–12 | £1,300 | £492 | £300 |
| 2 | 13–27 | £0 | £1,492 | £500–600 |
| 3 | 28–36 | £0 | £0 | £2,092 |

Verified milestones the engine MUST keep producing for the default plan:
- Credit card cleared: **Month 13**
- DMP cleared (debt free): **Month 27**
- £60,000 total position (savings + equity) reached: **Month 36**
- Final total position: **£61,656**

Opening position: CC £15,700 · DMP £26,955.99 · equity £21,800 · equity grows
£200/mo · property £330,000 (70% share) · mortgage £186,707 · Oplo £22,460.

If you touch `engine.py`, re-run the verification below and confirm these numbers
still hold before committing.

## How to run

Backend:
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000   # docs at /docs
```

Frontend:
```bash
cd frontend
npm install
npx expo start        # scan QR with Expo Go; set API_BASE to your computer's LAN IP
```

## How to verify (run after any backend change)

```bash
cd backend && pip install httpx
PYTHONPATH=. python3 - <<'PY'
import warnings; warnings.filterwarnings("ignore")
from fastapi.testclient import TestClient
from app.main import app
with TestClient(app) as c:
    pid = c.post('/plans', json={'name':'Test'}).json()['id']
    s = c.get(f'/plans/{pid}/projection').json()['summary']
    assert (s['cc_cleared_month'], s['dmp_cleared_month'], s['target_hit_month']) == (13, 27, 36), s
    assert s['final_total_position'] == 61656, s
    c.put(f'/plans/{pid}/progress/1', json={'done': True})
    assert c.get(f'/plans/{pid}/projection').json()['summary']['months_done'] == 1
    print("VERIFIED: engine + API + persistence OK")
PY
```
There is no test suite yet — **adding pytest tests is a good first task** (see below).

## Conventions

- Backend: keep `engine.py` free of framework/DB imports so it stays unit-testable.
  Money is rounded to whole pounds for display via the engine's `_round`.
- API returns a clean `422` for invalid plans (e.g. Phase 1 allocations exceeding
  the budget) — never let the engine's `ValueError` surface as a 500.
- Frontend: no TypeScript currently; design tokens live in `theme.js`, don't
  hard-code colours. The projection is always recomputed server-side — only
  month tick-offs are mutable state.
- CORS is wide open (`*`) for dev. Must be tightened before any deploy.

## Suggested backlog (good next tasks, roughly in order)

1. **Tests:** add `backend/tests/` with pytest — cover the engine directly
   (phase transitions, the M13/M27 cascade, validation) and the API endpoints.
2. **Auth + multi-user:** there is no auth; it's single-user/local. Add token auth
   and scope plans to a user before any shared deployment.
3. **Charts in the app:** port the page-4 progress chart (CC/DMP/savings/equity/
   total lines) into the Overview screen using `react-native-svg` or Victory Native.
4. **Actuals vs projection:** the `month_progress` table already has `actual_saved`
   and `note` fields — surface them in the Tracker so users log real numbers and
   see drift from plan.
5. **Persistence/deploy:** swap SQLite → Postgres via `DATABASE_URL` in
   `database.py`; add a Dockerfile; document a Render/Railway/Fly.io deploy.
6. **App Store:** wire up `eas build` (needs an Apple Developer account) to produce
   a real `.ipa`.

## Guardrails

- This is a personal-finance tool, not regulated advice. Don't add features that
  present outputs as financial advice.
- Preserve the verified default-plan milestones (M13 / M27 / M36 / £61,656) unless
  the user explicitly asks to change the model.
