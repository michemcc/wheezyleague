'use strict'
/**
 * api/index.js — Vercel serverless entry point
 *
 * Vercel detects any file in /api and deploys it as a serverless function.
 * This file simply re-exports the Express app from backend/src/index.js.
 * All routes, middleware, and error handling live there — nothing changes
 * between local dev and Vercel deployment.
 *
 * Local dev:  npm run dev  (runs backend/src/index.js directly on port 4000)
 * Production: Vercel invokes this file as a serverless function for /api/*
 */
module.exports = require('../backend/src/index')
