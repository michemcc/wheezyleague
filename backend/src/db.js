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
const _comments  = new Map()   // postId → comment entries[]
const _joined    = new Map()   // userId → Set<challengeId>
const _saved         = new Map()   // userId → Set<routeId>
const _notifications  = new Map()   // userId → notification[]

// Rewards — admin-manageable
const _rewards = [
  { id: 'rw-1', icon: '🧣', name: 'Buff Headband',              pts: 400,  stock: true,  description: 'The Wheezy League branded headband.' },
  { id: 'rw-2', icon: '🏁', name: 'Race Entry Credit ($25)',    pts: 1000, stock: true,  description: '$25 toward any partner race entry.' },
  { id: 'rw-3', icon: '💨', name: 'Partner Inhaler Discount',  pts: 600,  stock: true,  description: '20% off partner pharmacy. UK/US only.' },
  { id: 'rw-4', icon: '🟤', name: 'Foam Roller',               pts: 800,  stock: true,  description: 'High-density foam roller, shipped.' },
  { id: 'rw-5', icon: '🫁', name: '1-Month BreathPro Free',    pts: 500,  stock: true,  description: 'One free month of BreathPro subscription.' },
  { id: 'rw-6', icon: '❤️', name: 'Donate to Asthma Research', pts: 300,  stock: true,  description: 'We donate 300pts-worth to Asthma + Lung UK.' },
  { id: 'rw-7', icon: '🧢', name: 'The Wheezy League Cap',     pts: 1200, stock: false, description: 'Limited edition. Back in stock soon.' },
  { id: 'rw-8', icon: '🧦', name: 'Running Socks (3-pack)',    pts: 700,  stock: true,  description: 'Blister-resistant, asthma-friendly dye.' },
]

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

async function deletePost(id, sub) {
  const i = _posts.findIndex(p => p.id === id && p.userId === sub)
  if (i === -1) return null
  _posts.splice(i, 1)
  _comments.delete(id)
  return { deleted: true }
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

// ── Comments ─────────────────────────────────────────────────────────────────
async function listComments(postId) {
  return _comments.get(postId) ?? []
}

async function createComment(postId, { sub, name, body }) {
  const comment = { id: uuid(), postId, userId: sub, name, body, createdAt: new Date().toISOString() }
  if (!_comments.has(postId)) _comments.set(postId, [])
  _comments.get(postId).push(comment)
  // bump comment count on post
  const post = _posts.find(p => p.id === postId)
  if (post) post.comments = (_comments.get(postId)).length
  return comment
}

// ── Notifications ────────────────────────────────────────────────────────────
async function listNotifications(sub) {
  if (!_notifications.has(sub)) {
    // Seed with a welcome notification on first access
    _notifications.set(sub, [
      { id: uuid(), icon: '🫁', title: 'Welcome to The Wheezy League!', body: 'Your journey starts here. Log your first run to earn XP.', time: 'Just now', read: false, createdAt: new Date().toISOString() },
    ])
  }
  return _notifications.get(sub)
}

async function markNotificationsRead(sub, ids = null) {
  const notifs = await listNotifications(sub)
  notifs.forEach(n => { if (!ids || ids.includes(n.id)) n.read = true })
  return notifs
}

async function createNotification(sub, { icon, title, body }) {
  const notif = { id: uuid(), icon, title, body, time: 'Just now', read: false, createdAt: new Date().toISOString() }
  if (!_notifications.has(sub)) _notifications.set(sub, [])
  _notifications.get(sub).unshift(notif)
  return notif
}

// ── Rewards ──────────────────────────────────────────────────────────────────
async function listRewards() { return _rewards }

async function createReward(fields) {
  const reward = { id: `rw-${uuid()}`, ...fields }
  _rewards.push(reward)
  return reward
}

async function updateReward(id, fields) {
  const i = _rewards.findIndex(r => r.id === id)
  if (i === -1) return null
  const ALLOWED = ['name', 'icon', 'pts', 'stock', 'description']
  ALLOWED.forEach(k => { if (fields[k] !== undefined) _rewards[i][k] = fields[k] })
  return _rewards[i]
}

async function deleteReward(id) {
  const i = _rewards.findIndex(r => r.id === id)
  if (i !== -1) _rewards.splice(i, 1)
}

// ── Challenge admin ───────────────────────────────────────────────────────────
async function createChallenge(fields) {
  const ch = { id: `ch-${uuid()}`, joined: 0, ...fields }
  _challenges.push(ch)
  return ch
}

async function updateChallenge(id, fields) {
  const i = _challenges.findIndex(c => c.id === id)
  if (i === -1) return null
  const ALLOWED = ['name', 'emoji', 'points', 'daysLeft', 'featured', 'tags', 'description']
  ALLOWED.forEach(k => { if (fields[k] !== undefined) _challenges[i][k] = fields[k] })
  return _challenges[i]
}

async function deleteChallenge(id) {
  const i = _challenges.findIndex(c => c.id === id)
  if (i !== -1) _challenges.splice(i, 1)
}

// ── Admin stats ───────────────────────────────────────────────────────────────
async function getAdminStats() {
  return {
    totalUsers:      _users.size,
    totalPosts:      _posts.length,
    totalChallenges: _challenges.length,
    totalRewards:    _rewards.length,
    rewardsInStock:  _rewards.filter(r => r.stock).length,
  }
}

module.exports = {
  getUser, upsertUser, updateUser,
  listNotifications, markNotificationsRead, createNotification,
  getStats,
  listPosts, createPost, likePost, deletePost,
  listComments, createComment,
  listChallenges, joinChallenge, leaveChallenge,
  listSymptoms, createSymptom,
  listRewards, createReward, updateReward, deleteReward,
  createChallenge, updateChallenge, deleteChallenge,
  getAdminStats,
}
