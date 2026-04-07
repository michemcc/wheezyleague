import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import './HomePage.css'

const STATS = [
  { num: '14,200+', label: 'Runners' },
  { num: '340K',    label: 'Miles' },
  { num: '98%',     label: 'Fewer flares' },
  { num: 'Free',    label: 'Always' },
]

export default function HomePage() {
  const { isAuthenticated, loginWithRedirect } = useAuth0()
  const join  = () => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })

  return (
    <main className="home">

      {/* HERO */}
      <section className="hp-hero">
        <div className="hp-grid" aria-hidden="true" />
        <div className="page-container hp-inner">
          <p className="hp-eyebrow">Asthma-friendly run club</p>
          <h1 className="hp-title">Run with every<br /><span className="hp-em">breath.</span></h1>
          <p className="hp-sub">Challenges, community, and real rewards — built for runners who breathe differently.</p>
          <div className="hp-actions">
            {isAuthenticated
              ? <Link to="/dashboard" className="btn btn-gold btn-lg">Dashboard →</Link>
              : <>
                  <button className="btn btn-gold btn-lg" onClick={join}>Join Free</button>
                  <button className="btn btn-ghost-light btn-lg" onClick={() => loginWithRedirect()}>Log In</button>
                </>
            }
          </div>
          <div className="hp-stats">
            {STATS.map(s => (
              <div key={s.label} className="hp-stat">
                <span className="hp-stat-n">{s.num}</span>
                <span className="hp-stat-l">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — 4 cards, clean */}
      <section className="hp-features">
        <div className="page-container">
          <div className="hp-grid-4">
            {[
              { icon:'◉', t:'Challenges', d:'Monthly missions. Any pace. Earn XP.' },
              { icon:'◈', t:'Community',  d:'14,000+ runners. Real stories.' },
              { icon:'◎', t:'Safe Routes',d:'AQI-rated routes near you.' },
              { icon:'◆', t:'Rewards',    d:'Real gear. Real credits. Real trophy.' },
            ].map(f => (
              <div key={f.t} className="hp-card">
                <span className="hp-card-icon">{f.icon}</span>
                <strong className="hp-card-title">{f.t}</strong>
                <p className="hp-card-desc">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hp-cta">
        <div className="page-container">
          <h2 className="hp-cta-title">Your second wind starts here.</h2>
          <p className="hp-cta-sub">Free to join. No pace requirements. Every breath counts.</p>
          <button className="btn btn-gold btn-lg" onClick={join}>Join Free →</button>
        </div>
      </section>

    </main>
  )
}
