import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const LINKS = [
  { to: '/dashboard',  label: 'Dashboard' },
  { to: '/challenges', label: 'Challenges' },
  { to: '/community',  label: 'Community' },
  { to: '/routes',     label: 'Routes' },
  { to: '/incentives', label: 'Rewards' },
  { to: '/about',      label: 'About' },
  { to: '/contact',    label: 'Contact' },
  { to: '/privacy',    label: 'Privacy' },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* Brand */}
        <Link to="/" className="footer-logo">
          <span className="logo-mark">WL</span>
          <span className="footer-logo-name">Wheezy<span style={{ color: 'var(--neon-orange)' }}>League</span></span>
        </Link>

        <p className="footer-tagline">
          Built for every runner who has ever fought for air<br className="footer-br" /> and still showed up at the starting line.
        </p>

        {/* Nav links */}
        <nav className="footer-links" aria-label="Footer navigation">
          {LINKS.map(l => (
            <Link key={l.to} to={l.to} className="footer-link">{l.label}</Link>
          ))}
        </nav>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <span>© 2026 The Wheezy League · v2026.4.0</span>
          <span className="footer-breath">Run with every breath. 🫁</span>
        </div>

      </div>
    </footer>
  )
}
