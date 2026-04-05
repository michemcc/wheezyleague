'use strict'
const express = require('express')
const db      = require('../db')

const router = express.Router()

// GET /api/challenges
router.get('/', async (_req, res, next) => {
  try {
    res.json(await db.listChallenges())
  } catch (err) { next(err) }
})

// POST /api/challenges/:id/join
router.post('/:id/join', async (req, res, next) => {
  try {
    res.json(await db.joinChallenge(req.auth.sub, req.params.id))
  } catch (err) { next(err) }
})

// DELETE /api/challenges/:id/join
router.delete('/:id/join', async (req, res, next) => {
  try {
    res.json(await db.leaveChallenge(req.auth.sub, req.params.id))
  } catch (err) { next(err) }
})

// GET /api/challenges/leaderboard
router.get('/leaderboard', async (_req, res, next) => {
  try {
    // Wire to real user stats once DB is connected
    res.json([])
  } catch (err) { next(err) }
})

module.exports = router
