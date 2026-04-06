/**
 * useAuth — enriched auth hook for The Wheezy League
 *
 * Wraps Auth0's useAuth0 and adds role + org helpers.
 *
 * HOW ROLES GET INTO THE TOKEN
 * ─────────────────────────────
 * Auth0 doesn't put roles in tokens by default. You need a Post-Login Action:
 *
 *   exports.onExecutePostLogin = async (event, api) => {
 *     const ns = 'https://wheezyleague.run/'
 *     const roles = event.authorization?.roles ?? []
 *     const org   = event.organization?.name  ?? null
 *     // Write to BOTH tokens — idToken for the React app, accessToken for the API
 *     api.idToken.setCustomClaim(`${ns}roles`, roles)
 *     api.idToken.setCustomClaim(`${ns}org`,   org)
 *     api.accessToken.setCustomClaim(`${ns}roles`, roles)
 *     api.accessToken.setCustomClaim(`${ns}org`,   org)
 *   }
 *
 * Deploy the action and drag it into the Login flow in Auth0 Dashboard.
 *
 * WHY ROLES MIGHT BE MISSING AFTER TOGGLING TO LIVE MODE
 * ────────────────────────────────────────────────────────
 * 1. VITE_AUTH0_AUDIENCE is not set → Auth0 issues an opaque token with no
 *    custom claims. Solution: make sure VITE_AUTH0_AUDIENCE is set in .env.local.
 *
 * 2. The Post-Login Action only writes to accessToken, not idToken.
 *    Solution: write to BOTH (see Action code above).
 *
 * 3. Token cached before Action was added → old token has no roles.
 *    Solution: log out and log back in to get a fresh token.
 *
 * 4. The WheezyLeague-Member role wasn't assigned to your user in Auth0.
 *    Solution: Auth0 Dashboard → User Management → Users → your user → Roles → Assign.
 */

import { useAuth0 } from '@auth0/auth0-react'
import { useState, useEffect } from 'react'

const CLAIM_NS   = 'https://wheezyleague.run/'
const ROLE_CLAIM = `${CLAIM_NS}roles`
const ORG_CLAIM  = `${CLAIM_NS}org`

export const MEMBER_ROLE = 'WheezyLeague-Member'

export default function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0()

  // Roles from ID token (fast, available immediately from user object)
  const idTokenRoles = user?.[ROLE_CLAIM] ?? []
  const idTokenOrg   = user?.[ORG_CLAIM]  ?? null

  // Also decode roles from the access token — this is the authoritative source
  // and is what the backend checks. We cache it in state so it updates once on login.
  const [accessTokenRoles, setAccessTokenRoles] = useState([])
  const [accessTokenOrg,   setAccessTokenOrg]   = useState(null)
  const [rolesLoading,     setRolesLoading]      = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !import.meta.env.VITE_AUTH0_AUDIENCE) return

    setRolesLoading(true)
    getAccessTokenSilently({
      authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
    })
      .then(token => {
        // JWT payload is the middle base64url segment
        try {
          const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
          setAccessTokenRoles(payload[ROLE_CLAIM] ?? [])
          setAccessTokenOrg(payload[ORG_CLAIM]   ?? null)
        } catch {
          // Token may be opaque (no audience set) — fall back to ID token
        }
      })
      .catch(() => {
        // Silently fall back to ID token roles
      })
      .finally(() => setRolesLoading(false))
  }, [isAuthenticated, getAccessTokenSilently])

  // Merge: use access token roles if available, fall back to ID token
  const roles = accessTokenRoles.length > 0 ? accessTokenRoles : idTokenRoles
  const org   = accessTokenOrg ?? idTokenOrg

  const isMember  = roles.includes(MEMBER_ROLE) || !!org
  const hasRole   = (role) => roles.includes(role)
  const hasAnyRole= (...roleList) => roleList.some(r => roles.includes(r))

  const login  = (opts = {}) => loginWithRedirect(opts)
  const signup = () => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })
  const signout= () => logout({ logoutParams: { returnTo: window.location.origin } })

  const getToken = () => getAccessTokenSilently({
    authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
  })

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || rolesLoading,
    roles,
    org,
    isMember,
    hasRole,
    hasAnyRole,
    getToken,
    login,
    signup,
    logout: signout,
  }
}
