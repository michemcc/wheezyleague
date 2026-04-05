# Deploying The Wheezy League with Supabase + Vercel + Railway

This guide takes you from the in-memory demo backend to a fully production-ready deployment with Supabase (PostgreSQL), Vercel (frontend), and Railway (API server).

---

## Architecture Overview

```
Browser
  │
  ├── Vercel  (React frontend, static)
  │     └── calls ──► Railway  (Express API)
  │                       └── reads/writes ──► Supabase  (PostgreSQL)
  │
  └── Auth0  (authentication, token issuance)
```

---

## Part 1 — Supabase Setup

### 1.1 Create a project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**, choose your region, set a strong database password
3. Wait ~2 minutes for provisioning

### 1.2 Get your connection string

1. In your Supabase project → **Settings → Database**
2. Scroll to **Connection String → URI**
3. Copy the URI — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[REF].supabase.co:5432/postgres
   ```
4. This becomes `DATABASE_URL` in your Railway environment

### 1.3 Run the database schema

In your Supabase project → **SQL Editor**, paste and run:

```sql
-- Users / profiles
create table if not exists users (
  id              text primary key,          -- Auth0 sub
  name            text not null default 'Runner',
  username        text not null default 'runner',
  email           text not null default '',
  bio             text not null default '',
  city            text not null default '',
  badge           text not null default 'Newbie',
  badge_icon      text not null default '🏅',
  level           int  not null default 1,
  xp              int  not null default 0,
  xp_to_next      int  not null default 500,
  points          int  not null default 0,
  asthma_type     text not null default '',
  inhaler_type    text not null default '',
  diagnosed_year  text not null default '',
  emergency_contact text not null default '',
  notify_aqi        boolean not null default true,
  notify_challenges boolean not null default true,
  distance_unit   text not null default 'mi',
  joined_date     text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Dashboard stats (one row per user, upserted after each run)
create table if not exists stats (
  user_id         text primary key references users(id) on delete cascade,
  weekly_miles    numeric not null default 0,
  weekly_sessions int     not null default 0,
  avg_pace        text,
  weekly_goal     numeric not null default 25,
  total_miles     numeric not null default 0,
  streak          int     not null default 0,
  best_streak     int     not null default 0,
  week_bars       jsonb   not null default '[0,0,0,0,0,0,0]',
  updated_at      timestamptz not null default now()
);

-- Community posts
create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references users(id) on delete cascade,
  name        text not null default 'Runner',
  body        text not null,
  filter      text not null default 'story',
  likes       int  not null default 0,
  comments    int  not null default 0,
  created_at  timestamptz not null default now()
);
create index on posts (created_at desc);

-- Symptom log
create table if not exists symptoms (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references users(id) on delete cascade,
  date        text,
  run         text,
  symptoms    text[],
  triggers    text[],
  level       text not null,
  notes       text,
  created_at  timestamptz not null default now()
);
create index on symptoms (user_id, created_at desc);

-- Challenge participation
create table if not exists challenge_joins (
  user_id      text not null references users(id) on delete cascade,
  challenge_id text not null,
  joined_at    timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

-- Enable Row Level Security
alter table users            enable row level security;
alter table stats            enable row level security;
alter table posts            enable row level security;
alter table symptoms         enable row level security;
alter table challenge_joins  enable row level security;

-- Service role bypasses RLS (your API uses the service role key)
-- No RLS policies needed when connecting via service role
```

> **Note:** The backend connects as the **service role** (bypasses RLS). Never expose the service role key in the browser.

---

## Part 2 — Update the Backend for Supabase

### 2.1 Install the Supabase client

```bash
cd backend
npm install @supabase/supabase-js
```

### 2.2 Add Supabase credentials to backend/.env

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
SUPABASE_URL=https://[REF].supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key    # Settings → API → service_role
```

> Get `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` from your Supabase project → **Settings → API**.

### 2.3 Replace db.js with the Supabase version

Replace `backend/src/db.js` entirely with:

```js
'use strict'
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY   // service role — server-side only
)

// ── Users ─────────────────────────────────────────────────────────────────────
async function getUser(sub) {
  const { data } = await supabase.from('users').select('*').eq('id', sub).single()
  return data
}

async function upsertUser(sub, { email, name } = {}) {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id:          sub,
        email:       email || '',
        name:        name  || 'Runner',
        username:    email?.split('@')[0] || 'runner',
        joined_date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        updated_at:  new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: false }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

async function updateUser(sub, fields) {
  const ALLOWED = ['name','username','bio','city','distance_unit','asthma_type','inhaler_type','diagnosed_year','emergency_contact','notify_aqi','notify_challenges']
  const update  = {}
  ALLOWED.forEach(k => { if (fields[k] !== undefined) update[k] = fields[k] })
  update.updated_at = new Date().toISOString()
  const { data, error } = await supabase.from('users').update(update).eq('id', sub).select().single()
  if (error) throw error
  return data
}

// ── Stats ─────────────────────────────────────────────────────────────────────
async function getStats(sub) {
  // Ensure user row exists first
  await upsertUser(sub)
  const { data } = await supabase.from('stats').select('*').eq('user_id', sub).single()
  if (!data) {
    const { data: created } = await supabase.from('stats').insert({ user_id: sub }).select().single()
    return created
  }
  return data
}

// ── Posts ─────────────────────────────────────────────────────────────────────
async function listPosts({ page = 1, filter = 'all', perPage = 20 } = {}) {
  let query = supabase.from('posts').select('*', { count: 'exact' }).order('created_at', { ascending: false })
  if (filter !== 'all') query = query.eq('filter', filter)
  const { data, count, error } = await query.range((page - 1) * perPage, page * perPage - 1)
  if (error) throw error
  return { posts: data, total: count, page }
}

async function createPost({ sub, name, body, filter = 'story' }) {
  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: sub, name: name || 'Runner', body: body.trim(), filter })
    .select()
    .single()
  if (error) throw error
  return data
}

async function likePost(id, delta = 1) {
  // Use a Postgres function to atomically increment
  const { data, error } = await supabase.rpc('increment_likes', { post_id: id, amount: delta })
  if (error) throw error
  return data
}

// ── Challenges ────────────────────────────────────────────────────────────────
async function listChallenges() {
  // Challenges are static config for now — move to DB table if you want admin editing
  return [
    { id: 'ch-1', emoji: '🌬️', name: 'Wheeze to Ease 5K',  points: 500, joined: 3241, daysLeft: 14, featured: true  },
    { id: 'ch-2', emoji: '🌅', name: '5AM Sunrise Club',    points: 300, joined: 891,  daysLeft: 21, featured: false },
    { id: 'ch-3', emoji: '🤝', name: 'Buddy System Sprint', points: 250, joined: 512,  daysLeft: 7,  featured: false },
    { id: 'ch-4', emoji: '🏙️', name: 'City Miles Relay',   points: 750, joined: 7012, daysLeft: 30, featured: false },
  ]
}

async function joinChallenge(sub, challengeId) {
  const { error } = await supabase.from('challenge_joins').upsert({ user_id: sub, challenge_id: challengeId })
  if (error) throw error
  return { challengeId, joined: true }
}

async function leaveChallenge(sub, challengeId) {
  await supabase.from('challenge_joins').delete().eq('user_id', sub).eq('challenge_id', challengeId)
  return { challengeId, joined: false }
}

// ── Symptoms ──────────────────────────────────────────────────────────────────
async function listSymptoms(sub) {
  const { data, error } = await supabase
    .from('symptoms').select('*').eq('user_id', sub).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

async function createSymptom(sub, fields) {
  const { data, error } = await supabase
    .from('symptoms')
    .insert({ user_id: sub, ...fields })
    .select()
    .single()
  if (error) throw error
  return data
}

module.exports = {
  getUser, upsertUser, updateUser,
  getStats,
  listPosts, createPost, likePost,
  listChallenges, joinChallenge, leaveChallenge,
  listSymptoms, createSymptom,
}
```

Add the `increment_likes` SQL function in Supabase SQL Editor:

```sql
create or replace function increment_likes(post_id uuid, amount int)
returns json language plpgsql as $$
declare
  updated posts;
begin
  update posts set likes = greatest(0, likes + amount) where id = post_id returning * into updated;
  return row_to_json(updated);
end;
$$;
```

---

## Part 3 — Set variables on Vercel

### 3.1 Set environment variables on Vercel

In Vercel → Project → **Settings → Environment Variables**:

```
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.wheezyleague.run
SUPABASE_URL=https://[REF].supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
VITE_DATA_MODE=real
VITE_API_BASE_URL=/api
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_spa_client_id
VITE_AUTH0_AUDIENCE=https://api.wheezyleague.run
```

### 3.3 Note your Railway URL

It will look like `https://wheezyleague-api.railway.app`. You'll need this next.

---

## Part 4 — Deploy to Vercel

### 4.1 Import on Vercel

1. [vercel.com/new](https://vercel.com/new) → Import from GitHub
2. Framework will be auto-detected as **Vite**
3. Build command: `npm run build` (auto)
4. Output directory: `dist` (auto)

### 4.2 Set environment variables in Vercel

```
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_spa_client_id
VITE_AUTH0_AUDIENCE=https://api.wheezyleague.run
VITE_DATA_MODE=real
VITE_API_BASE_URL=https://wheezyleague-api.railway.app/api
VITE_STRAVA_CLIENT_ID=     (if using)
VITE_MAPMYRUN_CLIENT_ID=   (if using)
```

### 4.3 Deploy

Click **Deploy**. Vercel runs `npm run build` and serves the `dist` folder. The `vercel.json` in the repo handles SPA routing — no extra config needed.

---

## Part 5 — Auth0 Callback URLs

Update your Auth0 app (Applications → Your App → Settings) with:

| Field | Value |
|-------|-------|
| Allowed Callback URLs | `https://your-app.vercel.app, http://localhost:3000` |
| Allowed Logout URLs   | `https://your-app.vercel.app, http://localhost:3000` |
| Allowed Web Origins   | `https://your-app.vercel.app, http://localhost:3000` |

---

## Production Checklist

Before going live, confirm:

- [ ] `VITE_DATA_MODE=real` on Vercel
- [ ] `NODE_ENV=production` on Railway
- [ ] `FRONTEND_URL` on Railway = your Vercel domain
- [ ] Auth0 callback URLs updated with production domain
- [ ] Supabase SQL schema applied
- [ ] `SUPABASE_SERVICE_KEY` set on Railway (never expose in browser)
- [ ] Railway service is healthy: `GET https://your-api.railway.app/health`
- [ ] Vercel deployment succeeded and app loads
- [ ] Login flow works end-to-end

---

## Local Development (Supabase)

You can also point local dev at Supabase:

```bash
# backend/.env
SUPABASE_URL=https://[REF].supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
NODE_ENV=development

npm run dev
```

Or stay in-memory (zero config) for purely frontend work:

```bash
# frontend .env.local
VITE_DATA_MODE=demo   # no backend needed
npm run dev
```

---

*The Wheezy League · docs/DEPLOY_SUPABASE.md*
