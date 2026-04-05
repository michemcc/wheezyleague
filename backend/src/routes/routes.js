'use strict'
const express = require('express')

const router = express.Router()

// Static route data — replace with DB query when ready
const ROUTES = [
  { id: 'r-1', name: 'Esplanade River Path', city: 'Boston, MA', distMi: 4.2, surface: 'Paved', aqi: 'good',  pollen: 'low',    emoji: '🏙️', rating: 4.8, saved: false },
  { id: 'r-2', name: 'Minuteman Bikeway',     city: 'Lexington, MA', distMi: 10.5, surface: 'Paved', aqi: 'good',  pollen: 'medium', emoji: '🌳', rating: 4.7, saved: false },
  { id: 'r-3', name: 'Blue Hills Skyline',    city: 'Milton, MA',    distMi: 6.8,  surface: 'Trail', aqi: 'good',  pollen: 'high',   emoji: '⛰️', rating: 4.5, saved: false },
  { id: 'r-4', name: 'Jamaica Pond Loop',     city: 'Boston, MA',    distMi: 1.5,  surface: 'Paved', aqi: 'mod',   pollen: 'medium', emoji: '💧', rating: 4.6, saved: false },
]

// GET /api/routes
router.get('/', (_req, res) => res.json(ROUTES))

// POST /api/routes/:id/save
router.post('/:id/save', (req, res) => {
  res.json({ routeId: req.params.id, saved: true })
})

// DELETE /api/routes/:id/save
router.delete('/:id/save', (req, res) => {
  res.json({ routeId: req.params.id, saved: false })
})

module.exports = router
