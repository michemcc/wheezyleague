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

export function DemoProvider({ children }) {
  const envMode = (import.meta.env.VITE_DATA_MODE ?? 'demo') === 'demo'
  const [isDemo,         setIsDemo]         = useState(envMode)
  const [notifications,  setNotifications]  = useState(INITIAL_NOTIFICATIONS)
  const [darkMode,       setDarkMode]        = useState(() => {
    try { return localStorage.getItem('sw-dark') === 'true' } catch { return false }
  })
  // Shared avatar URL — set by ProfilePage when user uploads a photo,
  // read by Navbar so the topbar chip updates immediately
  const [avatarUrl, setAvatarUrl] = useState(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    try { localStorage.setItem('sw-dark', String(darkMode)) } catch {}
  }, [darkMode])

  const toggleDemo   = useCallback(() => setIsDemo(d => !d), [])
  const toggleDark   = useCallback(() => setDarkMode(d => !d), [])
  const unreadCount  = notifications.filter(n => !n.read).length
  const markAllRead  = useCallback(() => setNotifications(ns => ns.map(n => ({ ...n, read: true }))), [])
  const markRead     = useCallback(id  => setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n)), [])

  return (
    <DemoContext.Provider value={{
      isDemo, toggleDemo,
      notifications, unreadCount, markAllRead, markRead,
      darkMode, toggleDark,
      avatarUrl, setAvatarUrl,
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
