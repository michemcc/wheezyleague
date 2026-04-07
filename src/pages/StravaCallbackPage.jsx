import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const API = import.meta.env.VITE_API_BASE_URL ?? '/api'

/**
 * StravaCallbackPage
 *
 * Strava sends the user here after OAuth with ?code=xxx
 * We exchange the code for tokens via our backend, then redirect to /dashboard.
 *
 * Key challenge: this is a public route but we need an Auth0 access token.
 * Auth0 re-hydrates from localStorage (cacheLocation="localstorage") on load,
 * but it's async. We wait up to 8 seconds for isLoading to settle, then act.
 */
export default function StravaCallbackPage() {
  const [searchParams] = useSearchParams()
  const { getAccessTokenSilently, isLoading, isAuthenticated, loginWithRedirect } = useAuth0()
  const navigate = useNavigate()
  const [status,  setStatus]  = useState('connecting')
  const [message, setMessage] = useState('')
  const hasRun = useRef(false)  // prevent double-execution in StrictMode

  useEffect(() => {
    // Wait for Auth0 to finish loading
    if (isLoading) return
    // Only run once
    if (hasRun.current) return
    hasRun.current = true

    const code  = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      setMessage(error === 'access_denied'
        ? 'You cancelled the Strava connection.'
        : `Strava error: ${error}`)
      setTimeout(() => navigate('/dashboard', { replace: true }), 3000)
      return
    }

    if (!code) {
      setStatus('error')
      setMessage('No authorisation code received from Strava.')
      setTimeout(() => navigate('/dashboard', { replace: true }), 3000)
      return
    }

    if (!isAuthenticated) {
      // Not logged in — send through Auth0 then come back here
      loginWithRedirect({
        appState: { returnTo: window.location.pathname + window.location.search }
      })
      return
    }

    const exchange = async () => {
      try {
        // Get fresh access token — works because cacheLocation="localstorage"
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
        })

        const res = await fetch(`${API}/strava/connect`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        })

        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d?.error || `Server error ${res.status}`)
        }

        const data = await res.json()
        setStatus('success')
        setMessage(`Connected as ${data.athlete?.firstname || 'Strava user'}! Redirecting…`)
        setTimeout(() => navigate('/dashboard', { replace: true }), 1800)
      } catch (err) {
        setStatus('error')
        setMessage(err.message || 'Connection failed. Please try again from the Log Run modal.')
        setTimeout(() => navigate('/dashboard', { replace: true }), 4000)
      }
    }

    exchange()
  }, [isLoading, isAuthenticated])   // re-runs when auth settles

  return (
    <div style={{
      minHeight: '72vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '1rem', textAlign: 'center', padding: '2rem',
    }}>
      {status === 'connecting' && (
        <>
          <LoadingSpinner />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '.78rem', color: 'var(--text-3)', letterSpacing: '.1em' }}>
            CONNECTING TO STRAVA…
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>🟠</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Strava Connected
          </p>
          <p style={{ color: 'var(--text-3)', fontSize: '.88rem' }}>{message}</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{ fontSize: '2rem', lineHeight: 1 }}>⚠️</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Connection Failed
          </p>
          <p style={{ color: 'var(--text-3)', fontSize: '.85rem', maxWidth: '360px', lineHeight: 1.6 }}>{message}</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '.68rem', color: 'var(--text-4)' }}>
            Redirecting to dashboard…
          </p>
        </>
      )}
    </div>
  )
}
