/**
 * useAqi — fetches live AQI for a given location string
 *
 * Returns { aqi, label, icon, color, safe, pm25, pm10, location, loading, error }
 *
 * Data comes from Open-Meteo (free, no API key) via our backend proxy.
 * Results are cached 30 min server-side so we don't hammer the API.
 */
import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

const API = import.meta.env.VITE_API_BASE_URL ?? '/api'

export default function useAqi(locationString) {
  const { getAccessTokenSilently } = useAuth0()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!locationString?.trim()) return
    let cancelled = false
    setLoading(true)
    setError(null)

    const fetch_ = async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
        }).catch(() => null)

        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch(
          `${API}/aqi?location=${encodeURIComponent(locationString.trim())}`,
          { headers }
        )
        if (!res.ok) throw new Error(`AQI ${res.status}`)
        const d = await res.json()
        if (!cancelled) setData(d)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch_()
    return () => { cancelled = true }
  }, [locationString, getAccessTokenSilently])

  return { ...data, loading, error }
}
