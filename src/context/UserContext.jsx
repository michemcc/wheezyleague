/**
 * UserContext — global user preferences and run stats
 * Wrap your app (or just the authenticated portion) with <UserProvider>.
 *
 * Usage:
 *   const { prefs, updatePrefs, stats } = useUser()
 */
import React, { createContext, useContext, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const { user } = useAuth0()

  const [prefs, setPrefs] = useState({
    distanceUnit: 'mi',       // 'mi' | 'km'
    city: '',
    notifyAqi: true,
    notifyChallenges: true,
  })

  // Stub stats — replace with real API calls when backend is ready
  const [stats] = useState({
    weeklyMiles: 18.4,
    totalMiles: 312,
    streak: 23,
    points: 1550,
  })

  const updatePrefs = (updates) =>
    setPrefs((prev) => ({ ...prev, ...updates }))

  return (
    <UserContext.Provider value={{ user, prefs, updatePrefs, stats }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}
