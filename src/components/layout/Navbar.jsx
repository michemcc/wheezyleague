import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useDemo } from '../../context/DemoContext'
import useAuth from '../../hooks/useAuth'
import { DEMO_PROFILE } from '../../data/profile'
import './Navbar.css'

const NAV_LINKS = [
  { to: '/dashboard',  label: 'Dashboard',  icon: '📊' },
  { to: '/community',  label: 'Community',  icon: '👥' },
  { to: '/challenges', label: 'Challenges', icon: '🏆' },
  { to: '/routes',     label: 'Routes',     icon: '🗺️' },
  { to: '/incentives', label: 'Rewards',    icon: '🎁' },
]

export default function Navbar() {
  const { isAuthenticated, user, loginWithRedirect, logout, isLoading } = useAuth0()
  const { isDemo, toggleDemo, notifications, unreadCount, markAllRead, markRead, darkMode, toggleDark, avatarUrl, liveProfile } = useDemo()
  const { hasRole } = useAuth()

  const [userOpen,   setUserOpen]   = useState(false)
  const [bellOpen,   setBellOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)
  // Positions for fixed-positioned panels
  const [bellPos, setBellPos] = useState({ top: 0, right: 0 })
  const [userPos, setUserPos] = useState({ top: 0, right: 0 })

  const userRef = useRef(null)
  const bellRef = useRef(null)
  const location = useLocation()

  useEffect(() => { setUserOpen(false); setBellOpen(false); setMobileOpen(false) }, [location.pathname])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (!userOpen && !bellOpen) return
    const h = e => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [userOpen, bellOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const isActive = to => location.pathname === to
  const profile  = (!isDemo && liveProfile) ? liveProfile : DEMO_PROFILE
  const firstName = user?.given_name || user?.name?.split(' ')[0] || 'Runner'

  const openBell = () => {
    const rect = bellRef.current?.getBoundingClientRect()
    if (rect) setBellPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    setBellOpen(o => !o)
    setUserOpen(false)
  }

  const openUser = () => {
    const rect = userRef.current?.getBoundingClientRect()
    if (rect) setUserPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    setUserOpen(o => !o)
    setBellOpen(false)
  }

  return (
    <div className="nav-stack">

      {/* ── Demo Banner ── */}
      <div className={`demo-banner-bar${isDemo ? ' demo-banner-bar--demo' : ' demo-banner-bar--live'}`}>
        <span className="demo-banner-dot" aria-hidden="true" />
        <span className="demo-banner-text">{isDemo ? 'Demo Mode' : 'Live Mode'}</span>
        <button className="demo-toggle-btn" onClick={toggleDemo} aria-label="Toggle demo/live mode">
          <span className={`demo-knob${isDemo ? '' : ' demo-knob--live'}`} />
        </button>
        <span className="demo-banner-hint">{isDemo ? 'Mock data' : 'Real backend'}</span>
      </div>

      {/* ── Navbar ── */}
      <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <div className="navbar-inner">

          <Link to="/" className="navbar-logo">
            <span className="logo-mark">WL</span>
            <span className="logo-name" data-league="League">Wheezy</span>
          </Link>

          {isAuthenticated && (
            <nav className="navbar-links" aria-label="Main navigation">
              {NAV_LINKS.map(({ to, label, icon }) => (
                <Link key={to} to={to} className={`nav-link${isActive(to) ? ' nav-link--active' : ''}`}>
                  <span aria-hidden="true">{icon}</span>
                  <span className="nav-link-label">{label}</span>
                </Link>
              ))}
            </nav>
          )}

          <div className="navbar-actions">
            {isLoading ? (
              <div className="nav-spinner" aria-label="Loading" />
            ) : isAuthenticated ? (
              <>
                {/* XP pill */}
                <div className="nav-xp-pill" aria-label={`Level ${profile.level}`}>
                  <span className="nav-xp-lv">LV.{profile.level}</span>
                  <div className="nav-xp-track"><div className="nav-xp-fill" style={{ width: `${(profile.xp / profile.xpToNext) * 100}%` }} /></div>
                </div>

                {/* Bell — single clean onClick */}
                <div className="bell-wrap" ref={bellRef}>
                  <button className="icon-btn" onClick={openBell}
                    aria-label={`Notifications${unreadCount ? ` — ${unreadCount} unread` : ''}`}
                    aria-expanded={bellOpen}>
                    🔔
                    {unreadCount > 0 && <span className="icon-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </button>

                  {bellOpen && (
                    <div className="floating-panel bell-panel" role="dialog" aria-label="Notifications"
                      style={{ top: bellPos.top, right: bellPos.right }}>
                      <div className="panel-header">
                        <span className="panel-title">Notifications</span>
                        {unreadCount > 0 && <button className="panel-action" onClick={markAllRead}>Clear all</button>}
                      </div>
                      <div className="notif-list">
                        {notifications.map(n => (
                          <button key={n.id} className={`notif-row${n.read ? ' notif-row--read' : ''}`} onClick={() => markRead(n.id)}>
                            <span className="notif-icon-wrap">{n.icon}</span>
                            <div className="notif-content">
                              <p className="notif-title">{n.title}</p>
                              <p className="notif-body">{n.body}</p>
                              <p className="notif-time">{n.time}</p>
                            </div>
                            {!n.read && <span className="unread-dot" aria-label="Unread" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User chip — single clean onClick */}
                <div className="user-menu-wrap" ref={userRef}>
                  <button className="user-chip" onClick={openUser}
                    aria-expanded={userOpen} aria-haspopup="true">
                    <div className="chip-avatar">
                      {(avatarUrl || user?.picture)
                        ? <img src={avatarUrl || user.picture} alt={user.name} />
                        : <span>{firstName[0]}</span>}
                    </div>
                    <span className="chip-name">{firstName}</span>
                    <span className={`chip-chevron${userOpen ? ' chip-chevron--open' : ''}`}>▾</span>
                  </button>

                  {userOpen && (
                    <div className="floating-panel user-panel" role="menu"
                      style={{ top: userPos.top, right: userPos.right }}>
                      <div className="user-panel-header">
                        <div className="chip-avatar chip-avatar--lg">
                          {(avatarUrl || user?.picture) ? <img src={avatarUrl || user.picture} alt={user.name} /> : <span>{firstName[0]}</span>}
                        </div>
                        <div className="upanel-info">
                          <p className="upanel-name">{user?.name || profile.name}</p>
                          <p className="upanel-email">{user?.email || profile.email}</p>
                        </div>
                      </div>
                      <div className="upanel-xp">
                        <div className="xp-label-row"><span>LV.{profile.level}</span><span>{profile.xp} / {profile.xpToNext} XP</span></div>
                        <div className="xp-track"><div className="xp-fill" style={{ width: `${(profile.xp / profile.xpToNext) * 100}%` }} /></div>
                      </div>
                      <div className="panel-divider" />
                      <Link to="/profile"    className="panel-item" onClick={() => setUserOpen(false)}>👤 My Profile</Link>
                      <Link to="/dashboard"  className="panel-item" onClick={() => setUserOpen(false)}>📊 Dashboard</Link>
                      <Link to="/challenges" className="panel-item" onClick={() => setUserOpen(false)}>🏆 Challenges</Link>
                      {hasRole('admin') && <Link to="/admin" className="panel-item" style={{ color: 'var(--neon-orange)' }} onClick={() => setUserOpen(false)}>⚙️ Admin Panel</Link>}
                      <div className="panel-divider" />
                      <div className="panel-item panel-item--toggle">
                        <span>{darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
                        <button className="mode-toggle-btn" onClick={toggleDark} aria-label="Toggle dark mode">
                          <span className={`mode-knob${darkMode ? ' mode-knob--dark' : ''}`} />
                        </button>
                      </div>
                      <div className="panel-divider" />
                      <div className="panel-item panel-item--version">
                        <span>The Wheezy League</span><span className="version-tag">v2026.6.0</span>
                      </div>
                      <div className="panel-divider" />
                      <button className="panel-item panel-item--danger"
                        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
                        🚪 Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="auth-btns">
                <button className="btn btn-ghost btn-sm" onClick={() => loginWithRedirect()}>Log In</button>
                <button className="btn btn-primary btn-sm" onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}>Join Free</button>
              </div>
            )}

            <button
              className={`hamburger${mobileOpen ? ' hamburger--open' : ''}`}
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      <div className={`mobile-backdrop${mobileOpen ? ' mobile-backdrop--visible' : ''}`}
        onClick={() => setMobileOpen(false)} aria-hidden="true" />

      <div className={`mobile-drawer${mobileOpen ? ' mobile-drawer--open' : ''}`}
        role="dialog" aria-label="Navigation menu" aria-modal="true" aria-hidden={!mobileOpen}>

        <div className="drawer-header">
          <div className="drawer-logo">
            <span className="logo-mark" style={{ fontSize: '0.65rem', padding: '0.18rem 0.4rem' }}>WL</span>
            <span>WheezyLeague</span>
          </div>
          <button className="drawer-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">✕</button>
        </div>

        {isAuthenticated && (
          <div className="drawer-user-card">
            <div className="chip-avatar chip-avatar--lg">
              {(avatarUrl || user?.picture) ? <img src={avatarUrl || user.picture} alt={user.name} /> : <span>{firstName[0]}</span>}
            </div>
            <div className="drawer-user-info">
              <p className="drawer-user-name">{user?.name || profile.name}</p>
              <p className="drawer-user-email">{user?.email || profile.email}</p>
              <div className="level-badge" style={{ marginTop: '0.35rem', fontSize: '0.66rem' }}>LV.{profile.level} · {profile.xp} XP</div>
            </div>
          </div>
        )}

        <div className="drawer-scroll">
          {isAuthenticated && (
            <nav className="drawer-nav">
              {NAV_LINKS.map(({ to, label, icon }) => (
                <Link key={to} to={to} className={`drawer-link${isActive(to) ? ' drawer-link--active' : ''}`}>
                  <span className="drawer-link-icon">{icon}</span>
                  <span>{label}</span>
                  {isActive(to) && <span className="drawer-link-pip" aria-hidden="true" />}
                </Link>
              ))}
              {hasRole('admin') && <Link to="/admin" className={`drawer-link${isActive('/admin') ? ' drawer-link--active' : ''}`}><span className="drawer-link-icon">⚙️</span><span>Admin</span></Link>}
              <Link to="/profile" className={`drawer-link${isActive('/profile') ? ' drawer-link--active' : ''}`}>
                <span className="drawer-link-icon">👤</span><span>Profile</span>
              </Link>
            </nav>
          )}

          <div className="drawer-divider" />

          <nav className="drawer-secondary">
            <Link to="/about"   className="drawer-link-sm"><span>ℹ️</span>About</Link>
            <Link to="/contact" className="drawer-link-sm"><span>✉️</span>Contact</Link>
          </nav>

          <div className="drawer-divider" />

          <div className="drawer-toggles">
            <div className="drawer-toggle-row">
              <span>{darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
              <button className="mode-toggle-btn" onClick={toggleDark} aria-label="Toggle dark mode">
                <span className={`mode-knob${darkMode ? ' mode-knob--dark' : ''}`} />
              </button>
            </div>
            <div className="drawer-toggle-row">
              <span>{isDemo ? '🎮 Demo' : '🔌 Live'}</span>
              <button className="demo-toggle-btn" onClick={toggleDemo} aria-label="Toggle demo mode">
                <span className={`demo-knob${isDemo ? '' : ' demo-knob--live'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          {isAuthenticated ? (
            <button className="btn btn-outline btn-sm" style={{ width: '100%' }}
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Sign Out</button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => loginWithRedirect()}>Log In</button>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}>Join Free</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
