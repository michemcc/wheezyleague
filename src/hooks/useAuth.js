/**
 * useAuth — enriched auth hook for The Wheezy League
 *
 * Wraps Auth0's useAuth0 and adds:
 *  - Role checking via Auth0 custom claims
 *  - Organization detection
 *  - Convenience helpers: hasRole(), hasAnyRole(), isMember()
 *
 * HOW ROLES GET INTO THE TOKEN
 * ─────────────────────────────
 * Auth0 doesn't put roles in tokens by default. You need an Action:
 *
 *  1. Auth0 Dashboard → Actions → Library → Create Action (Login / Post Login)
 *  2. Paste this code:
 *
 *     exports.onExecutePostLogin = async (event, api) => {
 *       const ns = 'https://wheezyleague.run/'
 *       const roles = event.authorization?.roles ?? []
 *       const org   = event.organization?.name  ?? null
 *       api.idToken.setCustomClaim(`${ns}roles`, roles)
 *       api.idToken.setCustomClaim(`${ns}org`,   org)
 *       api.accessToken.setCustomClaim(`${ns}roles`, roles)
 *       api.accessToken.setCustomClaim(`${ns}org`,   org)
 *     }
 *
 *  3. Deploy the action and attach it to the Login flow.
 *
 * After that, decoded tokens will contain:
 *   user['https://wheezyleague.run/roles'] = ['WheezyLeague-Member']
 *   user['https://wheezyleague.run/org']   = 'my-run-club'
 */

import { useAuth0 } from '@auth0/auth0-react'

const CLAIM_NS   = 'https://wheezyleague.run/'
const ROLE_CLAIM = `${CLAIM_NS}roles`
const ORG_CLAIM  = `${CLAIM_NS}org`

/** The role name assigned in Auth0 to full members */
export const MEMBER_ROLE = 'WheezyLeague-Member'

export default function useAuth() {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0()

  /** Roles array from custom claim, e.g. ['WheezyLeague-Member'] */
  const roles = (user?.[ROLE_CLAIM] ?? [])

  /** Organization name from custom claim, e.g. 'boston-run-club' */
  const org   = user?.[ORG_CLAIM] ?? null

  /** True if the user has the WheezyLeague-Member role OR belongs to an org */
  const isMember = roles.includes(MEMBER_ROLE) || !!org

  /** Check for a specific role */
  const hasRole = (role) => roles.includes(role)

  /** Check for any of the given roles */
  const hasAnyRole = (...roleList) => roleList.some(r => roles.includes(r))

  const login  = (opts = {}) => loginWithRedirect(opts)
  const signup = () => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })
  const signout= () => logout({ logoutParams: { returnTo: window.location.origin } })

  /** Get a fresh access token (attach as Bearer for API calls) */
  const getToken = () => getAccessTokenSilently({
    authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE }
  })

  return {
    user,
    isAuthenticated,
    isLoading,
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
