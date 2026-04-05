import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop — silently scrolls window to 0,0 on every route change.
 * Drop this inside <Layout> (or inside <Routes>) and it just works.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  return null
}
