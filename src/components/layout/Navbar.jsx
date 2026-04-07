import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useDemo } from '../../context/DemoContext'
import { DEMO_PROFILE } from '../../data/profile'
import useAuth from '../../hooks/useAuth'
import './Navbar.css'

const NAV = [
  { to: '/dashboard',  label: 'Dashboard',  icon: '⬡' },
  { to: '/community',  label: 'Community',  icon: '◈' },
  { to: '/challenges', label: 'Challenges', icon: '◉' },
  { to: '/routes',     label: 'Routes',     icon: '◎' },
  { to: '/incentives', label: 'Rewards',    icon: '◆' },
]

export default function Navbar() {
  const { isAuthenticated, user, loginWithRedirect, logout, isLoading } = useAuth0()
  const { isDemo, toggleDemo, notifications, unreadCount, markAllRead, markRead,
          darkMode, toggleDark, avatarUrl, liveProfile } = useDemo()
  const { hasRole } = useAuth()

  const [userOpen,   setUserOpen]   = useState(false)
  const [bellOpen,   setBellOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)
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
  const LIVE_BLANK = { level: 1, xp: 0, xpToNext: 500 }
  const profile = isDemo ? DEMO_PROFILE : (liveProfile || LIVE_BLANK)
  const firstName = user?.given_name || user?.name?.split(' ')[0] || 'Runner'

  const openBell = () => {
    const rect = bellRef.current?.getBoundingClientRect()
    if (rect) setBellPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    setBellOpen(o => !o); setUserOpen(false)
  }
  const openUser = () => {
    const rect = userRef.current?.getBoundingClientRect()
    if (rect) setUserPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    setUserOpen(o => !o); setBellOpen(false)
  }

  return (
    <div className="nav-stack">
      {isDemo && (
        <div className="demo-banner-bar">
          <span className="demo-dot" />
          <span>DEMO MODE</span>
          <button className="demo-toggle-btn" onClick={toggleDemo} aria-label="Switch to live">
            <span className="demo-knob" />
          </button>
          <span className="demo-hint">tap to go live</span>
        </div>
      )}

      <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            <span className="logo-mark">WL</span>
            <span className="logo-name" data-league="League">Wheezy</span>
          </Link>

          {isAuthenticated && (
            <nav className="navbar-links">
              {NAV.map(({ to, label, icon }) => (
                <Link key={to} to={to} className={`nav-link${isActive(to) ? ' nav-link--active' : ''}`}>
                  <span className="nav-icon" aria-hidden="true">{icon}</span>
                  <span className="nav-link-label">{label}</span>
                </Link>
              ))}
            </nav>
          )}

          <div className="navbar-actions">
            {isLoading ? <div className="nav-spinner" /> : isAuthenticated ? (
              <>
                <div className="nav-xp-pill">
                  <span className="nav-xp-lv">LV.{profile.level}</span>
                  <div className="nav-xp-track"><div className="nav-xp-fill" style={{ width:`${Math.round((profile.xp/profile.xpToNext)*100)}%` }} /></div>
                </div>

                <div className="bell-wrap" ref={bellRef}>
                  <button className="icon-btn" onClick={openBell} aria-label="Notifications" aria-expanded={bellOpen}>
                    <span className="bell-icon">◎</span>
                    {unreadCount > 0 && <span className="icon-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </button>
                  {bellOpen && (
                    <div className="floating-panel bell-panel" style={{ top: bellPos.top, right: bellPos.right }}>
                      <div className="panel-header">
                        <span className="panel-title">ALERTS</span>
                        {unreadCount > 0 && <button className="panel-action" onClick={markAllRead}>clear all</button>}
                      </div>
                      <div className="notif-list">
                        {notifications.length === 0 && <p className="notif-empty">No alerts yet</p>}
                        {notifications.map(n => (
                          <button key={n.id} className={`notif-row${n.read ? ' notif-row--read' : ''}`} onClick={() => markRead(n.id)}>
                            <span className="notif-icon-wrap">{n.icon}</span>
                            <div className="notif-content">
                              <p className="notif-title">{n.title}</p>
                              <p className="notif-body">{n.body}</p>
                              <p className="notif-time">{n.time}</p>
                            </div>
                            {!n.read && <span className="unread-dot" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="user-menu-wrap" ref={userRef}>
                  <button className="user-chip" onClick={openUser} aria-expanded={userOpen}>
                    <div className="chip-avatar">
                      {(avatarUrl || user?.picture)
                        ? <img src={avatarUrl || user.picture} alt={firstName} />
                        : <span>{firstName[0]}</span>}
                    </div>
                    <span className="chip-name">{firstName}</span>
                    <span className={`chip-chevron${userOpen ? ' chip-chevron--open' : ''}`}>▾</span>
                  </button>
                  {userOpen && (
                    <div className="floating-panel user-panel" style={{ top: userPos.top, right: userPos.right }}>
                      <div className="upanel-header">
                        <div className="chip-avatar chip-avatar--lg">
                          {(avatarUrl || user?.picture) ? <img src={avatarUrl || user.picture} alt={firstName} /> : <span>{firstName[0]}</span>}
                        </div>
                        <div>
                          <p className="upanel-name">{user?.name || firstName}</p>
                          <p className="upanel-email">{user?.email}</p>
                        </div>
                      </div>
                      <div className="upanel-xp">
                        <div className="xp-label-row"><span>LV.{profile.level}</span><span>{profile.xp}/{profile.xpToNext} XP</span></div>
                        <div className="xp-track"><div className="xp-fill" style={{ width:`${Math.round((profile.xp/profile.xpToNext)*100)}%` }} /></div>
                      </div>
                      <div className="panel-divider" />
                      <Link to="/profile"    className="panel-item" onClick={() => setUserOpen(false)}>My Profile</Link>
                      <Link to="/dashboard"  className="panel-item" onClick={() => setUserOpen(false)}>Dashboard</Link>
                      {hasRole('admin') && <Link to="/admin" className="panel-item panel-item--admin" onClick={() => setUserOpen(false)}>Admin Panel</Link>}
                      <div className="panel-divider" />
                      <div className="panel-item panel-item--toggle">
                        <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                        <button className="mode-toggle-btn" onClick={toggleDark}><span className={`mode-knob${darkMode ? ' mode-knob--dark' : ''}`} /></button>
                      </div>
                      <div className="panel-item panel-item--toggle">
                        <span>{isDemo ? 'Demo Mode' : 'Live Mode'}</span>
                        <button className="demo-toggle-btn" onClick={toggleDemo}><span className={`demo-knob${isDemo ? '' : ' demo-knob--live'}`} /></button>
                      </div>
                      <div className="panel-divider" />
                      <button className="panel-item panel-item--danger" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Sign Out</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="auth-btns">
                <button className="btn btn-ghost btn-sm" onClick={() => loginWithRedirect()}>Log In</button>
                <button className="btn btn-primary btn-sm" onClick={() => loginWithRedirect({ authorizationParams: { screen_hint:'signup' } })}>Join Free</button>
              </div>
            )}
            <button className={`hamburger${mobileOpen ? ' hamburger--open' : ''}`} onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-backdrop${mobileOpen ? ' mobile-backdrop--visible' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`mobile-drawer${mobileOpen ? ' mobile-drawer--open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="drawer-header">
          <span className="logo-mark" style={{ fontSize:'0.65rem', padding:'0.2rem 0.45rem' }}>WL</span>
          <button className="drawer-close" onClick={() => setMobileOpen(false)}>✕</button>
        </div>
        {isAuthenticated && (
          <div className="drawer-user-card">
            <div className="chip-avatar chip-avatar--lg">
              {(avatarUrl||user?.picture) ? <img src={avatarUrl||user.picture} alt={firstName}/> : <span>{firstName[0]}</span>}
            </div>
            <div>
              <p className="drawer-user-name">{firstName}</p>
              <p className="drawer-user-email">{user?.email}</p>
              <p className="level-badge" style={{ marginTop:'0.35rem', fontSize:'0.66rem' }}>LV.{profile.level} · {profile.xp} XP</p>
            </div>
          </div>
        )}
        <div className="drawer-scroll">
          {isAuthenticated && (
            <nav className="drawer-nav">
              {NAV.map(({ to, label, icon }) => (
                <Link key={to} to={to} className={`drawer-link${isActive(to) ? ' drawer-link--active' : ''}`}>
                  <span>{icon}</span><span>{label}</span>
                </Link>
              ))}
              <Link to="/profile" className={`drawer-link${isActive('/profile') ? ' drawer-link--active' : ''}`}><span>◈</span><span>Profile</span></Link>
              {hasRole('admin') && <Link to="/admin" className="drawer-link drawer-link--admin"><span>⚙</span><span>Admin</span></Link>}
            </nav>
          )}
          <div className="drawer-divider" />
          <div className="drawer-toggles">
            <div className="drawer-toggle-row"><span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span><button className="mode-toggle-btn" onClick={toggleDark}><span className={`mode-knob${darkMode ? ' mode-knob--dark' : ''}`} /></button></div>
            <div className="drawer-toggle-row"><span>{isDemo ? 'Demo Mode' : 'Live Mode'}</span><button className="demo-toggle-btn" onClick={toggleDemo}><span className={`demo-knob${isDemo ? '' : ' demo-knob--live'}`} /></button></div>
          </div>
        </div>
        <div className="drawer-footer">
          {isAuthenticated
            ? <button className="btn btn-outline btn-sm" style={{ width:'100%' }} onClick={() => logout({ logoutParams:{ returnTo: window.location.origin } })}>Sign Out</button>
            : <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                <button className="btn btn-outline" style={{ width:'100%' }} onClick={() => loginWithRedirect()}>Log In</button>
                <button className="btn btn-primary" style={{ width:'100%' }} onClick={() => loginWithRedirect({ authorizationParams:{ screen_hint:'signup' } })}>Join Free</button>
              </div>
          }
        </div>
      </div>
    </div>
  )
}
