'use strict'
/**
 * routes/mapmyrun.js
 *
 * MapMyRun / Under Armour Connected Fitness API integration.
 *
 * MapMyRun is owned by Under Armour. Their public API (Connected Fitness)
 * is free to use for personal/small apps.
 * Register at: https://developer.underarmour.com
 *
 * Endpoints:
 *   POST /api/mapmyrun/connect      — exchange auth code for tokens
 *   GET  /api/mapmyrun/status       — check connection status
 *   GET  /api/mapmyrun/activities   — fetch recent workouts
 *   POST /api/mapmyrun/disconnect   — remove stored tokens
 *
 * Under Armour OAuth 2.0 docs:
 *   https://developer.underarmour.com/docs/v71_OAuth_2
 */

const express = require('express')
const router  = express.Router()

const _fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args))

// In-memory store — swap for DB in production
// Map<userId, { accessToken, refreshToken, expiresAt, uaUserId, displayName }>
const mmrTokens = new Map()

const UA_BASE         = 'https://www.underarmour.com'
const UA_API_BASE     = 'https://api.ua.com/v7.1'
const UA_TOKEN_URL    = `${UA_BASE}/auth/oauth/uacf/token`

// ── Helper: refresh access token if near expiry ──────────────────────────────
async function refreshIfNeeded(userId) {
  const token = mmrTokens.get(userId)
  if (!token) return null
  if (token.expiresAt - 300 > Date.now() / 1000) return token

  const body = new URLSearchParams({
    grant_type:    'refresh_token',
    refresh_token: token.refreshToken,
    client_id:     process.env.MAPMYRUN_CLIENT_ID,
    client_secret: process.env.MAPMYRUN_CLIENT_SECRET,
  })

  const resp = await _fetch(UA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!resp.ok) { mmrTokens.delete(userId); return null }

  const data = await resp.json()
  const refreshed = {
    ...token,
    accessToken:  data.access_token,
    refreshToken: data.refresh_token || token.refreshToken,
    expiresAt:    Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
  }
  mmrTokens.set(userId, refreshed)
  return refreshed
}

// ── Map UA workout to The Wheezy League run format ──────────────────────────────────
function mapMMRWorkout(w) {
  // UA distances are in meters
  const distMi    = ((w.distance || 0) / 1609.34)
  const totalSecs = w.duration || 0
  const paceSecPerMile = distMi > 0 ? totalSecs / distMi : 0
  const paceStr = paceSecPerMile > 0
    ? `${Math.floor(paceSecPerMile / 60)}:${String(Math.round(paceSecPerMile % 60)).padStart(2, '0')}/mi`
    : null

  return {
    id:           `mmr-${w.workout_key || w.id}`,
    source:       'mapmyrun',
    verified:     true,
    date:         w.start_datetime?.split('T')[0],
    name:         w.name || 'MapMyRun Activity',
    distMi:       distMi.toFixed(2),
    durationSecs: totalSecs,
    paceStr,
    calories:     w.metabolic_energy ? Math.round(w.metabolic_energy / 4184) : null,
    mmrUrl:       w._links?.self?.[0]?.href
      ? `https://www.mapmyrun.com/workout/${w.workout_key}` : null,
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/mapmyrun/connect
router.post('/connect', async (req, res) => {
  const { code } = req.body
  const userId   = req.auth.sub

  if (!code) return res.status(400).json({ error: 'code required' })
  if (!process.env.MAPMYRUN_CLIENT_ID || !process.env.MAPMYRUN_CLIENT_SECRET) {
    return res.status(503).json({ error: 'MapMyRun credentials not configured on server.' })
  }

  try {
    const body = new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      client_id:     process.env.MAPMYRUN_CLIENT_ID,
      client_secret: process.env.MAPMYRUN_CLIENT_SECRET,
      redirect_uri:  process.env.MAPMYRUN_REDIRECT_URI,
    })

    const resp = await _fetch(UA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const data = await resp.json()
    if (!data.access_token) {
      return res.status(400).json({ error: 'MapMyRun token exchange failed', detail: data })
    }

    // Fetch user profile to get display name
    const profileResp = await _fetch(`${UA_API_BASE}/user/self/`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        'Api-Key': process.env.MAPMYRUN_CLIENT_ID,
      },
    })
    const profile = await profileResp.json()

    mmrTokens.set(userId, {
      accessToken:  data.access_token,
      refreshToken: data.refresh_token,
      expiresAt:    Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      uaUserId:     profile?.id,
      displayName:  `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'MapMyRun User',
    })

    res.json({ connected: true, displayName: mmrTokens.get(userId).displayName })
  } catch (err) {
    console.error('[MapMyRun connect]', err)
    res.status(500).json({ error: 'Failed to connect MapMyRun' })
  }
})

// GET /api/mapmyrun/status
router.get('/status', (req, res) => {
  const token = mmrTokens.get(req.auth.sub)
  res.json({ connected: !!token, displayName: token?.displayName || null })
})

// GET /api/mapmyrun/activities?limit=20&offset=0
router.get('/activities', async (req, res) => {
  const userId = req.auth.sub
  const token  = await refreshIfNeeded(userId)
  if (!token) return res.status(401).json({ error: 'MapMyRun not connected' })

  const { limit = 20, offset = 0 } = req.query

  try {
    // Filter to run activity types (37 = Run, 16 = Walk/Run)
    const url = `${UA_API_BASE}/workout/?limit=${limit}&offset=${offset}&activity_type=37`
    const resp = await _fetch(url, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        'Api-Key': process.env.MAPMYRUN_CLIENT_ID,
      },
    })
    const data = await resp.json()
    const workouts = data?._embedded?.workouts || []
    const runs = workouts.map(mapMMRWorkout)

    res.json(runs)
  } catch (err) {
    console.error('[MapMyRun activities]', err)
    res.status(500).json({ error: 'Failed to fetch MapMyRun activities' })
  }
})

// POST /api/mapmyrun/disconnect
router.post('/disconnect', (req, res) => {
  mmrTokens.delete(req.auth.sub)
  res.json({ connected: false })
})

module.exports = router
