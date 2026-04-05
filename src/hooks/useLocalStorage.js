/**
 * useLocalStorage — synced state backed by localStorage
 *
 * Usage:
 *   const [theme, setTheme] = useLocalStorage('theme', 'light')
 */
import { useState } from 'react'

export default function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`useLocalStorage error for key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}
