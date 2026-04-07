import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const API = import.meta.env.VITE_API_BASE_URL ?? '/api'

export default function StravaCallbackPage() {
  const [searchParams] = useSearchParams()
  const { getAccessTokenSilently, isLoading, isAuthenticated } = useAuth0()
  const navigate = useNavigate()
  const [status,  setStatus]  = useState('connecting')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Wait for Auth0 to finish initialising before calling getAccessTokenSilently
    if (isLoading) return

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
      // Not logged in — send them to login, then back here
      navigate(`/callback?returnTo=${encodeURIComponent(window.location.href)}`, { replace: true })
      return
    }

    const exchange = async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
        })
        const res = await fetch(`${API}/strava/connect`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d?.error || `Server error ${res.status}`)
        }
        const data = await res.json()
        setStatus('success')
        setMessage(`Connected as ${data.athlete?.firstname || 'Strava user'}!`)
        setTimeout(() => navigate('/dashboard', { replace: true }), 2000)
      } catch (err) {
        setStatus('error')
        setMessage(err.message || 'Failed to connect. Please try again.')
        setTimeout(() => navigate('/dashboard', { replace: true }), 4000)
      }
    }

    exchange()
  }, [isLoading, isAuthenticated]) // re-run once auth is ready

  return (
    <div style={{
      minHeight:'70vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:'1rem', textAlign:'center', padding:'2rem',
    }}>
      {status === 'connecting' && (
        <>
          <LoadingSpinner />
          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', color:'var(--text-3)', letterSpacing:'0.1em' }}>
            CONNECTING TO STRAVA…
          </p>
        </>
      )}
      {status === 'success' && (
        <>
          <div style={{ fontSize:'2.5rem' }}>🟠</div>
          <p style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', fontWeight:700, color:'var(--text-1)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
            Strava Connected
          </p>
          <p style={{ color:'var(--text-3)', fontSize:'0.88rem' }}>{message}</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div style={{ fontSize:'2rem' }}>⚠️</div>
          <p style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:700, color:'var(--text-1)', textTransform:'uppercase' }}>Connection Failed</p>
          <p style={{ color:'var(--text-3)', fontSize:'0.85rem', maxWidth:'360px' }}>{message}</p>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.7rem', color:'var(--text-4)' }}>Redirecting…</p>
        </>
      )}
    </div>
  )
}
