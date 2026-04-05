import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { DEMO_PROFILE } from '../data/profile'
import { useDemo } from '../context/DemoContext'
import './IncentivesPage.css'

const RUN_MILESTONES = [
  { runs: 1,   reward: 'Welcome Badge',        icon: '🎖️',  type: 'badge',   desc: 'You showed up. That\'s everything.' },
  { runs: 5,   reward: 'Sticker Pack',          icon: '🏷️',  type: 'physical', desc: 'The Wheezy League logo + "I run for air" sticker set.' },
  { runs: 10,  reward: 'The Wheezy League T-Shirt',    icon: '👕',  type: 'physical', desc: 'Classic crew neck in your size. Earned, not bought.' },
  { runs: 25,  reward: 'Water Bottle',          icon: '💧',  type: 'physical', desc: 'Insulated 24oz bottle. Hydration matters.' },
  { runs: 50,  reward: 'BreathPro Month Free',  icon: '🫁',  type: 'digital',  desc: 'One month of BreathPro features unlocked free.' },
  { runs: 75,  reward: 'Running Cap',           icon: '🧢',  type: 'physical', desc: 'Lightweight performance cap with The Wheezy League embroidery.' },
  { runs: 100, reward: 'Race Entry Credit',     icon: '🏁',  type: 'physical', desc: '$50 credit toward any partner race entry fee.' },
  { runs: 150, reward: 'Compression Socks',     icon: '🧦',  type: 'physical', desc: 'Recovery compression socks. Your calves will thank you.' },
  { runs: 200, reward: 'Running Jacket',        icon: '🧥',  type: 'physical', desc: 'Lightweight wind-resistant jacket with The Wheezy League branding.' },
  { runs: 365, reward: 'Year Warrior Trophy',   icon: '🏆',  type: 'physical', desc: 'A real engraved trophy. 365 runs. You\'re a legend.' },
]

const DISTANCE_MILESTONES = [
  { miles: 26.2, reward: 'Marathon Badge',      icon: '🥇',  desc: 'First marathon distance logged (combined or single).' },
  { miles: 100,  reward: 'Century Runner Badge', icon: '💯', desc: '100 miles on the platform.' },
  { miles: 500,  reward: 'Endurance Pack',       icon: '🎒', desc: 'The Wheezy League branded gear bag with accessories.' },
  { miles: 1000, reward: '1K Miles Medal',       icon: '🎗️', desc: 'A real medal mailed to you. 1,000 miles is no joke.' },
]

const COMMUNITY_REWARDS = [
  { action: 'First Community Post',       pts: 50,   icon: '📝' },
  { action: 'Post gets 10 likes',         pts: 100,  icon: '❤️' },
  { action: 'Complete a buddy run',       pts: 150,  icon: '🤝' },
  { action: 'Submit a verified route',    pts: 200,  icon: '🗺️' },
  { action: 'Win a monthly challenge',    pts: 500,  icon: '🏆' },
  { action: 'Refer a new member',         pts: 300,  icon: '👥' },
  { action: 'Log 7-day streak',           pts: 175,  icon: '🔥' },
  { action: 'Export to doctor (BreathZone)', pts: 75, icon: '🩺' },
]

const TIER_COLORS = { badge: 'tag-amber', physical: 'tag-rust', digital: 'tag-sky' }

export default function IncentivesPage() {
  const { isDemo } = useDemo()
  const profile = isDemo ? DEMO_PROFILE : null
  const userRuns = 84  // demo value — wire to real data
  const userMiles = profile?.totalMiles ?? 0
  const userPoints = profile?.points ?? 0

  const [activeTab, setActiveTab] = useState('runs')

  const nextRunMilestone = RUN_MILESTONES.find(m => m.runs > userRuns)
  const runsToNext = nextRunMilestone ? nextRunMilestone.runs - userRuns : 0

  return (
    <div className="incentives-page">

      {/* Hero */}
      <div className="inc-hero">
        <div className="inc-hero-bg" aria-hidden="true">
          <div className="inc-ring inc-ring-1" /><div className="inc-ring inc-ring-2" />
        </div>
        <div className="page-container inc-hero-inner">
          <span className="section-label section-label--light">Run Club Rewards</span>
          <h1 className="inc-hero-title">Every run <em>earns.</em></h1>
          <p className="inc-hero-sub">
            Real rewards for real effort. From stickers to trophies — every milestone you
            hit unlocks something tangible. No points games, just runs.
          </p>

          {profile && (
            <div className="inc-progress-card card">
              <div className="inc-prog-left">
                <span className="inc-prog-runs">{userRuns}</span>
                <span className="inc-prog-label">runs completed</span>
              </div>
              <div className="inc-prog-center">
                <div className="progress-label">
                  <span>Next reward: <strong>{nextRunMilestone?.reward}</strong> {nextRunMilestone?.icon}</span>
                  <span>{runsToNext} runs to go</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{
                    width: `${nextRunMilestone
                      ? ((userRuns - (RUN_MILESTONES[RUN_MILESTONES.findIndex(m=>m.runs===nextRunMilestone.runs)-1]?.runs??0)) /
                         (nextRunMilestone.runs - (RUN_MILESTONES[RUN_MILESTONES.findIndex(m=>m.runs===nextRunMilestone.runs)-1]?.runs??0))) * 100
                      : 100}%`
                  }} />
                </div>
              </div>
              <div className="inc-prog-right">
                <span className="tag tag-gold">🪙 {userPoints.toLocaleString()} pts</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="page-container inc-body">

        {/* Tabs */}
        <div className="inc-tabs" role="tablist">
          {[
            { id: 'runs',      label: '🏃 Run Milestones' },
            { id: 'distance',  label: '📏 Distance Rewards' },
            { id: 'community', label: '👥 Community Points' },
            { id: 'redeem',    label: '🎁 Redeem' },
          ].map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`inc-tab${activeTab === t.id ? ' inc-tab--active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Run Milestones */}
        {activeTab === 'runs' && (
          <div className="inc-section">
            <p className="inc-section-intro">
              Rewards are automatically unlocked as you log runs. Physical rewards are mailed to your registered address within 2 weeks.
            </p>
            <div className="milestones-track">
              {RUN_MILESTONES.map((m, i) => {
                const earned = userRuns >= m.runs
                const isCurrent = nextRunMilestone?.runs === m.runs
                return (
                  <div key={i} className={`milestone-card card${earned ? ' milestone-card--earned' : ''}${isCurrent ? ' milestone-card--next' : ''}`}>
                    {isCurrent && <div className="milestone-next-badge">Next Up →</div>}
                    {earned && <div className="milestone-earned-badge">✓ Earned</div>}
                    <div className="milestone-top">
                      <span className="milestone-icon">{m.icon}</span>
                      <span className="milestone-runs">{m.runs} runs</span>
                    </div>
                    <h3 className="milestone-name">{m.reward}</h3>
                    <p className="milestone-desc">{m.desc}</p>
                    <span className={`tag ${TIER_COLORS[m.type]}`}>
                      {m.type === 'physical' ? '📦 Physical' : m.type === 'digital' ? '💻 Digital' : '🏅 Badge'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Distance Milestones */}
        {activeTab === 'distance' && (
          <div className="inc-section">
            <p className="inc-section-intro">Miles can be accumulated across all runs — no need to do it in one go.</p>
            <div className="milestones-track milestones-track--4">
              {DISTANCE_MILESTONES.map((m, i) => {
                const earned = userMiles >= m.miles
                return (
                  <div key={i} className={`milestone-card card${earned ? ' milestone-card--earned' : ''}`}>
                    {earned && <div className="milestone-earned-badge">✓ Earned</div>}
                    <div className="milestone-top">
                      <span className="milestone-icon">{m.icon}</span>
                      <span className="milestone-runs">{m.miles} mi</span>
                    </div>
                    <h3 className="milestone-name">{m.reward}</h3>
                    <p className="milestone-desc">{m.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Community Points */}
        {activeTab === 'community' && (
          <div className="inc-section">
            <p className="inc-section-intro">Earn points through community engagement. Points unlock digital rewards and count toward your level.</p>
            <div className="community-rewards-grid">
              {COMMUNITY_REWARDS.map((r, i) => (
                <div key={i} className="card community-reward-card">
                  <span className="cr-icon">{r.icon}</span>
                  <div className="cr-info">
                    <p className="cr-action">{r.action}</p>
                    <span className="level-badge">+{r.pts} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Redeem */}
        {activeTab === 'redeem' && (
          <div className="inc-section">
            <p className="inc-section-intro">Use your The Wheezy League points to claim gear, discounts, and partner perks.</p>
            <div className="redeem-grid">
              {[
                { name: 'Buff Headband',           pts: 400,  icon: '🧣', stock: true  },
                { name: 'Race Entry Credit ($25)',  pts: 1000, icon: '🏁', stock: true  },
                { name: 'Partner Inhaler Discount', pts: 600,  icon: '💨', stock: true  },
                { name: 'Foam Roller',              pts: 800,  icon: '🟤', stock: true  },
                { name: '1-Month BreathPro Free',   pts: 500,  icon: '🫁', stock: true  },
                { name: 'Donation to Asthma Research', pts: 300, icon: '❤️', stock: true },
                { name: 'The Wheezy League Cap',           pts: 1200, icon: '🧢', stock: false },
                { name: 'Running Socks (3-pack)',   pts: 700,  icon: '🧦', stock: true  },
              ].map((item, i) => {
                const canAfford = userPoints >= item.pts
                return (
                  <div key={i} className={`card redeem-card${!item.stock ? ' redeem-card--oos' : ''}${!canAfford ? ' redeem-card--locked' : ''}`}>
                    {!item.stock && <div className="oos-badge">Out of Stock</div>}
                    <span className="redeem-icon">{item.icon}</span>
                    <h3 className="redeem-name">{item.name}</h3>
                    <div className="redeem-footer">
                      <span className="level-badge">🪙 {item.pts.toLocaleString()} pts</span>
                      <button
                        className={`btn btn-sm ${canAfford && item.stock ? 'btn-primary' : 'btn-ghost'}`}
                        disabled={!canAfford || !item.stock}
                      >
                        {!canAfford ? `Need ${(item.pts - userPoints).toLocaleString()} more` : 'Redeem'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Fine print */}
        <div className="inc-fine-print card card--cream">
          <p>📦 Physical rewards are shipped to your registered address within 2–3 weeks of milestone. Available to members in the US, UK, Canada and Australia. International shipping coming soon.</p>
          <p>🪙 Points never expire. Milestones are tracked automatically as you log runs and community activity.</p>
          <p>Questions? <Link to="/contact">Contact us →</Link></p>
        </div>

      </div>
    </div>
  )
}
