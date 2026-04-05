# Deploying The Wheezy League to Vercel

Both the React frontend and the Express backend deploy to a **single Vercel project**. No Railway, no separate backend service, no CORS headaches.

---

## How it works

```
Vercel project
├── / (frontend)      → Vite build → dist/  → CDN
└── /api/* (backend)  → api/index.js        → Serverless Function
```

`api/index.js` re-exports the Express app from `backend/src/index.js`. Vercel detects any file in `/api` and deploys it as a serverless function. All `/api/*` requests are routed there; everything else goes to `index.html` for React Router.

Because frontend and API share the same domain, **no CORS configuration is needed** in production.

---

## Prerequisites

- GitHub account with the repo pushed
- Vercel account (free Hobby plan works)
- Auth0 tenant configured (see `AUTH0_SETUP.md`)
- Supabase project created (see `DEPLOY_SUPABASE.md`) — optional, demo mode works without it

---

## Step 1 — Push to GitHub

```bash
git init                            # if not already a repo
git add .
git commit -m "feat: The Wheezy League v2026.5.0"
git remote add origin https://github.com/you/wheezyleague.git
git push -u origin main
```

Make sure `.gitignore` includes:
```
node_modules/
backend/node_modules/
dist/
.env
.env.local
```

---

## Step 2 — Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select your repo
3. Framework is auto-detected as **Vite** — leave all build settings as-is:
   - Build command: `npm run build` ✓
   - Output directory: `dist` ✓
   - Install command: `npm install` ✓
4. **Do not deploy yet** — set env vars first (Step 3)

---

## Step 3 — Set environment variables

In Vercel → Project → **Settings → Environment Variables**, add these for **Production** (and optionally Preview):

### Frontend variables (`VITE_*`)
| Variable | Value |
|----------|-------|
| `VITE_AUTH0_DOMAIN` | `your-tenant.auth0.com` |
| `VITE_AUTH0_CLIENT_ID` | your SPA client ID from Auth0 |
| `VITE_AUTH0_AUDIENCE` | `https://api.wheezyleague.run` |
| `VITE_DATA_MODE` | `real` |
| `VITE_API_BASE_URL` | `/api` ← relative, same domain |

### Backend variables (no `VITE_` prefix)
| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `AUTH0_DOMAIN` | `your-tenant.auth0.com` |
| `AUTH0_AUDIENCE` | `https://api.wheezyleague.run` |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `SUPABASE_URL` | `https://[ref].supabase.co` |
| `SUPABASE_SERVICE_KEY` | your Supabase service role key |

> **Note:** `FRONTEND_URL` is only used for CORS in local dev. On Vercel the same-domain setup means CORS is never triggered for browser requests. Set it anyway for correctness.

---

## Step 4 — Deploy

Click **Deploy**. Vercel will:
1. Run `npm install` and `npm run build` → produces `dist/`
2. Detect `api/index.js` → packages it as a Node.js serverless function
3. Apply `vercel.json` rewrites:
   - `/api/*` → serverless function
   - Everything else → `dist/index.html` (React SPA)

First deploy takes ~60 seconds. Subsequent deploys are faster.

---

## Step 5 — Update Auth0 callback URLs

In Auth0 → Applications → your app → **Settings**, update:

| Field | Add your Vercel URL |
|-------|---------------------|
| Allowed Callback URLs | `https://your-app.vercel.app` |
| Allowed Logout URLs | `https://your-app.vercel.app` |
| Allowed Web Origins | `https://your-app.vercel.app` |

Keep `http://localhost:3000` in each field for local dev.

---

## Step 6 — Verify deployment

```bash
# Health check — should return JSON
curl https://your-app.vercel.app/api/health

# Expected response:
# {"ok":true,"version":"2026.5.0","env":"production"}
```

Open the app, log in, and check the demo/live toggle in the banner switches to live data.

---

## Local development

Run frontend and backend separately in two terminals:

**Terminal 1 — Frontend**
```bash
cp .env.example .env.local
# Set VITE_DATA_MODE=demo for offline dev, or VITE_DATA_MODE=real + VITE_API_BASE_URL=http://localhost:4000/api
npm run dev
# → http://localhost:3000
```

**Terminal 2 — Backend** (only when VITE_DATA_MODE=real)
```bash
cd backend
cp .env.example .env
# Fill in AUTH0_DOMAIN, AUTH0_AUDIENCE. SUPABASE_* optional (uses in-memory without it).
npm run dev
# → http://localhost:4000
```

---

## Deployment checklist

Before going live, confirm every box:

- [ ] `api/index.js` exists at repo root
- [ ] `vercel.json` has both the `/api/(.*)` and SPA rewrites
- [ ] `VITE_DATA_MODE=real` set on Vercel
- [ ] `VITE_API_BASE_URL=/api` set on Vercel (relative path)
- [ ] `NODE_ENV=production` set on Vercel
- [ ] `AUTH0_DOMAIN` + `AUTH0_AUDIENCE` set on Vercel
- [ ] `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` set on Vercel
- [ ] Auth0 callback URLs updated with Vercel domain
- [ ] Health endpoint returns `{"ok":true}`
- [ ] Login flow works end-to-end
- [ ] Demo/live toggle switches correctly

---

## Vercel plan limits (Hobby — free)

| Limit | Value | Impact |
|-------|-------|--------|
| Serverless function execution | 10s max | Fine — all routes respond in ms |
| Function size | 250MB | Fine — backend is tiny |
| Bandwidth | 100GB/month | Fine for early-stage |
| Deployments | Unlimited | ✓ |

Upgrade to Pro ($20/month) for 60s execution limit, more bandwidth, and team access.

---

## Troubleshooting

**`/api/health` returns 404**
- Check `api/index.js` exists at repo root (not inside `backend/`)
- Check `vercel.json` has `{ "source": "/api/(.*)", "destination": "/api" }`
- Redeploy after adding the file

**Auth0 `callback URL mismatch` error**
- Add `https://your-app.vercel.app` to Allowed Callback URLs in Auth0

**`SUPABASE_SERVICE_KEY` warning in logs**
- The key is set as an env var — it never appears in frontend bundles
- Confirm it's in Environment Variables, not in a committed `.env` file

**In-memory data resets between requests**
- This is expected — serverless functions are stateless
- Wire up Supabase for persistent data (see `DEPLOY_SUPABASE.md`)

**Functions timing out**
- Check for slow DB queries or missing indexes in Supabase
- Auth0 JWKS fetch is cached — first request after cold start may be slower

---

*The Wheezy League · docs/DEPLOY_VERCEL.md · v2026.5.0*
