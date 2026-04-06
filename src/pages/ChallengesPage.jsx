import React, { useState, useEffect } from 'react'
import { useDemo } from '../context/DemoContext'
import { getChallenges, getLeaderboard, joinChallenge } from '../services/dataService'
import ChallengeModal from '../components/ui/ChallengeModal'
import './ChallengesPage.css'

const CHALLENGES = [
  {
    id: 1, emoji: '🌬️', name: 'Wheeze to Ease 5K', featured: true,
    desc: 'Complete a 5K this month — any pace, any day, any weather. The journey is the win.',
    joined: 3241, daysLeft: 14, progress: 62, points: 500,
    tags: ['5K', 'Beginner-Friendly', 'Asthma'],
  },
  {
    id: 2, emoji: '🌅', name: '5AM Sunrise Club',
    desc: 'Run before 6AM five times this month. Early air, fewer triggers.',
    joined: 891, daysLeft: 21, progress: 38, points: 300,
    tags: ['Morning', 'Consistency'],
  },
  {
    id: 3, emoji: '🤝', name: 'Buddy System Sprint',
    desc: 'Pair with a fellow member and complete 3 virtual runs together.',
    joined: 512, daysLeft: 7, progress: 80, points: 250,
    tags: ['Social', 'Virtual'],
  },
  {
    id: 4, emoji: '🏙️', name: 'City Miles Relay',
    desc: 'Your city vs. theirs. Pool miles with your local The Wheezy League crew.',
    joined: 7012, daysLeft: 30, progress: 22, points: 750,
    tags: ['Team', 'City Battle'],
  },
  {
    id: 5, emoji: '❄️', name: 'Cold Weather Warrior',
    desc: 'Complete 5 outdoor runs when temps are below 40°F. Bundle up and show up.',
    joined: 320, daysLeft: 45, progress: 0, points: 400,
    tags: ['Winter', 'Outdoor', 'Asthma'],
  },
  {
    id: 6, emoji: '📏', name: 'Distance Climber',
    desc: 'Add half a mile to your long run every week for 4 weeks in a row.',
    joined: 1640, daysLeft: 28, progress: 50, points: 600,
    tags: ['Training', 'Progressive'],
  },
]

const LEADERBOARD = [
  { rank: 1, emoji: '🧑‍🦱', name: 'Marcus T.', city: 'Boston', pts: 2840 },
  { rank: 2, emoji: '👩', name: 'Aisha P.', city: 'NYC', pts: 2610 },
  { rank: 3, emoji: '🧑🏻', name: 'Leo M.', city: 'LA', pts: 2440 },
  { rank: 4, emoji: '👩‍🦰', name: 'Leila H.', city: 'Denver', pts: 2200 },
  { rank: 5, emoji: '🧑🏽', name: 'Sam O.', city: 'Chicago', pts: 1980 },
]

export default function ChallengesPage() {
  const { isDemo } = useDemo()
  const [challenges, setChallenges] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [joined, setJoined] = useState(new Set([1, 2, 3]))
  const [selectedChallenge, setSelectedChallenge] = useState(null)

  useEffect(() => {
    getChallenges(isDemo).then(d => setChallenges(Array.isArray(d) ? d : (isDemo ? CHALLENGES : [])))
    getLeaderboard(isDemo).then(d => setLeaderboard(Array.isArray(d) && d.length ? d : (isDemo ? LEADERBOARD : [])))
  }, [isDemo])

  const toggleJoin = (id) => {
    setJoined(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="page-container challenges-page">
      <div className="challenges-header">
        <div>
          <span className="section-label">Community Challenges</span>
          <h1 className="section-title">Run together.<br /><em>Win together.</em></h1>
        </div>
        <div className="challenges-hero-stat">
          <div className="hero-stat-pill">
            <span className="hero-stat-pill-num">3</span>
            <span>Active Challenges</span>
          </div>
          <div className="hero-stat-pill hero-stat-pill--amber">
            <span className="hero-stat-pill-num">1,550</span>
            <span>Points Earned</span>
          </div>
        </div>
      </div>

      <div className="challenges-layout">
        <div className="challenges-grid">
          {CHALLENGES.map(c => (
            <div key={c.id} className={`card challenge-card${c.featured ? ' challenge-card--featured' : ''}`} onClick={() => setSelectedChallenge(c)} style={{ cursor: 'pointer' }}>
              {c.featured && <div className="featured-banner">🏆 Featured This Month</div>}
              <div className="challenge-top">
                <span className="challenge-emoji" aria-hidden="true">{c.emoji}</span>
                <div className="challenge-points">+{c.points} pts</div>
              </div>
              <h3 className="challenge-name">{c.name}</h3>
              <p className="challenge-desc">{c.desc}</p>
              <div className="challenge-tags">
                {c.tags.map(t => <span key={t} className="tag tag-earth">{t}</span>)}
              </div>
              <div className="challenge-meta">
                <span>👥 {c.joined.toLocaleString()} joined</span>
                <span>📅 {c.daysLeft}d left</span>
              </div>
              {joined.has(c.id) && (
                <div className="progress-wrap">
                  <div className="progress-label">
                    <span>Your progress</span><span>{c.progress}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
              )}
              <button
                className={`btn btn-sm ${joined.has(c.id) ? 'btn-sage' : c.featured ? 'btn-primary' : 'btn-outline'}`}
                onClick={(e) => { e.stopPropagation(); toggleJoin(c.id) }}
              >
                {joined.has(c.id) ? '✓ Joined' : 'Join Challenge'}
              </button>
            </div>
          ))}
        </div>

        {/* Leaderboard sidebar */}
        <aside className="challenges-sidebar">
          <div className="card sidebar-card">
            <h3 className="sidebar-title">🏅 All-Time Leaderboard</h3>
            {LEADERBOARD.map(m => (
              <div key={m.rank} className="lb-row">
                <span className={`lb-rank lb-rank--${m.rank}`}>#{m.rank}</span>
                <div className="avatar avatar-sm">{m.emoji}</div>
                <div className="lb-info">
                  <strong>{m.name}</strong>
                  <span>{m.city}</span>
                </div>
                <span className="lb-pts">{m.pts.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="card sidebar-card">
            <h3 className="sidebar-title">🎁 Redeem Points</h3>
            {[
              { name: 'Buff Headband', pts: 500 },
              { name: 'Race Entry Credit', pts: 1500 },
              { name: 'Partner Inhaler Discount', pts: 800 },
            ].map(r => (
              <div key={r.name} className="reward-row">
                <span className="reward-name">{r.name}</span>
                <button className="btn btn-sm btn-outline">{r.pts} pts</button>
              </div>
            ))}
          </div>
        </aside>
      </div>
      {selectedChallenge && (
        <ChallengeModal
          challenge={selectedChallenge}
          joined={joined.has(selectedChallenge.id)}
          onClose={() => setSelectedChallenge(null)}
          onToggleJoin={(id) => { toggleJoin(id); setSelectedChallenge(null) }}
        />
      )}
    </div>
  )
}
