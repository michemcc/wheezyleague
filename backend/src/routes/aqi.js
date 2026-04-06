'use strict'
/**
 * routes/aqi.js — Live Air Quality data
 *
 * GET /api/aqi?location=Boston,MA
 *
 * Uses the Open-Meteo Air Quality API (free, no API key needed).
 * Geocodes the location with Open-Meteo geocoding API, also free.
 *
 * AQI categories (US EPA standard, derived from PM2.5):
 *   0–50   Good           🟢
 *   51–100 Moderate       🟡
 *  101–150 Unhealthy (sensitive) 🟠
 *  151–200 Unhealthy      🔴
 *  201–300 Very Unhealthy 🟣
 *   300+   Hazardous      ⚫
 */
const express = require('express')
const router  = express.Router()

// Simple in-memory cache: { key: { data, fetchedAt } }
const _cache = new Map()
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

function aqiFromPm25(pm25) {
  if (pm25 == null) return null
  // Simplified linear interpolation per EPA breakpoints
  const breakpoints = [
    [0, 12,    0,   50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 500, 301, 500],
  ]
  for (const [lo, hi, aqiLo, aqiHi] of breakpoints) {
    if (pm25 >= lo && pm25 <= hi) {
      return Math.round(((aqiHi - aqiLo) / (hi - lo)) * (pm25 - lo) + aqiLo)
    }
  }
  return null
}

function aqiLabel(aqi) {
  if (aqi == null) return { label: 'Unknown', color: 'gray',   icon: '⚪', safe: null }
  if (aqi <= 50)   return { label: 'Good',           color: 'green',  icon: '🟢', safe: true  }
  if (aqi <= 100)  return { label: 'Moderate',       color: 'yellow', icon: '🟡', safe: true  }
  if (aqi <= 150)  return { label: 'Unhealthy for Sensitive Groups', color: 'orange', icon: '🟠', safe: false }
  if (aqi <= 200)  return { label: 'Unhealthy',      color: 'red',    icon: '🔴', safe: false }
  if (aqi <= 300)  return { label: 'Very Unhealthy', color: 'purple', icon: '🟣', safe: false }
  return               { label: 'Hazardous',         color: 'maroon', icon: '⚫', safe: false }
}

router.get('/', async (req, res, next) => {
  try {
    const location = (req.query.location || '').trim()
    if (!location) return res.status(400).json({ error: 'location query param required' })

    const cacheKey = location.toLowerCase()
    const cached   = _cache.get(cacheKey)
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return res.json({ ...cached.data, cached: true })
    }

    // 1. Geocode
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    const geoRes  = await fetch(geoUrl)
    const geoData = await geoRes.json()
    const place   = geoData?.results?.[0]
    if (!place) return res.status(404).json({ error: `Could not geocode "${location}"` })

    const { latitude: lat, longitude: lng, name, country_code } = place

    // 2. Air quality (Open-Meteo, free, no key)
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=pm2_5,pm10,us_aqi&current=pm2_5,pm10,us_aqi&timezone=auto`
    const aqRes  = await fetch(aqUrl)
    const aqData = await aqRes.json()

    const currentAqi  = aqData?.current?.us_aqi  ?? aqiFromPm25(aqData?.current?.pm2_5)
    const pm25        = aqData?.current?.pm2_5    ?? null
    const pm10        = aqData?.current?.pm10     ?? null
    const { label, color, icon, safe } = aqiLabel(currentAqi)

    const data = {
      location: `${name}${country_code ? ', ' + country_code.toUpperCase() : ''}`,
      lat, lng,
      aqi:    currentAqi,
      pm25:   pm25  != null ? Math.round(pm25  * 10) / 10 : null,
      pm10:   pm10  != null ? Math.round(pm10  * 10) / 10 : null,
      label, color, icon, safe,
      fetchedAt: new Date().toISOString(),
    }

    _cache.set(cacheKey, { data, fetchedAt: Date.now() })
    res.json(data)
  } catch (err) { next(err) }
})

module.exports = router
