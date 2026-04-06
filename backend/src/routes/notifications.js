'use strict'
const express = require('express')
const db      = require('../db')
const router  = express.Router()

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try { res.json(await db.listNotifications(req.auth.sub)) } catch (e) { next(e) }
})

// POST /api/notifications/read  — mark specific IDs read (or all if no ids sent)
router.post('/read', async (req, res, next) => {
  try {
    const { ids } = req.body   // array of ids, or omit to mark all
    res.json(await db.markNotificationsRead(req.auth.sub, ids || null))
  } catch (e) { next(e) }
})

module.exports = router
