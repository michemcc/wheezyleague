'use strict'
const { expressjwt: jwt } = require('express-jwt')
const jwksRsa = require('jwks-rsa')

const CLAIM_NS    = 'https://wheezyleague.run/'
const ROLE_CLAIM  = `${CLAIM_NS}roles`
const ORG_CLAIM   = `${CLAIM_NS}org`
const MEMBER_ROLE = 'WheezyLeague-Member'
const ADMIN_ROLE  = 'admin'

// Validates Auth0 JWT and attaches decoded payload to req.auth
const authMiddleware = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience:   process.env.AUTH0_AUDIENCE,
  issuer:     `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
})

// Requires WheezyLeague-Member role OR any org membership
function requireMember(req, res, next) {
  const roles = req.auth?.[ROLE_CLAIM] ?? []
  const org   = req.auth?.[ORG_CLAIM]  ?? null
  if (roles.includes(MEMBER_ROLE) || !!org) return next()
  res.status(403).json({ error: 'Forbidden', message: `Requires '${MEMBER_ROLE}' role.` })
}

// Factory: require a specific role
function requireRole(role) {
  return (req, res, next) => {
    const roles = req.auth?.[ROLE_CLAIM] ?? []
    if (roles.includes(role)) return next()
    res.status(403).json({ error: 'Forbidden', message: `Requires '${role}' role.` })
  }
}

module.exports = { authMiddleware, requireMember, requireRole, MEMBER_ROLE, ADMIN_ROLE, ROLE_CLAIM, ORG_CLAIM }
