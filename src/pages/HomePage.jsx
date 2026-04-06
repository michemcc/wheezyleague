import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import './HomePage.css'

const FEATURES = [
  { icon: '🏆', title: 'Challenges',   desc: 'Monthly missions for every pace. Earn XP, badges, and real rewards.',  link: '/challenges' },
  { icon: '👥', title: 'Community',    desc: '14,000+ asthmatic runners sharing tips, wins, and hard-won wisdom.',     link: '/community'  },
  { icon: '🗺️', title: 'Safe Routes', desc: 'Community-rated routes tagged with live AQI, pollen, and surface data.', link: '/routes'     },
  { icon: '🎁', title: 'Rewards',      desc: 'Real gear for real runs. T-shirt at 10, race credit at 100, trophy at 365.', link: '/incentives' },
]

const MEMBERS = [
  { emoji: '🧑‍🦱', name: 'Marcus T.',  loc: 'Boston',  body: 'First 10K with zero flare-ups. Cracked my pattern — cold + dry air = trouble. Changed everything. 🙌', badge: 'Breath Warrior' },
  { emoji: '👩',   name: 'Leila H.',   loc: 'Denver',  body: 'Found a cold-weather mask that actually works. The community here gave me better advice than my physio 😅',   badge: 'Pacer'         },
  { emoji: '🧑🏽', name: 'Sam O.',     loc: 'Chicago', body: 'Just diagnosed. Thought running was over. Found The Wheezy League and… 14,000 of us doing this. Not alone.', badge: 'Recruit'       },
]

const STATS = [
  { num: '14,200+', label: 'Active members'     },
  { num: '98%',     label: 'Report fewer flares' },
  { num: '340K',    label: 'Miles logged'        },
  { num: '365',     label: 'Day max streak'      },
]

export default function HomePage() {
  const { isAuthenticated, loginWithRedirect } = useAuth0()

  const join  = () => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })
  const login = () => loginWithRedirect()

  return (
    <main className="home">

      {/* ═══ HERO ═══ */}
      <section className="hp-hero">
        <div className="hp-hero-bg" aria-hidden="true" />
        <div className="hp-hero-grid" aria-hidden="true" />

        <div className="page-container hp-hero-inner">
          <div className="hp-hero-text">
            <p className="hp-eyebrow">Asthma-Friendly Run Club</p>

            <h1 className="hp-title">
              Run with<br />every<br /><span className="hp-title-em">breath.</span>
            </h1>

            <p className="hp-sub">
              The Wheezy League is the run club built for runners with asthma.
              Track your triggers, join challenges, earn real rewards — and never run alone.
            </p>

            <div className="hp-actions">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-gold btn-lg">Go to Dashboard →</Link>
              ) : (
                <>
                  <button className="btn btn-gold btn-lg" onClick={join}>Join Free</button>
                  <button className="btn hp-btn-ghost btn-lg" onClick={login}>Log In</button>
                </>
              )}
            </div>
          </div>

          {/* Stats card */}
          <div className="hp-stats-card">
            {STATS.map(s => (
              <div key={s.label} className="hp-stat">
                <span className="hp-stat-num">{s.num}</span>
                <span className="hp-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="hp-section hp-features-section">
        <div className="page-container">
          <div className="hp-section-head">
            <p className="hp-section-label">What you get</p>
            <h2 className="hp-section-title">Built for runners who breathe a little differently.</h2>
          </div>
          <div className="hp-features-grid">
            {FEATURES.map(f => (
              <Link
                key={f.title}
                to={isAuthenticated ? f.link : '#'}
                className="hp-feature-card"
                onClick={!isAuthenticated ? e => { e.preventDefault(); join() } : undefined}
              >
                <span className="hp-feature-icon">{f.icon}</span>
                <h3 className="hp-feature-title">{f.title}</h3>
                <p className="hp-feature-desc">{f.desc}</p>
                <span className="hp-feature-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section className="hp-section hp-members-section">
        <div className="page-container">
          <div className="hp-section-head hp-section-head--center">
            <p className="hp-section-label">Real members</p>
            <h2 className="hp-section-title">From the community</h2>
          </div>
          <div className="hp-members-grid">
            {MEMBERS.map((m, i) => (
              <div key={i} className="hp-member-card">
                <p className="hp-member-body">"{m.body}"</p>
                <div className="hp-member-footer">
                  <span className="hp-member-avatar">{m.emoji}</span>
                  <div>
                    <strong className="hp-member-name">{m.name}</strong>
                    <span className="hp-member-meta">{m.loc} · {m.badge}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="hp-cta-section">
        <div className="page-container">
          <div className="hp-cta-card">
            <div className="hp-cta-text">
              <h2 className="hp-cta-title">Your second wind starts here.</h2>
              <p className="hp-cta-sub">Free to join. No pace requirements. Every breath counts.</p>
            </div>
            <div className="hp-cta-actions">
              <button className="btn btn-gold btn-lg" onClick={join}>Join Free</button>
              <Link to="/about" className="btn hp-btn-outline-light btn-lg">Learn More</Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
