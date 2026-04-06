'use strict'
/**
 * routes/admin.js — Admin API for The Wheezy League
 *
 * All routes require:
 *   1. Valid Auth0 JWT (authMiddleware)
 *   2. 'admin' role  (requireRole('admin'))
 *
 * Apply in index.js:
 *   app.use('/api/admin', authMiddleware, requireRole('admin'), require('./routes/admin'))
 *
 * Endpoints:
 *   GET    /api/admin/rewards          — list all rewards
 *   POST   /api/admin/rewards          — create reward
 *   PATCH  /api/admin/rewards/:id      — update reward
 *   DELETE /api/admin/rewards/:id      — delete reward
 *
 *   GET    /api/admin/challenges       — list all challenges
 *   POST   /api/admin/challenges       — create challenge
 *   PATCH  /api/admin/challenges/:id   — update challenge
 *   DELETE /api/admin/challenges/:id   — delete challenge
 *
 *   GET    /api/admin/stats            — platform stats
 */

const express = require('express')
const db      = require('../db')
const router  = express.Router()

// ── Rewards ───────────────────────────────────────────────────────────────────
router.get('/rewards', async (_req, res, next) => {
  try { res.json(await db.listRewards()) } catch (e) { next(e) }
})

router.post('/rewards', async (req, res, next) => {
  try {
    const { name, icon, pts, stock = true, description = '' } = req.body
    if (!name || !pts) return res.status(400).json({ error: 'name and pts are required' })
    res.status(201).json(await db.createReward({ name, icon: icon || '🎁', pts: Number(pts), stock, description }))
  } catch (e) { next(e) }
})

router.patch('/rewards/:id', async (req, res, next) => {
  try {
    const updated = await db.updateReward(req.params.id, req.body)
    if (!updated) return res.status(404).json({ error: 'Reward not found' })
    res.json(updated)
  } catch (e) { next(e) }
})

router.delete('/rewards/:id', async (req, res, next) => {
  try {
    await db.deleteReward(req.params.id)
    res.json({ deleted: true })
  } catch (e) { next(e) }
})

// ── Challenges ────────────────────────────────────────────────────────────────
router.get('/challenges', async (_req, res, next) => {
  try { res.json(await db.listChallenges()) } catch (e) { next(e) }
})

router.post('/challenges', async (req, res, next) => {
  try {
    const { name, emoji, points, daysLeft, featured = false, tags = [], description = '' } = req.body
    if (!name || !points) return res.status(400).json({ error: 'name and points are required' })
    res.status(201).json(await db.createChallenge({ name, emoji: emoji || '🏃', points: Number(points), daysLeft: Number(daysLeft || 30), featured, tags, description }))
  } catch (e) { next(e) }
})

router.patch('/challenges/:id', async (req, res, next) => {
  try {
    const updated = await db.updateChallenge(req.params.id, req.body)
    if (!updated) return res.status(404).json({ error: 'Challenge not found' })
    res.json(updated)
  } catch (e) { next(e) }
})

router.delete('/challenges/:id', async (req, res, next) => {
  try {
    await db.deleteChallenge(req.params.id)
    res.json({ deleted: true })
  } catch (e) { next(e) }
})

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', async (_req, res, next) => {
  try { res.json(await db.getAdminStats()) } catch (e) { next(e) }
})

module.exports = router
