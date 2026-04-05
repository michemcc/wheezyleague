'use strict'
require('dotenv').config()

const express   = require('express')
const helmet    = require('helmet')
const cors      = require('cors')
const morgan    = require('morgan')
const rateLimit = require('express-rate-limit')

const { authMiddleware, requireMember } = require('./middleware/auth')

const app  = express()
const PORT = process.env.PORT || 4000
const isProd = process.env.NODE_ENV === 'production'

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(express.json({ limit: '512kb' }))

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(s => s.trim())
app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server (no origin) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin '${origin}' not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Logging ───────────────────────────────────────────────────────────────────
if (!isProd) app.use(morgan('dev'))

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
}))

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  ok: true,
  version: require('../package.json').version,
  env: process.env.NODE_ENV,
}))

// ── Routes (auth required on all /api/* routes) ───────────────────────────────
app.use('/api/users',      authMiddleware, requireMember, require('./routes/users'))
app.use('/api/posts',      authMiddleware, requireMember, require('./routes/posts'))
app.use('/api/challenges', authMiddleware, requireMember, require('./routes/challenges'))
app.use('/api/routes',     authMiddleware, requireMember, require('./routes/routes'))
app.use('/api/symptoms',   authMiddleware, requireMember, require('./routes/symptoms'))
app.use('/api/strava',     authMiddleware, requireMember, require('./routes/strava'))
app.use('/api/mapmyrun',   authMiddleware, requireMember, require('./routes/mapmyrun'))

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500
  if (status >= 500) console.error('[ERROR]', err)
  res.status(status).json({
    error: status === 401 ? 'Unauthorized'
         : status === 403 ? 'Forbidden'
         : isProd        ? 'Internal server error'
         : err.message,
  })
})

app.listen(PORT, () => {
  console.log(`\n🫁  The Wheezy League API  →  http://localhost:${PORT}`)
  console.log(`    v${require('../package.json').version}  ·  ${process.env.NODE_ENV}`)
  console.log(`    Auth0: ${process.env.AUTH0_DOMAIN || '⚠ not set'}`)
  console.log(`    DB:    ${process.env.DATABASE_URL ? '✓ configured' : '◌ in-memory (dev only)'}\n`)
})

module.exports = app
