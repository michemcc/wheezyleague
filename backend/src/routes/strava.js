'use strict'
/**
 * routes/strava.js — Strava OAuth token exchange
 *
 * POST /api/strava/connect   — exchange auth code for tokens, store them
 * GET  /api/strava/status    — check if user is connected
 * GET  /api/strava/activities— fetch recent runs from Strava
 * POST /api/strava/disconnect— remove stored tokens
 */
const express = require('express')
const router  = express.Router()

// In-memory token store (swap for DB column when using Supabase)
const _stravaTokens = new Map()  // userId → { access_token, refresh_token, expires_at, athlete }

const STRAVA_CLIENT_ID     = process.env.STRAVA_CLIENT_ID     || ''
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || ''

// POST /api/strava/connect
router.post('/connect', async (req, res, next) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'code is required' })
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      return res.status(503).json({ error: 'Strava not configured on this server' })
    }

    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    })

    const data = await response.json()
    if (!response.ok || data.errors) {
      return res.status(400).json({ error: data.message || 'Strava token exchange failed', details: data })
    }

    // Store tokens keyed by Auth0 sub
    _stravaTokens.set(req.auth.sub, {
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
      athlete:       data.athlete,
    })

    res.json({ connected: true, athlete: data.athlete })
  } catch (err) { next(err) }
})

// GET /api/strava/status
router.get('/status', (req, res) => {
  const stored = _stravaTokens.get(req.auth.sub)
  res.json({ connected: !!stored, athlete: stored?.athlete || null })
})

// GET /api/strava/activities — fetch recent runs
router.get('/activities', async (req, res, next) => {
  try {
    const stored = _stravaTokens.get(req.auth.sub)
    if (!stored) return res.status(404).json({ error: 'Not connected to Strava' })

    // Refresh token if expired
    let token = stored.access_token
    if (Date.now() / 1000 > stored.expires_at - 60) {
      const refresh = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:     STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          refresh_token: stored.refresh_token,
          grant_type:    'refresh_token',
        }),
      })
      const refreshData = await refresh.json()
      if (refresh.ok) {
        token = refreshData.access_token
        _stravaTokens.set(req.auth.sub, { ...stored, ...refreshData })
      }
    }

    const perPage = Math.min(parseInt(req.query.per_page, 10) || 20, 50)
    const actRes  = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&type=Run`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const activities = await actRes.json()
    res.json(Array.isArray(activities) ? activities : [])
  } catch (err) { next(err) }
})

// POST /api/strava/disconnect
router.post('/disconnect', (req, res) => {
  _stravaTokens.delete(req.auth.sub)
  res.json({ connected: false })
})

module.exports = router
