# 🫁 The Wheezy League

**v2026.5.0** — Asthma-friendly run club platform.

> Run with every breath.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Auth | Auth0 |
| Backend | Node.js + Express (Vercel serverless) |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel — **one project, frontend + backend** |

---

## Quick start (local)

```bash
# 1. Frontend — demo mode, no backend needed
npm install
cp .env.example .env.local        # fill in Auth0 values
npm run dev                        # → http://localhost:3000

# 2. Backend — only needed when VITE_DATA_MODE=real
cd backend
npm install
cp .env.example .env               # fill in Auth0 + Supabase values
npm run dev                        # → http://localhost:4000
```

---

## Deploy to Vercel

Everything — frontend **and** backend — deploys to one Vercel project.
No Railway. No separate backend service.

See [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md) for the full guide.

---

## Project structure

```
wheezyleague/
├── api/
│   └── index.js          ← Vercel serverless entry (re-exports backend app)
├── src/                  ← React frontend (Vite)
│   ├── components/       ← Navbar, Footer, modals, auth guards
│   ├── context/          ← DemoContext (dark mode, demo toggle, avatar)
│   ├── data/             ← Mock data for demo mode
│   ├── hooks/            ← useAuth (roles + org from Auth0)
│   ├── pages/            ← One page per route
│   ├── services/         ← dataService.js — demo / real API toggle
│   └── styles/           ← globals.css, components.css
├── backend/
│   └── src/
│       ├── index.js      ← Express app (exported for Vercel, listen for local)
│       ├── db.js         ← Data access layer (swap internals for Supabase)
│       ├── middleware/   ← Auth0 JWT + role checking
│       └── routes/       ← users, posts, challenges, routes, symptoms
├── docs/
│   ├── DEPLOY_VERCEL.md  ← Full Vercel deployment guide ← START HERE
│   ├── DEPLOY_SUPABASE.md← Supabase schema + migration guide
│   └── AUTH0_SETUP.md    ← Auth0 roles, orgs, Post-Login Action
├── vercel.json           ← SPA rewrites + /api route + security headers
└── vite.config.js
```

---

## Demo vs Live mode

The banner toggle switches data sources at runtime:

| Mode | Source | Backend needed? |
|------|--------|-----------------|
| `demo` | `src/data/*.js` mock files | No |
| `real` | Express API at `VITE_API_BASE_URL` | Yes |

---

## Versioning

`YYYY.MINOR.PATCH` — calendar versioning. Current: **v2026.5.0**
