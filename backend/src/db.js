'use strict'
/**
 * db.js — Data access layer
 *
 * Currently uses an in-memory store (Maps + arrays) — data resets on restart.
 * This is intentional for development and demo mode.
 *
 * TO MIGRATE TO SUPABASE (PostgreSQL):
 *   1.  npm install @supabase/supabase-js
 *   2.  Set DATABASE_URL (or SUPABASE_URL + SUPABASE_KEY) in your .env
 *   3.  Replace each function body with a Supabase query
 *   4.  The function signatures stay identical — routes don't change
 *
 * See docs/DEPLOY_SUPABASE.md for the full migration guide.
 */

const { v4: uuid } = require('uuid')

// ── In-memory store ───────────────────────────────────────────────────────────
const _users     = new Map()   // userId → profile object
const _stats     = new Map()   // userId → dashboard stats
const _symptoms  = new Map()   // userId → symptom entries[]
const _posts     = []          // flat array (paginated in route)
const _joined    = new Map()   // userId → Set<challengeId>
const _saved     = new Map()   // userId → Set<routeId>

const _challenges = [
  { id: 'ch-1', emoji: '🌬️', name: 'Wheeze to Ease 5K',  points: 500, joined: 3241, daysLeft: 14, featured: true,  tags: ['5K', 'Beginner-Friendly', 'Asthma'] },
  { id: 'ch-2', emoji: '🌅', name: '5AM Sunrise Club',    points: 300, joined: 891,  daysLeft: 21, featured: false, tags: ['Morning', 'Consistency'] },
  { id: 'ch-3', emoji: '🤝', name: 'Buddy System Sprint', points: 250, joined: 512,  daysLeft: 7,  featured: false, tags: ['Social', 'Virtual'] },
  { id: 'ch-4', emoji: '🏙️', name: 'City Miles Relay',   points: 750, joined: 7012, daysLeft: 30, featured: false, tags: ['Team', 'City Battle'] },
]

// ── Users ─────────────────────────────────────────────────────────────────────
async function getUser(sub) {
  return _users.get(sub) ?? null
}

async function upsertUser(sub, { email, name } = {}) {
  if (!_users.has(sub)) {
    _users.set(sub, {
      id: sub,
      name: name || 'Runner',
      username: email?.split('@')[0] || 'runner',
      email: email || '',
      bio: '', city: '',
      badge: 'Newbie', badgeIcon: '🏅',
      level: 1, xp: 0, xpToNext: 500,
      asthmaType: '', inhalerType: '', diagnosedYear: '', emergencyContact: '',
      notifyAqi: true, notifyChallenges: true, distanceUnit: 'mi',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      achievements: [],
    })
  }
  return _users.get(sub)
}

async function updateUser(sub, fields) {
  const user = await upsertUser(sub)
  const ALLOWED = ['name','username','bio','city','distanceUnit','asthmaType','inhalerType','diagnosedYear','emergencyContact','notifyAqi','notifyChallenges']
  ALLOWED.forEach(k => { if (fields[k] !== undefined) user[k] = fields[k] })
  _users.set(sub, user)
  return user
}

// ── Dashboard stats ───────────────────────────────────────────────────────────
async function getStats(sub) {
  if (!_stats.has(sub)) {
    _stats.set(sub, {
      weeklyMiles: 0, weeklySessions: 0, avgPace: null,
      weeklyGoal: 25, totalMiles: 0, streak: 0, bestStreak: 0,
      points: 0, level: 1, xp: 0, xpToNext: 500,
      weekBars: [0, 0, 0, 0, 0, 0, 0],
      aqi: null, inhalerLog: [], activeChallenges: [],
    })
  }
  return _stats.get(sub)
}

// ── Posts ─────────────────────────────────────────────────────────────────────
async function listPosts({ page = 1, filter = 'all', perPage = 20 } = {}) {
  const filtered = filter === 'all' ? _posts : _posts.filter(p => p.filter === filter)
  const start    = (page - 1) * perPage
  return { posts: filtered.slice(start, start + perPage), total: filtered.length, page }
}

async function createPost({ sub, name, body, filter = 'story' }) {
  const post = {
    id: uuid(), userId: sub, name: name || 'Runner',
    location: 'Somewhere', time: 'Just now',
    badge: 'Member', badgeClass: 'tag-earth',
    body: body.trim(), filter,
    likes: 0, comments: 0, liked: false,
    createdAt: new Date().toISOString(),
  }
  _posts.unshift(post)
  return post
}

async function likePost(id, delta = 1) {
  const post = _posts.find(p => p.id === id)
  if (!post) return null
  post.likes = Math.max(0, (post.likes || 0) + delta)
  return post
}

// ── Challenges ────────────────────────────────────────────────────────────────
async function listChallenges() {
  return _challenges
}

async function joinChallenge(sub, challengeId) {
  if (!_joined.has(sub)) _joined.set(sub, new Set())
  _joined.get(sub).add(challengeId)
  const ch = _challenges.find(c => c.id === challengeId)
  if (ch) ch.joined = (ch.joined || 0) + 1
  return { challengeId, joined: true }
}

async function leaveChallenge(sub, challengeId) {
  _joined.get(sub)?.delete(challengeId)
  return { challengeId, joined: false }
}

// ── Symptoms ──────────────────────────────────────────────────────────────────
async function listSymptoms(sub) {
  return _symptoms.get(sub) ?? []
}

async function createSymptom(sub, fields) {
  const entry = { id: uuid(), ...fields, createdAt: new Date().toISOString() }
  if (!_symptoms.has(sub)) _symptoms.set(sub, [])
  _symptoms.get(sub).unshift(entry)
  return entry
}

module.exports = {
  getUser, upsertUser, updateUser,
  getStats,
  listPosts, createPost, likePost,
  listChallenges, joinChallenge, leaveChallenge,
  listSymptoms, createSymptom,
}
