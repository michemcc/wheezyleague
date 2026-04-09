import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '../components/ui/LoadingSpinner'

/**
 * StravaCallbackPage — minimal, no Auth0 calls here.
 *
 * Strava redirects here with ?code=xxx after the user authorises.
 * We immediately stash the code in sessionStorage and redirect to
 * /dashboard?openStrava=1 — where the user IS already authenticated
 * and can exchange the code safely.
 *
 * This avoids all Auth0 timing issues on the callback URL.
 */
export default function StravaCallbackPage() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code  = searchParams.get('code')
    const error = searchParams.get('error')

    if (error || !code) {
      // Bad callback — go straight to dashboard, modal will show not-connected state
      window.location.replace('/dashboard')
      return
    }

    // Stash the code — DashboardPage picks this up and exchanges it
    sessionStorage.setItem('strava_pending_code', code)

    // Go to dashboard with flag to open Strava modal
    window.location.replace('/dashboard?openStrava=1')
  }, [])

  // Just a full-screen spinner while the redirect fires (< 50ms)
  return <LoadingSpinner fullscreen />
}
