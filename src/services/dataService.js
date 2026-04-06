/**
 * services/dataService.js — unified data layer
 *
 * Each function accepts `isDemo` from DemoContext so the toggle
 * works at runtime, not just at build time.
 *
 * DEMO MODE → returns mock data from src/data/*.js instantly
 * LIVE MODE → fetches from VITE_API_BASE_URL (your Node backend)
 */

import { ROUTES }              from '../data/routes'
import { CHALLENGES, LEADERBOARD } from '../data/challenges'
import { POSTS }               from '../data/posts'
import { DEMO_PROFILE, DEMO_DASHBOARD, DEMO_SYMPTOM_LOG } from '../data/profile'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'

async function _apiFetch(path, options = {}, token = null) {
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader, ...options.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`)
  return res.json()
}

export async function getDashboard(userId, isDemo) {
  if (isDemo) return DEMO_DASHBOARD
  return _apiFetch(`/users/${userId}/dashboard`).catch(() => null)
}

export async function getProfile(userId, isDemo) {
  if (isDemo) return DEMO_PROFILE
  return _apiFetch(`/users/${userId}/profile`).catch(() => null)
}

export async function updateProfile(userId, payload, isDemo) {
  if (isDemo) { await new Promise(r => setTimeout(r, 600)); return { ...DEMO_PROFILE, ...payload } }
  return _apiFetch(`/users/${userId}/profile`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function getPosts({ page = 1, filter = 'all' } = {}, isDemo) {
  if (isDemo) return POSTS
  return _apiFetch(`/posts?page=${page}&filter=${filter}`).then(d => d.posts || []).catch(() => [])
}

export async function createPost(payload, isDemo) {
  if (isDemo) { await new Promise(r => setTimeout(r, 400)); return { id: Date.now(), ...payload, likes: 0, comments: 0, liked: false } }
  return _apiFetch('/posts', { method: 'POST', body: JSON.stringify(payload) })
}

export async function deletePost(postId, isDemo) {
  if (isDemo) return { deleted: true }
  return _apiFetch(`/posts/${postId}`, { method: 'DELETE' })
}

export async function getComments(postId, isDemo) {
  if (isDemo) return []
  return _apiFetch(`/posts/${postId}/comments`).catch(() => [])
}

export async function addComment(postId, body, isDemo) {
  if (isDemo) return { id: Date.now(), name: 'You', body, createdAt: new Date().toISOString() }
  return _apiFetch(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ body }) })
}

export async function toggleLike(postId, liked, isDemo) {
  if (isDemo) return { postId, liked }
  return _apiFetch(`/posts/${postId}/like`, { method: liked ? 'DELETE' : 'POST' })
}

export async function getChallenges(isDemo) {
  if (isDemo) return CHALLENGES
  return _apiFetch('/challenges').catch(() => [])
}

export async function getLeaderboard(isDemo) {
  if (isDemo) return LEADERBOARD
  return _apiFetch('/challenges/leaderboard').catch(() => [])
}

export async function joinChallenge(challengeId, isDemo) {
  if (isDemo) { await new Promise(r => setTimeout(r, 300)); return { challengeId, joined: true } }
  return _apiFetch(`/challenges/${challengeId}/join`, { method: 'POST' })
}

export async function getRoutes({ search = '', aqiFilter = 'all' } = {}, isDemo) {
  if (isDemo) return ROUTES.filter(r => {
    const ms = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.city.toLowerCase().includes(search.toLowerCase())
    return ms && (aqiFilter === 'all' || r.aqiClass === aqiFilter)
  })
  return _apiFetch(`/routes?search=${encodeURIComponent(search)}&aqi=${aqiFilter}`).catch(() => [])
}

export async function saveRoute(routeId, saved, isDemo) {
  if (isDemo) return { routeId, saved }
  return _apiFetch(`/routes/${routeId}/save`, { method: saved ? 'DELETE' : 'POST' })
}

export async function getSymptomLog(userId, isDemo) {
  if (isDemo) return DEMO_SYMPTOM_LOG
  return _apiFetch(`/symptoms/${userId}`).catch(() => [])
}

export async function addSymptomEntry(userId, entry, isDemo) {
  if (isDemo) { await new Promise(r => setTimeout(r, 400)); return { id: Date.now(), ...entry } }
  return _apiFetch(`/symptoms/${userId}`, { method: 'POST', body: JSON.stringify(entry) })
}

// ── Admin API ─────────────────────────────────────────────────────────────────
export async function adminGetRewards(token)            { return _apiFetch('/admin/rewards',       {},                               token) }
export async function adminCreateReward(payload, token) { return _apiFetch('/admin/rewards',       { method:'POST', body:JSON.stringify(payload) }, token) }
export async function adminUpdateReward(id, payload, token) { return _apiFetch(`/admin/rewards/${id}`, { method:'PATCH',body:JSON.stringify(payload) }, token) }
export async function adminDeleteReward(id, token)     { return _apiFetch(`/admin/rewards/${id}`, { method:'DELETE' },               token) }

export async function adminGetChallenges(token)              { return _apiFetch('/admin/challenges',       {},                                token) }
export async function adminCreateChallenge(payload, token)   { return _apiFetch('/admin/challenges',       { method:'POST', body:JSON.stringify(payload) }, token) }
export async function adminUpdateChallenge(id, payload, token) { return _apiFetch(`/admin/challenges/${id}`, { method:'PATCH',body:JSON.stringify(payload) }, token) }
export async function adminDeleteChallenge(id, token)        { return _apiFetch(`/admin/challenges/${id}`, { method:'DELETE' },                token) }

export async function adminGetStats(token) { return _apiFetch('/admin/stats', {}, token) }
