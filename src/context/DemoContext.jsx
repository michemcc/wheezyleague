import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

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

export function DemoProvider({ children }) {
  // Default to live mode. Set VITE_DATA_MODE=demo in .env.local to default to demo.
  const envMode = import.meta.env.VITE_DATA_MODE === 'demo'
  const [isDemo,        setIsDemo]        = useState(envMode)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [liveProfile,   setLiveProfile]   = useState(null)  // real XP/level from API
  const [darkMode, setDarkMode] = useState(() => {
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

  // Fetch real notifications + profile from API in live mode
  // This runs whenever isDemo changes so switching modes refreshes data
  useEffect(() => {
    if (isDemo) {
      setNotifications(INITIAL_NOTIFICATIONS)
      setLiveProfile(null)
      return
    }
    // Read the stored Auth0 token from localstorage (set by cacheLocation="localstorage")
    const getStoredToken = () => {
      try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('@@auth0spajs@@'))
        for (const k of keys) {
          const data = JSON.parse(localStorage.getItem(k))
          const token = data?.body?.access_token || data?.body?.id_token
          if (token) return token
        }
      } catch {}
      return null
    }

    const token = getStoredToken()
    if (!token) return  // not logged in yet

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    // Fetch notifications
    fetch(`${API_BASE}/notifications`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data) && data.length) setNotifications(data) })
      .catch(() => {})

    // Fetch profile for XP/level
    const userId = (() => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))
        return payload.sub
      } catch { return null }
    })()
    if (userId) {
      fetch(`${API_BASE}/users/${encodeURIComponent(userId)}/profile`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setLiveProfile(data) })
        .catch(() => {})
    }
  }, [isDemo])

  const toggleDemo  = useCallback(() => setIsDemo(d => !d), [])
  const toggleDark  = useCallback(() => setDarkMode(d => !d), [])
  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = useCallback(async () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
    if (!isDemo) {
      const token = (() => { try { const k = Object.keys(localStorage).find(k=>k.startsWith('@@auth0spajs@@')); return k ? JSON.parse(localStorage.getItem(k))?.body?.access_token : null } catch { return null } })()
      if (token) fetch(`${API_BASE}/notifications/read`, { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({}) }).catch(()=>{})
    }
  }, [isDemo])

  const markRead = useCallback(async (id) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
    if (!isDemo) {
      const token = (() => { try { const k = Object.keys(localStorage).find(k=>k.startsWith('@@auth0spajs@@')); return k ? JSON.parse(localStorage.getItem(k))?.body?.access_token : null } catch { return null } })()
      if (token) fetch(`${API_BASE}/notifications/read`, { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ ids:[id] }) }).catch(()=>{})
    }
  }, [isDemo])

  return (
    <DemoContext.Provider value={{
      isDemo, toggleDemo,
      notifications, unreadCount, markAllRead, markRead,
      darkMode, toggleDark,
      avatarUrl, setAvatarUrl,
      liveProfile,   // real XP/level — null in demo mode
    }}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>')
  return ctx
}
