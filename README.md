# Road to Debt Freedom — iOS app

A decoupled debt-payoff tracker: a **FastAPI** backend (the calculation engine +
persistence) and a **React Native / Expo** iOS frontend that runs on your real
iPhone via the **Expo Go** app — no Mac required.

```
debt-freedom/
├── backend/         FastAPI — payoff engine, REST API, SQLite
│   └── app/
│       ├── engine.py      pure £2,092 waterfall logic (no framework deps)
│       ├── database.py    SQLAlchemy models (plans, month_progress)
│       ├── schemas.py     Pydantic request/response contracts
│       └── main.py        the API endpoints
└── frontend/        Expo app (JavaScript)
    ├── App.js             tab navigation + shared state
    └── src/
        ├── api/client.js  fetch wrapper around the backend
        ├── theme/         design tokens (matches the printed sheets)
        ├── components/    reusable UI
        └── screens/       Plan · Tracker · Settings
```

## The model

The backend reproduces exactly the plan we designed:

| Phase | Months | CC | DMP | Save | Total |
|-------|--------|----|-----|------|-------|
| 1 — Smash the CC | 1–12 | £1,300 | £492 | £300 | £2,092 |
| 2 — Destroy the DMP | 13–27 | £0 | £1,492 | £500–600 | £2,092 |
| 3 — Rocket savings | 28–36 | £0 | £0 | £2,092 | £2,092 |

Milestones: **CC cleared M13 · DMP cleared M27 · £60k total position M36.**
Every month deploys the full £2,092 — when a debt needs less than its slot, the
remainder cascades to the next target so nothing idles.

Change any number in **Settings** and the whole journey recalculates instantly,
because the projection is always computed fresh from the engine — only your
monthly tick-offs are stored.

---

## 1. Run the backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API docs (interactive): http://localhost:8000/docs
- The `--host 0.0.0.0` is important so your phone can reach it over Wi-Fi.

## 2. Run the frontend

```bash
cd frontend
npm install
npx expo start
```

Then either:
- **Real iPhone:** install **Expo Go** from the App Store, make sure the phone
  is on the same Wi-Fi as your computer, and scan the QR code from the terminal.
- **Simulator:** press `i` (needs Xcode on a Mac).

### Point the app at your backend

`localhost` on a phone means the phone itself, so set the API address to your
computer's LAN IP. Edit `frontend/src/api/client.js`:

```js
export const API_BASE = 'http://192.168.1.20:8000'; // <- your computer's IP
```

Find your IP with `ipconfig getifaddr en0` (macOS) or `hostname -I` (Linux).
On the Android emulator, `10.0.2.2` already maps to the host (handled for you).

---

## API reference

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/plans` | list plans |
| POST | `/plans` | create a plan |
| GET | `/plans/{id}` | fetch a plan |
| PATCH | `/plans/{id}` | update plan fields |
| DELETE | `/plans/{id}` | delete a plan |
| GET | `/plans/{id}/projection` | full month-by-month projection + summary |
| GET | `/plans/{id}/progress` | list month tick-offs |
| PUT | `/plans/{id}/progress/{month}` | tick / untick a month |

## Notes & next steps

- **Database:** SQLite file `backend/debt_freedom.db`, created on first run.
- **Auth:** none yet — it's single-user/local. Add tokens before any public
  deployment, and tighten CORS in `main.py` (currently `*`).
- **Deploy:** the backend runs anywhere that hosts Python (Render, Railway,
  Fly.io); swap SQLite for Postgres by changing `DATABASE_URL` in `database.py`.
- **App Store:** when ready, `eas build` (Expo Application Services) produces a
  real `.ipa` — that step needs an Apple Developer account.
