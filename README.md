# 🫁 The Wheezy League

**Version 2026.4.0**

> Run with every breath.

The Wheezy League is an asthma-friendly run club platform built with React + Vite on the frontend and Node.js + Express on the backend. Features a full gamification system, BreathZone symptom tracker, community feed, challenges, safe routes, and integrations with Strava and MapMyRun.

---

## Quick Start

```bash
# Frontend (demo mode — no backend needed)
npm install
cp .env.example .env.local   # fill in Auth0 values
npm run dev                  # → http://localhost:3000

# Backend (optional — for live data)
cd backend
npm install
cp .env.example .env         # fill in Auth0 + DB values
npm run dev                  # → http://localhost:4000
```

---

## Project Structure

```
wheezyleague/
├── src/                    # React frontend (Vite)
│   ├── components/         # Navbar, Footer, modals, auth guards
│   ├── context/            # DemoContext (dark mode, demo toggle, avatar)
│   ├── data/               # Mock data for demo mode
│   ├── hooks/              # useAuth (roles + org from Auth0)
│   ├── pages/              # One page per route
│   ├── services/           # dataService.js — demo/real API toggle
│   └── styles/             # globals.css, components.css
│
├── backend/
│   └── src/
│       ├── db.js           # Data access layer (swap for Supabase here)
│       ├── middleware/     # Auth0 JWT + role checking
│       └── routes/         # users, posts, challenges, routes, symptoms
│
├── docs/                   # Deployment + integration guides
├── vercel.json             # Vercel SPA routing + headers
└── vite.config.js
```

---

## Deployment

### Frontend → Vercel (recommended)

1. Push to GitHub
2. [Import on Vercel](https://vercel.com/new) — select repo, framework auto-detected as Vite
3. Set environment variables (see `.env.example`):
   ```
   VITE_AUTH0_DOMAIN
   VITE_AUTH0_CLIENT_ID
   VITE_AUTH0_AUDIENCE
   VITE_DATA_MODE=real
   VITE_API_BASE_URL=https://your-backend.railway.app/api
   ```
4. Deploy — done. `vercel.json` handles SPA routing automatically.

### Backend → Railway

1. [railway.app](https://railway.app) → New Project → GitHub repo → set Root Directory to `backend`
2. Set env vars (see `backend/.env.example`)
3. Copy the Railway URL into `VITE_API_BASE_URL` on Vercel

See [`docs/DEPLOY_SUPABASE.md`](docs/DEPLOY_SUPABASE.md) for adding a real Supabase PostgreSQL database.

---

## Auth0 Setup

See [`docs/AUTH0_SETUP.md`](docs/AUTH0_SETUP.md) for the full guide including:
- Creating the `WheezyLeague-Member` role
- The Post-Login Action that injects roles into tokens
- Setting up Organizations for partner run clubs

---

## Demo vs Live Mode

Toggle with `VITE_DATA_MODE`:

| Mode | Data source | Backend needed? |
|------|-------------|-----------------|
| `demo` | `src/data/*.js` mock files | No |
| `real` | Your Express API at `VITE_API_BASE_URL` | Yes |

The toggle also appears in the UI banner and mobile drawer — safe for dev presentations.

---

## Versioning

Calendar versioning: `YYYY.MINOR.PATCH`
- `YYYY` — release year
- `MINOR` — feature releases within the year
- `PATCH` — bug fixes

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, React Router v6 |
| Auth | Auth0 (`@auth0/auth0-react`) |
| Backend | Node.js, Express |
| Database | In-memory (dev) → Supabase PostgreSQL (prod) |
| Deployment | Vercel (frontend) + Railway (backend) |
| Integrations | Strava API, MapMyRun (Under Armour Connected Fitness) |

---

*The Wheezy League v2026.4.0 — Run with every breath. 🫁*
