import React from 'react'
import { Link } from 'react-router-dom'
import './AboutPage.css'

const TEAM = [
  { emoji: '🧑‍💻', name: 'Jordan Lee',    role: 'Co-founder & CEO',        bio: 'Diagnosed with EIA at 28. Built The Wheezy League because no app understood what running with asthma actually felt like.' },
  { emoji: '👩‍⚕️', name: 'Dr. Priya Mehta', role: 'Chief Medical Advisor',   bio: 'Pulmonologist and marathon runner. Ensures every BreathZone feature is grounded in real respiratory science.' },
  { emoji: '🧑‍🎨', name: 'Alex Torres',   role: 'Head of Design',           bio: 'Former competitive runner. Believes good design can make hard things feel possible.' },
  { emoji: '👩‍💻', name: 'Sam Okafor',    role: 'Lead Engineer',            bio: 'Built the data pipeline that turns symptom logs into real insights. Runs 5Ks on weekends.' },
]

const MILESTONES = [
  { year: '2022', label: 'Founded', desc: 'Jordan logs his first run post-diagnosis and finds nothing built for him.' },
  { year: '2023', label: 'Beta Launch', desc: '200 founding members. First community challenge. First doctor export feature shipped.' },
  { year: '2024', label: 'BreathZone', desc: 'AQI alerts, symptom journaling, and trigger tracking launch to 5,000 members.' },
  { year: '2025', label: 'Scale', desc: '14,000+ members across 40 cities. Partnerships with 3 national asthma organisations.' },
  { year: '2026', label: 'Today',  desc: 'Gamified experience, team challenges, and doctor export goes live globally.' },
]

const VALUES = [
  { icon: '🫁', title: 'Breath First',   body: 'Every feature is designed with respiratory health as the primary lens.' },
  { icon: '🤝', title: 'No Runner Left Behind', body: 'Every pace is valid. Every finish line counts. We celebrate the 40-minute 5K as loudly as the 18-minute one.' },
  { icon: '🔬', title: 'Science-Backed', body: 'Our medical advisory team reviews every health-related feature before it ships.' },
  { icon: '🔓', title: 'Open Community', body: 'No paywalls on community features. Running and breathing should be accessible to everyone.' },
]

export default function AboutPage() {
  return (
    <div className="about-page">

      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-rings" aria-hidden="true">
          <div className="ahr ahr-1" /><div className="ahr ahr-2" /><div className="ahr ahr-3" />
        </div>
        <div className="page-container about-hero-inner">
          <span className="section-label section-label--light">Our Story</span>
          <h1 className="about-hero-title">
            Built by runners<br />who know the <em>wheeze.</em>
          </h1>
          <p className="about-hero-sub">
            The Wheezy League started as a personal frustration: why is every running app built for people
            who breathe easily? We built the one we always needed.
          </p>
          <div className="about-hero-stats">
            {[
              { val: '14,200+', label: 'Members' },
              { val: '40+',     label: 'Cities' },
              { val: '3.2M',    label: 'Miles Logged' },
              { val: '89%',     label: 'Have asthma or respiratory conditions' },
            ].map(s => (
              <div key={s.val} className="about-stat">
                <span className="about-stat-val">{s.val}</span>
                <span className="about-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section about-mission-section">
        <div className="section-inner about-mission">
          <div>
            <span className="section-label">Mission</span>
            <h2 className="section-title">We run so that<br /><em>everyone can.</em></h2>
            <p className="section-sub">
              Asthma affects 1 in 13 people in the US. Most running apps treat it as an edge case.
              We treat it as the main case — then build features great enough that every runner wants them.
            </p>
            <Link to="/community" className="btn btn-primary">Join the Community →</Link>
          </div>
          <div className="mission-quote card card--dark">
            <span className="mq-mark" aria-hidden="true">"</span>
            <blockquote>
              I crossed my first finish line with my inhaler in my hand and tears running down
              my face. The Wheezy League was the only place that didn't make me feel like that was weird.
              That was everything.
            </blockquote>
            <cite>
              <div className="avatar avatar-sm" style={{ fontSize: '1rem', background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}>🏃</div>
              <div>
                <strong>Kezia N.</strong>
                <span>London · Member since 2023</span>
              </div>
            </cite>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section about-values-section">
        <div className="section-inner">
          <span className="section-label">What We Believe</span>
          <h2 className="section-title">Our <em>values.</em></h2>
          <div className="values-grid">
            {VALUES.map(v => (
              <div key={v.title} className="card value-card">
                <span className="value-icon" aria-hidden="true">{v.icon}</span>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section about-timeline-section">
        <div className="section-inner">
          <span className="section-label">History</span>
          <h2 className="section-title">How we got <em>here.</em></h2>
          <div className="timeline">
            {MILESTONES.map((m, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-year">{m.year}</div>
                <div className="timeline-line" aria-hidden="true" />
                <div className="card timeline-card">
                  <strong>{m.label}</strong>
                  <p>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section about-team-section">
        <div className="section-inner">
          <span className="section-label">The Team</span>
          <h2 className="section-title">People behind<br /><em>the breath.</em></h2>
          <div className="team-grid">
            {TEAM.map(m => (
              <div key={m.name} className="card team-card">
                <div className="team-avatar" aria-hidden="true">{m.emoji}</div>
                <h3>{m.name}</h3>
                <span className="tag tag-rust">{m.role}</span>
                <p>{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section about-cta-section">
        <div className="section-inner">
          <div className="card about-cta-card">
            <h2 className="section-title">Ready to run with us?</h2>
            <p className="section-sub">Join 14,000+ runners who found their second wind.</p>
            <div className="about-cta-btns">
              <Link to="/" className="btn btn-primary btn-lg">Join The Wheezy League Free</Link>
              <Link to="/contact" className="btn btn-outline btn-lg">Get in Touch</Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
