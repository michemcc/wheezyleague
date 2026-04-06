import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

const DemoContext = createContext(null)

const INITIAL_NOTIFICATIONS = [
  { id: 1, icon: '🏆', title: 'Challenge Update', body: "Wheeze to Ease 5K — you're 62% done! 14 days left.", time: '2m ago',  read: false },
  { id: 2, icon: '👥', title: 'New Reply',        body: 'Marcus T. replied to your post about cold-weather runs.', time: '18m ago', read: false },
  { id: 3, icon: '🌬️', title: 'AQI Alert',        body: 'Boston AQI is 42 — great conditions for your run today!', time: '1h ago',  read: false },
  { id: 4, icon: '🔥', title: 'Streak Milestone', body: "You're on a 23-day streak! Keep it up 💪",              time: '3h ago',  read: true  },
  { id: 5, icon: '🤝', title: 'Buddy Request',    body: 'Leila H. wants to be your running buddy.',               time: '5h ago',  read: true  },
  { id: 6, icon: '🎉', title: 'New Badge',        body: 'You earned the "Sunrise Runner" badge!',                 time: '1d ago',  read: true  },
]

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

// Inner provider that has access to Auth0 hooks
function DemoProviderInner({ children }) {
  const { isAuthenticated, getAccessTokenSilently, user } = useAuth0()

  const envMode = import.meta.env.VITE_DATA_MODE === 'demo'
  const [isDemo,        setIsDemo]        = useState(envMode)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [liveProfile,   setLiveProfile]   = useState(null)
  const [darkMode,      setDarkMode]      = useState(() => {
    try {
      const stored = localStorage.getItem('sw-dark')
      return stored === null ? false : stored === 'true'
    } catch { return false }
  })
  const [avatarUrl, setAvatarUrl] = useState(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    try { localStorage.setItem('sw-dark', String(darkMode)) } catch {}
  }, [darkMode])

  // Fetch live data whenever auth state or demo mode changes
  useEffect(() => {
    if (isDemo || !isAuthenticated) {
      setNotifications(INITIAL_NOTIFICATIONS)
      setLiveProfile(null)
      return
    }

    let cancelled = false

    const fetchLiveData = async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
        })
        if (cancelled) return

        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }

        // Fetch notifications
        const nRes = await fetch(`${API_BASE}/notifications`, { headers })
        if (!cancelled && nRes.ok) {
          const data = await nRes.json()
          if (Array.isArray(data) && data.length > 0) setNotifications(data)
        }

        // Fetch profile for real XP/level
        if (user?.sub) {
          const pRes = await fetch(
            `${API_BASE}/users/${encodeURIComponent(user.sub)}/profile`,
            { headers }
          )
          if (!cancelled && pRes.ok) {
            const data = await pRes.json()
            if (data) setLiveProfile(data)
          }
        }
      } catch (err) {
        // Token not available yet or network error — stay on demo data
        console.debug('[DemoContext] live fetch skipped:', err?.message)
      }
    }

    fetchLiveData()
    return () => { cancelled = true }
  }, [isDemo, isAuthenticated, user?.sub, getAccessTokenSilently])

  const toggleDemo = useCallback(() => setIsDemo(d => !d), [])
  const toggleDark = useCallback(() => setDarkMode(d => !d), [])
  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = useCallback(async () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
    if (!isDemo && isAuthenticated) {
      try {
        const token = await getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } })
        fetch(`${API_BASE}/notifications/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }).catch(() => {})
      } catch {}
    }
  }, [isDemo, isAuthenticated, getAccessTokenSilently])

  const markRead = useCallback(async (id) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
    if (!isDemo && isAuthenticated) {
      try {
        const token = await getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } })
        fetch(`${API_BASE}/notifications/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [id] }),
        }).catch(() => {})
      } catch {}
    }
  }, [isDemo, isAuthenticated, getAccessTokenSilently])

  return (
    <DemoContext.Provider value={{
      isDemo, toggleDemo,
      notifications, unreadCount, markAllRead, markRead,
      darkMode, toggleDark,
      avatarUrl, setAvatarUrl,
      liveProfile,
    }}>
      {children}
    </DemoContext.Provider>
  )
}

// Outer wrapper — Auth0Provider must be an ancestor for useAuth0 to work
export function DemoProvider({ children }) {
  return <DemoProviderInner>{children}</DemoProviderInner>
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>')
  return ctx
}
