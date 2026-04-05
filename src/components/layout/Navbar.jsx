import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useDemo } from '../../context/DemoContext'
import { DEMO_PROFILE } from '../../data/profile'
import './Navbar.css'

const APP_VERSION = '2026.4.0'

const NAV_LINKS = [
  { to: '/dashboard',  label: 'Dashboard',  icon: '📊' },
  { to: '/community',  label: 'Community',  icon: '👥' },
  { to: '/challenges', label: 'Challenges', icon: '🏆' },
  { to: '/breathzone', label: 'BreathZone', icon: '🫁' },
  { to: '/routes',     label: 'Routes',     icon: '🗺️' },
  { to: '/incentives', label: 'Rewards',    icon: '🎁' },
]

export default function Navbar() {
  const { isAuthenticated, user, loginWithRedirect, logout, isLoading } = useAuth0()
  const { isDemo, toggleDemo, notifications, unreadCount, markAllRead, markRead, darkMode, toggleDark, avatarUrl } = useDemo()

  const [userOpen,   setUserOpen]   = useState(false)
  const [bellOpen,   setBellOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)

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
    if (!userOpen) return
    const h = e => { if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [userOpen])

  useEffect(() => {
    if (!bellOpen) return
    const h = e => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [bellOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const isActive = to => location.pathname === to
  const profile  = DEMO_PROFILE
  const firstName = user?.given_name || user?.name?.split(' ')[0] || 'Runner'

  return (
    <div className="nav-stack">

      {/* ══ DEMO BANNER ══════════════════════════════════ */}
      <div className={`demo-banner-bar${isDemo ? ' demo-banner-bar--demo' : ' demo-banner-bar--live'}`}>
        <span className="demo-banner-dot" aria-hidden="true" />
        <span className="demo-banner-text">{isDemo ? 'Demo Mode' : 'Live Mode'}</span>
        <button className="demo-toggle-btn" onClick={toggleDemo} aria-label="Toggle demo/live mode">
          <span className={`demo-knob${isDemo ? '' : ' demo-knob--live'}`} />
        </button>
        <span className="demo-banner-hint">{isDemo ? 'Using mock data' : 'Connected to backend'}</span>
      </div>

      {/* ══ NAVBAR ═══════════════════════════════════════ */}
      <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <div className="navbar-inner">

          {/* Logo — always visible, never shrinks */}
          <Link to="/" className="navbar-logo">
            <span className="logo-mark" aria-hidden="true">WL</span>
            <span className="logo-name">Wheezy<span className="logo-accent">League</span></span>
          </Link>

          {/* Desktop nav — hidden on mobile */}
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

          {/* Right actions — always visible */}
          <div className="navbar-actions">
            {isLoading ? (
              <div className="nav-spinner" aria-label="Loading" />
            ) : isAuthenticated ? (
              <>
                {/* XP pill — desktop only */}
                <div className="nav-xp-pill" aria-label={`Level ${profile.level}`}>
                  <span className="nav-xp-lv">Lv.{profile.level}</span>
                  <div className="nav-xp-track">
                    <div className="nav-xp-fill" style={{ width: `${(profile.xp / profile.xpToNext) * 100}%` }} />
                  </div>
                </div>

                {/* Bell */}
                <div className="bell-wrap" ref={bellRef}>
                  <button className="icon-btn" onClick={() => { setBellOpen(o => !o); setUserOpen(false) }}
                    aria-label={`Notifications${unreadCount ? ` — ${unreadCount} unread` : ''}`}>
                    🔔
                    {unreadCount > 0 && <span className="icon-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </button>
                  {bellOpen && (
                    <div className="floating-panel bell-panel" role="dialog" aria-label="Notifications">
                      <div className="panel-header">
                        <span className="panel-title">Notifications</span>
                        {unreadCount > 0 && <button className="panel-action" onClick={markAllRead}>Mark all read</button>}
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

                {/* User menu */}
                <div className="user-menu-wrap" ref={userRef}>
                  <button className="user-chip" onClick={() => { setUserOpen(o => !o); setBellOpen(false) }}
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
                    <div className="floating-panel user-panel" role="menu">
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
                        <div className="xp-label-row">
                          <span>Level {profile.level}</span>
                          <span>{profile.xp} / {profile.xpToNext} XP</span>
                        </div>
                        <div className="xp-track"><div className="xp-fill" style={{ width: `${(profile.xp / profile.xpToNext) * 100}%` }} /></div>
                      </div>
                      <div className="panel-divider" />
                      <Link to="/profile"    className="panel-item" onClick={() => setUserOpen(false)}>👤 My Profile</Link>
                      <Link to="/dashboard"  className="panel-item" onClick={() => setUserOpen(false)}>📊 Dashboard</Link>
                      <Link to="/breathzone" className="panel-item" onClick={() => setUserOpen(false)}>🫁 BreathZone</Link>
                      <div className="panel-divider" />
                      {/* Dark mode toggle */}
                      <div className="panel-item panel-item--toggle">
                        <span>{darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
                        <button className="mode-toggle-btn" onClick={toggleDark} aria-label="Toggle dark mode">
                          <span className={`mode-knob${darkMode ? ' mode-knob--dark' : ''}`} />
                        </button>
                      </div>
                      <div className="panel-divider" />
                      <button className="panel-item panel-item--danger" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
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

            {/* Hamburger — mobile only */}
            <button
              className={`hamburger${mobileOpen ? ' hamburger--open' : ''}`}
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* ══ MOBILE DRAWER ════════════════════════════════ */}
      {/* Backdrop */}
      <div
        className={`mobile-backdrop${mobileOpen ? ' mobile-backdrop--visible' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from right */}
      <div
        className={`mobile-drawer${mobileOpen ? ' mobile-drawer--open' : ''}`}
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
        aria-hidden={!mobileOpen}
      >
        {/* Drawer header */}
        <div className="drawer-header">
          <div className="drawer-logo">
            <span style={{ color: 'var(--rust)', fontSize: '1.3rem' }}>◎</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>The Wheezy League</span>
          </div>
          <button className="drawer-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">✕</button>
        </div>

        {/* User card if logged in */}
        {isAuthenticated && (
          <div className="drawer-user-card">
            <div className="chip-avatar chip-avatar--lg">
              {(avatarUrl || user?.picture) ? <img src={avatarUrl || user.picture} alt={user.name} /> : <span>{firstName[0]}</span>}
            </div>
            <div className="drawer-user-info">
              <p className="drawer-user-name">{user?.name || profile.name}</p>
              <p className="drawer-user-email">{user?.email || profile.email}</p>
              <div className="level-badge" style={{ marginTop: '0.35rem', fontSize: '0.68rem' }}>⭐ Level {profile.level} · {profile.xp} XP</div>
            </div>
          </div>
        )}

        <div className="drawer-scroll">
          {/* Main nav links */}
          {isAuthenticated && (
            <nav className="drawer-nav">
              {NAV_LINKS.map(({ to, label, icon }) => (
                <Link key={to} to={to} className={`drawer-link${isActive(to) ? ' drawer-link--active' : ''}`}>
                  <span className="drawer-link-icon">{icon}</span>
                  <span>{label}</span>
                  {isActive(to) && <span className="drawer-link-pip" aria-hidden="true" />}
                </Link>
              ))}
              <Link to="/profile" className={`drawer-link${isActive('/profile') ? ' drawer-link--active' : ''}`}>
                <span className="drawer-link-icon">👤</span>
                <span>My Profile</span>
              </Link>
            </nav>
          )}

          <div className="drawer-divider" />

          {/* Secondary links */}
          <nav className="drawer-secondary">
            <Link to="/about"      className="drawer-link-sm"><span>ℹ️</span>About</Link>
            <Link to="/contact"    className="drawer-link-sm"><span>✉️</span>Contact</Link>
            <Link to="/privacy"    className="drawer-link-sm"><span>🔒</span>Privacy</Link>
          </nav>

          <div className="drawer-divider" />

          {/* Toggles */}
          <div className="drawer-toggles">
            <div className="drawer-toggle-row">
              <span>{darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
              <button className="mode-toggle-btn" onClick={toggleDark} aria-label="Toggle dark mode">
                <span className={`mode-knob${darkMode ? ' mode-knob--dark' : ''}`} />
              </button>
            </div>
            <div className="drawer-toggle-row">
              <span>{isDemo ? '🎮 Demo Mode' : '🔌 Live Mode'}</span>
              <button className="demo-toggle-btn" onClick={toggleDemo} aria-label="Toggle demo mode">
                <span className={`demo-knob${isDemo ? '' : ' demo-knob--live'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Drawer footer */}
        <div className="drawer-footer">
          {isAuthenticated ? (
            <button className="btn btn-outline btn-sm" style={{ width: '100%' }}
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
              Sign Out
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => loginWithRedirect()}>Log In</button>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}>Join Free</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
