'use strict'
/**
 * routes/strava.js
 *
 * Strava OAuth 2.0 + activity sync for The Wheezy League.
 *
 * Endpoints:
 *   POST /api/strava/connect      — exchange auth code for tokens
 *   GET  /api/strava/status       — check if user is connected
 *   GET  /api/strava/activities   — fetch recent runs
 *   POST /api/strava/disconnect   — revoke & remove tokens
 *
 * All routes require a valid Auth0 JWT (authMiddleware applied in index.js).
 */

const express = require('express')
const router  = express.Router()

// node-fetch v3 is ESM-only; use dynamic import
const _fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args))

// In-memory token store — replace with DB in production
// Map<userId, { accessToken, refreshToken, expiresAt, athleteId, athleteName }>
const stravaTokens = new Map()

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'
const STRAVA_API_BASE  = 'https://www.strava.com/api/v3'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function refreshIfNeeded(userId) {
  const token = stravaTokens.get(userId)
  if (!token) return null
  // Refresh 5 minutes before expiry
  if (token.expiresAt - 300 > Date.now() / 1000) return token

  const resp = await _fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type:    'refresh_token',
      refresh_token: token.refreshToken,
    }),
  })
  if (!resp.ok) { stravaTokens.delete(userId); return null }

  const data = await resp.json()
  const refreshed = {
    ...token,
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    data.expires_at,
  }
  stravaTokens.set(userId, refreshed)
  return refreshed
}

function mapStravaActivity(a) {
  const totalSecs = a.moving_time || a.elapsed_time || 0
  const distMi    = ((a.distance || 0) / 1609.34)
  const paceSecPerMile = distMi > 0 ? totalSecs / distMi : 0
  const paceStr   = paceSecPerMile > 0
    ? `${Math.floor(paceSecPerMile / 60)}:${String(Math.round(paceSecPerMile % 60)).padStart(2,'0')}/mi`
    : null

  return {
    id:          `strava-${a.id}`,
    source:      'strava',
    verified:    true,
    date:        a.start_date_local?.split('T')[0],
    name:        a.name,
    distMi:      distMi.toFixed(2),
    durationSecs: totalSecs,
    paceStr,
    elevationFt: Math.round((a.total_elevation_gain || 0) * 3.281),
    type:        a.type,
    kudos:       a.kudos_count,
    stravaUrl:   `https://www.strava.com/activities/${a.id}`,
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/strava/connect
router.post('/connect', async (req, res) => {
  const { code } = req.body
  const userId   = req.auth.sub

  if (!code) return res.status(400).json({ error: 'code required' })
  if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
    return res.status(503).json({ error: 'Strava credentials not configured on server.' })
  }

  try {
    const resp = await _fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    })
    const data = await resp.json()
    if (data.errors || !data.access_token) {
      return res.status(400).json({ error: 'Strava token exchange failed', detail: data })
    }

    stravaTokens.set(userId, {
      accessToken:  data.access_token,
      refreshToken: data.refresh_token,
      expiresAt:    data.expires_at,
      athleteId:    data.athlete?.id,
      athleteName:  `${data.athlete?.firstname || ''} ${data.athlete?.lastname || ''}`.trim(),
    })

    res.json({ connected: true, athlete: { name: stravaTokens.get(userId).athleteName } })
  } catch (err) {
    console.error('[Strava connect]', err)
    res.status(500).json({ error: 'Failed to connect Strava' })
  }
})

// GET /api/strava/status
router.get('/status', (req, res) => {
  const token = stravaTokens.get(req.auth.sub)
  res.json({ connected: !!token, athleteName: token?.athleteName || null })
})

// GET /api/strava/activities?per_page=20&page=1
router.get('/activities', async (req, res) => {
  const userId = req.auth.sub
  const token  = await refreshIfNeeded(userId)
  if (!token) return res.status(401).json({ error: 'Strava not connected' })

  const { per_page = 20, page = 1 } = req.query
  try {
    const resp = await _fetch(
      `${STRAVA_API_BASE}/athlete/activities?per_page=${per_page}&page=${page}`,
      { headers: { Authorization: `Bearer ${token.accessToken}` } }
    )
    const activities = await resp.json()
    const runs = (Array.isArray(activities) ? activities : [])
      .filter(a => ['Run','VirtualRun','TrailRun'].includes(a.type))
      .map(mapStravaActivity)

    res.json(runs)
  } catch (err) {
    console.error('[Strava activities]', err)
    res.status(500).json({ error: 'Failed to fetch activities' })
  }
})

// POST /api/strava/disconnect
router.post('/disconnect', async (req, res) => {
  const userId = req.auth.sub
  const token  = stravaTokens.get(userId)
  if (token) {
    // Best-effort deauthorise with Strava
    _fetch(`${STRAVA_API_BASE}/oauth/deauthorize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.accessToken}` },
    }).catch(() => {})
    stravaTokens.delete(userId)
  }
  res.json({ connected: false })
})

module.exports = router
