# Adding Supabase to The Wheezy League

This guide upgrades the backend from the in-memory store (data resets on restart) to Supabase (PostgreSQL — data persists forever). Everything runs on Vercel — no Railway or separate backend host needed.

See [`DEPLOY_VERCEL.md`](./DEPLOY_VERCEL.md) for the full deployment guide first.

---

## Architecture

```
Browser
  └── Vercel project
        ├── /          → React frontend (Vite → dist/)
        └── /api/*     → Express serverless function (api/index.js)
                              └── Supabase PostgreSQL
```

---

## Part 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Pick a region close to your Vercel deployment region (usually US East or EU West)
3. Set a strong database password and save it somewhere
4. Wait ~2 minutes for provisioning

---

## Part 2 — Get your credentials

In your Supabase project → **Settings → API**:

| Value | Where to find it |
|-------|-----------------|
| `SUPABASE_URL` | Project URL — looks like `https://[ref].supabase.co` |
| `SUPABASE_SERVICE_KEY` | `service_role` key (bottom of the API page) — **keep this secret, server-side only** |

---

## Part 3 — Run the database schema

In Supabase → **SQL Editor**, paste and run this entire block:

```sql
-- ── Users / profiles ──────────────────────────────────────
create table if not exists users (
  id                text primary key,   -- Auth0 sub (e.g. "auth0|abc123")
  name              text not null default 'Runner',
  username          text not null default 'runner',
  email             text not null default '',
  bio               text not null default '',
  city              text not null default '',
  badge             text not null default 'Newbie',
  badge_icon        text not null default '🏅',
  level             int  not null default 1,
  xp                int  not null default 0,
  xp_to_next        int  not null default 500,
  points            int  not null default 0,
  asthma_type       text not null default '',
  inhaler_type      text not null default '',
  diagnosed_year    text not null default '',
  emergency_contact text not null default '',
  notify_aqi        boolean not null default true,
  notify_challenges boolean not null default true,
  distance_unit     text not null default 'mi',
  joined_date       text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── Dashboard stats ────────────────────────────────────────
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

-- ── Community posts ────────────────────────────────────────
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
create index if not exists posts_created_at_idx on posts (created_at desc);

-- ── Comments ──────────────────────────────────────────────
create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     text not null references users(id) on delete cascade,
  name        text not null default 'Runner',
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists comments_post_id_idx on comments (post_id, created_at);

-- ── Symptom log ────────────────────────────────────────────
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
create index if not exists symptoms_user_idx on symptoms (user_id, created_at desc);

-- ── Challenge joins ────────────────────────────────────────
create table if not exists challenge_joins (
  user_id      text not null references users(id) on delete cascade,
  challenge_id text not null,
  joined_at    timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

-- ── Notifications ──────────────────────────────────────────
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references users(id) on delete cascade,
  icon       text not null default '🔔',
  title      text not null,
  body       text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notif_user_idx on notifications (user_id, created_at desc);

-- ── Rewards (admin-managed) ────────────────────────────────
create table if not exists rewards (
  id          uuid primary key default gen_random_uuid(),
  icon        text not null default '🎁',
  name        text not null,
  pts         int  not null,
  stock       boolean not null default true,
  description text not null default '',
  created_at  timestamptz not null default now()
);

-- Seed default rewards
insert into rewards (icon, name, pts, stock, description) values
  ('🧣', 'Buff Headband',             400,  true,  'The Wheezy League branded headband.'),
  ('🏁', 'Race Entry Credit ($25)',   1000, true,  '$25 toward any partner race entry.'),
  ('💨', 'Partner Inhaler Discount',  600,  true,  '20% off partner pharmacy. UK/US only.'),
  ('🟤', 'Foam Roller',               800,  true,  'High-density foam roller, shipped.'),
  ('🫁', '1-Month BreathPro Free',    500,  true,  'One free month of BreathPro subscription.'),
  ('❤️', 'Donate to Asthma Research', 300,  true,  'We donate to Asthma + Lung UK.'),
  ('🧢', 'The Wheezy League Cap',     1200, false, 'Limited edition. Back in stock soon.'),
  ('🧦', 'Running Socks (3-pack)',    700,  true,  'Blister-resistant running socks.')
on conflict do nothing;

-- ── Enable Row Level Security ──────────────────────────────
-- The backend connects as service_role which bypasses RLS.
-- Enable it anyway so direct DB access is protected by default.
alter table users            enable row level security;
alter table stats            enable row level security;
alter table posts            enable row level security;
alter table comments         enable row level security;
alter table symptoms         enable row level security;
alter table challenge_joins  enable row level security;
alter table notifications    enable row level security;
alter table rewards          enable row level security;

-- ── Atomic like increment function ────────────────────────
create or replace function increment_likes(post_id uuid, amount int)
returns json language plpgsql as $$
declare updated posts;
begin
  update posts set likes = greatest(0, likes + amount)
  where id = post_id returning * into updated;
  return row_to_json(updated);
end;
$$;
```

---

## Part 4 — Update db.js with Supabase queries

Install the Supabase client in the backend:

```bash
cd backend
npm install @supabase/supabase-js
```

Replace `backend/src/db.js` entirely with the Supabase version:

```js
'use strict'
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // service role — never expose client-side
)

// ── Users ─────────────────────────────────────────────────
async function getUser(sub) {
  const { data } = await supabase.from('users').select('*').eq('id', sub).single()
  return data
}

async function upsertUser(sub, { email, name } = {}) {
  const { data, error } = await supabase
    .from('users')
    .upsert({ id: sub, email: email || '', name: name || 'Runner',
               username: email?.split('@')[0] || 'runner',
               joined_date: new Date().toLocaleDateString('en-US', { month:'long', year:'numeric' }),
               updated_at: new Date().toISOString() },
             { onConflict: 'id', ignoreDuplicates: false })
    .select().single()
  if (error) throw error
  return data
}

async function updateUser(sub, fields) {
  const ALLOWED = ['name','username','bio','city','distance_unit','asthma_type',
                   'inhaler_type','diagnosed_year','emergency_contact','notify_aqi','notify_challenges']
  const update = { updated_at: new Date().toISOString() }
  ALLOWED.forEach(k => { if (fields[k] !== undefined) update[k] = fields[k] })
  const { data, error } = await supabase.from('users').update(update).eq('id', sub).select().single()
  if (error) throw error
  return data
}

// ── Stats ──────────────────────────────────────────────────
async function getStats(sub) {
  await upsertUser(sub)
  let { data } = await supabase.from('stats').select('*').eq('user_id', sub).single()
  if (!data) {
    const { data: created } = await supabase.from('stats').insert({ user_id: sub }).select().single()
    data = created
  }
  return data
}

// ── Posts ──────────────────────────────────────────────────
async function listPosts({ page = 1, filter = 'all', perPage = 20 } = {}) {
  let q = supabase.from('posts').select('*', { count: 'exact' }).order('created_at', { ascending: false })
  if (filter !== 'all') q = q.eq('filter', filter)
  const { data, count, error } = await q.range((page-1)*perPage, page*perPage-1)
  if (error) throw error
  return { posts: data, total: count, page }
}

async function createPost({ sub, name, body, filter = 'story' }) {
  const { data, error } = await supabase.from('posts')
    .insert({ user_id: sub, name: name || 'Runner', body: body.trim(), filter })
    .select().single()
  if (error) throw error
  return data
}

async function deletePost(id, sub) {
  const { data } = await supabase.from('posts').select('id').eq('id', id).eq('user_id', sub).single()
  if (!data) return null
  await supabase.from('posts').delete().eq('id', id)
  return { deleted: true }
}

async function likePost(id, delta = 1) {
  const { data, error } = await supabase.rpc('increment_likes', { post_id: id, amount: delta })
  if (error) throw error
  return data
}

// ── Comments ───────────────────────────────────────────────
async function listComments(postId) {
  const { data, error } = await supabase.from('comments').select('*')
    .eq('post_id', postId).order('created_at', { ascending: true })
  if (error) throw error
  return data
}

async function createComment(postId, { sub, name, body }) {
  const { data, error } = await supabase.from('comments')
    .insert({ post_id: postId, user_id: sub, name, body })
    .select().single()
  if (error) throw error
  // Increment comment count on post
  await supabase.from('posts').update({ comments: supabase.rpc('get_comment_count', { pid: postId }) }).eq('id', postId)
  return data
}

// ── Symptoms ───────────────────────────────────────────────
async function listSymptoms(sub) {
  const { data, error } = await supabase.from('symptoms').select('*')
    .eq('user_id', sub).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

async function createSymptom(sub, fields) {
  const { data, error } = await supabase.from('symptoms').insert({ user_id: sub, ...fields }).select().single()
  if (error) throw error
  return data
}

// ── Challenges ─────────────────────────────────────────────
async function listChallenges() {
  // Static config — move to a DB table when you want admin editing to persist
  return [
    { id:'ch-1', emoji:'🌬️', name:'Wheeze to Ease 5K',  points:500, joined:3241, daysLeft:14, featured:true  },
    { id:'ch-2', emoji:'🌅', name:'5AM Sunrise Club',    points:300, joined:891,  daysLeft:21, featured:false },
    { id:'ch-3', emoji:'🤝', name:'Buddy System Sprint', points:250, joined:512,  daysLeft:7,  featured:false },
    { id:'ch-4', emoji:'🏙️', name:'City Miles Relay',   points:750, joined:7012, daysLeft:30, featured:false },
  ]
}

async function joinChallenge(sub, challengeId) {
  await supabase.from('challenge_joins').upsert({ user_id: sub, challenge_id: challengeId })
  return { challengeId, joined: true }
}

async function leaveChallenge(sub, challengeId) {
  await supabase.from('challenge_joins').delete().eq('user_id', sub).eq('challenge_id', challengeId)
  return { challengeId, joined: false }
}

// ── Notifications ──────────────────────────────────────────
async function listNotifications(sub) {
  let { data } = await supabase.from('notifications').select('*')
    .eq('user_id', sub).order('created_at', { ascending: false }).limit(20)
  if (!data || data.length === 0) {
    // Seed welcome notification for new users
    await createNotification(sub, { icon:'🫁', title:'Welcome to The Wheezy League!', body:'Your journey starts here. Log your first run to earn XP.' })
    const { data: fresh } = await supabase.from('notifications').select('*').eq('user_id', sub).order('created_at', { ascending: false })
    data = fresh
  }
  return data || []
}

async function markNotificationsRead(sub, ids = null) {
  let q = supabase.from('notifications').update({ read: true }).eq('user_id', sub)
  if (ids) q = q.in('id', ids)
  const { data } = await q.select()
  return data
}

async function createNotification(sub, { icon, title, body }) {
  const { data } = await supabase.from('notifications').insert({ user_id: sub, icon, title, body }).select().single()
  return data
}

// ── Rewards ────────────────────────────────────────────────
async function listRewards() {
  const { data, error } = await supabase.from('rewards').select('*').order('pts')
  if (error) throw error
  return data || []
}

async function createReward(fields) {
  const { data, error } = await supabase.from('rewards').insert(fields).select().single()
  if (error) throw error
  return data
}

async function updateReward(id, fields) {
  const ALLOWED = ['name','icon','pts','stock','description']
  const update = {}
  ALLOWED.forEach(k => { if (fields[k] !== undefined) update[k] = fields[k] })
  const { data, error } = await supabase.from('rewards').update(update).eq('id', id).select().single()
  if (error) throw error
  return data
}

async function deleteReward(id) {
  await supabase.from('rewards').delete().eq('id', id)
}

// ── Challenge admin ────────────────────────────────────────
async function createChallenge(fields) { return fields }  // static for now
async function updateChallenge(id, fields) { return { id, ...fields } }
async function deleteChallenge(id) {}

// ── Admin stats ────────────────────────────────────────────
async function getAdminStats() {
  const [users, posts, rewards] = await Promise.all([
    supabase.from('users').select('id', { count:'exact', head:true }),
    supabase.from('posts').select('id', { count:'exact', head:true }),
    supabase.from('rewards').select('id,stock'),
  ])
  return {
    totalUsers:      users.count   || 0,
    totalPosts:      posts.count   || 0,
    totalChallenges: 4,
    totalRewards:    rewards.data?.length || 0,
    rewardsInStock:  rewards.data?.filter(r => r.stock).length || 0,
  }
}

module.exports = {
  getUser, upsertUser, updateUser,
  getStats,
  listPosts, createPost, deletePost, likePost,
  listComments, createComment,
  listSymptoms, createSymptom,
  listChallenges, joinChallenge, leaveChallenge,
  listNotifications, markNotificationsRead, createNotification,
  listRewards, createReward, updateReward, deleteReward,
  createChallenge, updateChallenge, deleteChallenge,
  getAdminStats,
}
```

---

## Part 5 — Set environment variables on Vercel

In Vercel → Project → **Settings → Environment Variables**, add:

```
SUPABASE_URL          https://[ref].supabase.co
SUPABASE_SERVICE_KEY  your_service_role_key
NODE_ENV              production
AUTH0_DOMAIN          your-tenant.auth0.com
AUTH0_AUDIENCE        https://api.wheezyleague.run
FRONTEND_URL          https://your-app.vercel.app
VITE_DATA_MODE        real
VITE_API_BASE_URL     /api
VITE_AUTH0_DOMAIN     your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID  your_spa_client_id
VITE_AUTH0_AUDIENCE   https://api.wheezyleague.run
```

Then redeploy — Vercel picks up the new env vars automatically.

---

## Part 6 — Verify

```bash
# Health check — should show version and env
curl https://your-app.vercel.app/api/health

# Test auth (replace TOKEN with a real access token from your browser devtools)
curl https://your-app.vercel.app/api/notifications \
  -H "Authorization: Bearer TOKEN"
```

---

## Production checklist

- [ ] Supabase SQL schema applied (Part 3)
- [ ] `@supabase/supabase-js` installed in `backend/`
- [ ] `backend/src/db.js` replaced with Supabase version (Part 4)
- [ ] `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` set on Vercel
- [ ] `VITE_DATA_MODE=real` set on Vercel
- [ ] Redeployed on Vercel after env var changes
- [ ] `/api/health` returns `{"ok":true}`
- [ ] Login → profile loads without spinning
- [ ] Notifications appear in bell dropdown
- [ ] Posts persist after page refresh

---

*The Wheezy League · docs/DEPLOY_SUPABASE.md · v2026.6.0*
