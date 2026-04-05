'use strict'
const express = require('express')
const db      = require('../db')

const router = express.Router()

// GET /api/symptoms/:userId
router.get('/:userId', async (req, res, next) => {
  try {
    res.json(await db.listSymptoms(req.auth.sub))
  } catch (err) { next(err) }
})

// POST /api/symptoms/:userId
router.post('/:userId', async (req, res, next) => {
  try {
    const { date, run, symptoms, triggers, level, notes } = req.body
    if (!level) return res.status(400).json({ error: 'level is required.' })
    const entry = await db.createSymptom(req.auth.sub, { date, run, symptoms, triggers, level, notes })
    res.status(201).json(entry)
  } catch (err) { next(err) }
})

module.exports = router
