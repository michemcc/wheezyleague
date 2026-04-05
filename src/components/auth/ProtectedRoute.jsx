import React, { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import useAuth, { MEMBER_ROLE } from '../../hooks/useAuth'
import { useDemo } from '../../context/DemoContext'
import LoadingSpinner from '../ui/LoadingSpinner'
import AccessDenied from './AccessDenied'

/**
 * ProtectedRoute — guards a route behind:
 *   1. Authentication (must be logged in via Auth0)
 *   2. Optionally: role membership (requireRole prop)
 *
 * Props:
 *   children    — the page to render when access is granted
 *   requireRole — (optional) role string the user must have.
 *                 Defaults to MEMBER_ROLE ('WheezyLeague-Member').
 *                 Pass requireRole={null} to skip role check (auth only).
 *
 * Examples:
 *   <ProtectedRoute>                          — requires login + WheezyLeague-Member role
 *   <ProtectedRoute requireRole={null}>       — requires login only
 *   <ProtectedRoute requireRole="admin">      — requires login + admin role
 */
export default function ProtectedRoute({ children, requireRole = MEMBER_ROLE }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  const { isMember, hasRole, roles } = useAuth()
  const { isDemo } = useDemo()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: window.location.pathname } })
    }
  }, [isAuthenticated, isLoading, loginWithRedirect])

  if (isLoading) return <LoadingSpinner fullscreen />
  if (!isAuthenticated) return null

  // Role check — skip if requireRole is explicitly null
  // In demo mode, skip role checks so you can develop without configuring Auth0 roles
  if (!isDemo && requireRole !== null) {
    const hasAccess = requireRole === MEMBER_ROLE ? isMember : hasRole(requireRole)
    if (!hasAccess) {
      return <AccessDenied roles={roles} requiredRole={requireRole} />
    }
  }

  return children
}
