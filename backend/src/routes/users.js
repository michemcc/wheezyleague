'use strict'
const express = require('express')
const db      = require('../db')

const router = express.Router()

// GET /api/users/:userId/profile
router.get('/:userId/profile', async (req, res, next) => {
  try {
    const profile = await db.upsertUser(req.auth.sub, {
      email: req.auth.email,
      name:  req.auth.name,
    })
    res.json(profile)
  } catch (err) { next(err) }
})

// PATCH /api/users/:userId/profile
router.patch('/:userId/profile', async (req, res, next) => {
  try {
    const updated = await db.updateUser(req.auth.sub, req.body)
    res.json(updated)
  } catch (err) { next(err) }
})

// GET /api/users/:userId/dashboard
router.get('/:userId/dashboard', async (req, res, next) => {
  try {
    const data = await db.getStats(req.auth.sub)
    res.json(data)
  } catch (err) { next(err) }
})

module.exports = router
