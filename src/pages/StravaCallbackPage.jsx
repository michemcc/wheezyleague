import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const API = import.meta.env.VITE_API_BASE_URL ?? '/api'

/**
 * StravaCallbackPage
 *
 * Strava redirects here after the user authorises (or denies) the app.
 * URL will contain:  ?code=xxx&scope=read,activity:read_all&state=strava
 * On error:          ?error=access_denied
 *
 * This page exchanges the code for tokens via the backend, then
 * redirects to /dashboard.
 */
export default function StravaCallbackPage() {
  const [searchParams] = useSearchParams()
  const { getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()

  const [status, setStatus] = useState('connecting') // connecting | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const code  = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      setMessage(error === 'access_denied'
        ? 'You cancelled the Strava connection. You can try again from the Log Run modal.'
        : `Strava returned an error: ${error}`)
      setTimeout(() => navigate('/dashboard', { replace: true }), 3500)
      return
    }

    if (!code) {
      setStatus('error')
      setMessage('No authorisation code received from Strava.')
      setTimeout(() => navigate('/dashboard', { replace: true }), 3000)
      return
    }

    // Exchange code for tokens via backend
    const exchange = async () => {
      try {
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
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error || `Server error ${res.status}`)
        }

        const data = await res.json()
        setStatus('success')
        setMessage(`Connected as ${data.athlete?.firstname || 'Strava user'}! Syncing your runs…`)
        setTimeout(() => navigate('/dashboard', { replace: true }), 2000)
      } catch (err) {
        setStatus('error')
        setMessage(err.message || 'Failed to connect Strava. Please try again.')
        setTimeout(() => navigate('/dashboard', { replace: true }), 4000)
      }
    }

    exchange()
  }, []) // eslint-disable-line

  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '1.25rem', padding: '2rem',
      textAlign: 'center',
    }}>
      {status === 'connecting' && (
        <>
          <LoadingSpinner />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-3)', letterSpacing: '0.06em' }}>
            CONNECTING STRAVA…
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{ fontSize: '2.5rem' }}>🟠</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Strava Connected
          </p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-3)' }}>{message}</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Connection Failed
          </p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-3)', maxWidth: '400px' }}>{message}</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-4)' }}>
            Redirecting you back…
          </p>
        </>
      )}
    </div>
  )
}
