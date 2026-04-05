import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import './HomePage.css'

const APP_VERSION = '2026.5.0'

const FEATURES = [
  { icon:'🏆', title:'Challenges',    desc:'Monthly missions built for asthmatic runners. Any pace, any distance, just show up.', link:'/challenges', color:'gold' },
  { icon:'👥', title:'Community',     desc:'14,000+ wheezers sharing tips, wins, and real stories from the road.',                link:'/community',  color:'violet' },
  { icon:'🗺️', title:'Safe Routes',  desc:'Community-rated routes tagged with AQI, pollen level, and surface type.',            link:'/routes',     color:'blue' },
  { icon:'🎁', title:'Real Rewards',  desc:'T-shirt at 10 runs. Race credit at 100 miles. An actual trophy at 365.',             link:'/incentives', color:'orange' },
]

const STATS = [
  { num:'14,200+', lbl:'Active Members' },
  { num:'98%',     lbl:'Fewer Flare-ups' },
  { num:'340K',    lbl:'Miles Logged' },
  { num:'Lv.12',   lbl:'Avg Player Level' },
]

const ROSTER = [
  { emoji:'🧑‍🦱', name:'Marcus T.',  loc:'Boston',  body:'First 10K with zero flare-ups. BreathZone cracked the pattern — cold + dry = trouble. 🙌',            badge:'BREATH WARRIOR', color:'orange' },
  { emoji:'👩',   name:'Leila H.',   loc:'Denver',   body:'Anyone tried cold-weather masks that don\'t fog glasses? My pulmonologist gave me one and I look insane 😅', badge:'PACER', color:'blue' },
  { emoji:'🧑🏽', name:'Sam O.',     loc:'Chicago',  body:'Just diagnosed. Thought running was over. Found The Wheezy League and… 14,000 of us?! Not alone. 😭🏃',  badge:'RECRUIT', color:'green' },
]

export default function HomePage() {
  const { isAuthenticated, loginWithRedirect } = useAuth0()
  const observerRef = useRef(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observerRef.current.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div className="home">

      {/* ══ HERO ══ */}
      <section className="hero">
        {/* Scan lines */}
        <div className="hero-scanlines" aria-hidden="true" />
        {/* Grid floor */}
        <div className="hero-grid" aria-hidden="true" />

        <div className="hero-inner page-container">
          <div className="hero-content">

            {/* HUD tag */}
            <div className="hero-hud-tag">
              <span className="hud-dot" />
              <span className="hud-label">ASTHMA-FRIENDLY RUN CLUB</span>
              <span className="hud-ver">v{APP_VERSION}</span>
            </div>

            <h1 className="hero-title">
              <span className="hero-title-line">THE</span><br />
              <span className="hero-title-accent">WHEEZY</span><br />
              <span className="hero-title-line">LEAGUE</span>
            </h1>

            <p className="hero-sub">
              Run club for the medically aerodynamically challenged.
              Track triggers, earn XP, level up your lungs.
            </p>

            <div className="hero-actions">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-gold btn-lg">▶ PLAY NOW</Link>
              ) : (
                <>
                  <button className="btn btn-gold btn-lg" onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}>
                    ▶ JOIN FREE
                  </button>
                  <button className="btn btn-outline btn-lg" onClick={() => loginWithRedirect()}>
                    LOG IN
                  </button>
                </>
              )}
            </div>

            {/* Stat HUD */}
            <div className="hero-stats-hud">
              {STATS.map(s => (
                <div key={s.lbl} className="hud-stat">
                  <span className="hud-stat-num">{s.num}</span>
                  <span className="hud-stat-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="hero-hud-card">
            <div className="hud-card-header">
              <span className="hud-card-title">PLAYER STATUS</span>
              <span className="hud-live"><span className="hud-dot hud-dot--green" />LIVE</span>
            </div>
            <div className="hud-metrics">
              <div className="hud-metric"><span className="hud-metric-val">23</span><span className="hud-metric-lbl">DAY STREAK</span></div>
              <div className="hud-metric"><span className="hud-metric-val">18.4</span><span className="hud-metric-lbl">MILES / WK</span></div>
              <div className="hud-metric"><span className="hud-metric-val">8:42</span><span className="hud-metric-lbl">AVG PACE</span></div>
              <div className="hud-metric"><span className="hud-metric-val gold">LV.12</span><span className="hud-metric-lbl">CURRENT LVL</span></div>
            </div>
            <div className="hud-xp-section">
              <div className="hud-xp-label"><span>XP TO NEXT LEVEL</span><span>3,400 / 4,000</span></div>
              <div className="hud-xp-bar"><div className="hud-xp-fill" style={{ width: '85%' }} /></div>
            </div>
            <div className="hud-aqi-row">
              <span className="hud-aqi-badge">AQI 42</span>
              <span className="hud-aqi-text">GOOD — Clear to run, soldier 🟢</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS TICKER ══ */}
      <div className="stats-ticker">
        <div className="ticker-inner">
          {[...STATS, ...STATS].map((s, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-num">{s.num}</span>
              <span className="ticker-lbl">{s.lbl}</span>
              <span className="ticker-sep">◈</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ FEATURES ══ */}
      <section className="features-section section">
        <div className="section-inner">
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-label">YOUR ABILITIES</span>
            <h2 className="section-title">Choose your <span style={{ color: 'var(--neon-orange)' }}>loadout</span></h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>Every feature was crafted for runners who breathe a little differently.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <Link
                key={f.title} to={isAuthenticated ? f.link : '#'}
                className={`feature-card feature-card--${f.color} reveal`}
                style={{ animationDelay: `${i * 0.06}s` }}
                onClick={!isAuthenticated ? e => { e.preventDefault(); loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } }) } : undefined}
              >
                <div className="feature-card-top">
                  <span className="feature-icon">{f.icon}</span>
                  <span className="feature-arrow">→</span>
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COMMUNITY FEED ══ */}
      <section className="feed-section section">
        <div className="section-inner">
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="section-label">PLAYER COMMS</span>
            <h2 className="section-title">From the <span style={{ color: 'var(--neon-blue)' }}>roster</span></h2>
          </div>
          <div className="feed-grid">
            {ROSTER.map((p, i) => (
              <div key={i} className="post-card card reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="post-header">
                  <div className="avatar avatar-md">{p.emoji}</div>
                  <div className="post-meta">
                    <p className="post-name">
                      {p.name}
                      <span className={`tag tag-${p.color === 'orange' ? 'rust' : p.color === 'blue' ? 'sky' : p.color === 'green' ? 'sage' : p.color}`}>{p.badge}</span>
                    </p>
                    <div className="post-info"><span>📍 {p.loc}</span></div>
                  </div>
                </div>
                <p className="post-body">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ QUOTE ══ */}
      <section className="quote-section">
        <div className="page-container">
          <div className="quote-inner reveal">
            <div className="quote-mark">"</div>
            <blockquote>I ran my first 5K six months after my asthma diagnosis. The Wheezy League showed me I wasn't running in spite of my lungs — I was running for them.</blockquote>
            <div className="quote-cite">
              <strong>Aisha P. // LEVEL 18</strong>
              <span>New York City · Member since 2024</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="cta-section section">
        <div className="section-inner">
          <div className="cta-card reveal">
            <div className="cta-scan" aria-hidden="true" />
            <div className="cta-content">
              <span className="section-label section-label--light">READY PLAYER?</span>
              <h2 className="cta-title">Your second wind<br/><span className="cta-title-accent">starts NOW</span></h2>
              <p className="cta-sub">Free to join. No pace requirements. Every breath counts.</p>
              <div className="cta-actions">
                <button className="btn btn-gold btn-lg" onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}>
                  ▶ START YOUR RUN
                </button>
                <Link to="/about" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(232,240,255,0.3)', color: 'var(--text-2)' }}>
                  LEARN MORE
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
