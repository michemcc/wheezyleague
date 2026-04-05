import React, { useEffect, useRef } from 'react'
import './ChallengeModal.css'

const CHALLENGE_DETAILS = {
  1: {
    howItWorks: [
      'Log any run of 3.1 miles (5K) or more at any pace.',
      'You can split it across multiple segments — it counts.',
      'Must be completed before the deadline.',
    ],
    rules: 'Any surface, any time of day, any weather. Walking portions are allowed. The goal is to finish.',
    tip: '💡 Cold morning? Run indoors on a treadmill — it still counts. Your lungs, your rules.',
    participants: [
      { emoji: '🧑‍🦱', name: 'Marcus T.', progress: 100 },
      { emoji: '👩', name: 'Aisha P.',  progress: 78  },
      { emoji: '🧑🏽', name: 'Sam O.',   progress: 45  },
    ],
  },
  2: {
    howItWorks: [
      'Log a run that starts before 6:00 AM local time.',
      'Complete this 5 times in the calendar month.',
      'Each qualifying run earns a sunrise stamp on your profile.',
    ],
    rules: 'Minimum distance: 0.5 miles. Must log the run within 24 hours of completing it.',
    tip: '💡 Lay out your kit the night before. Lower your barrier, and you\'ll be surprised how often you go.',
    participants: [
      { emoji: '🧑🏻', name: 'Leo M.',   progress: 100 },
      { emoji: '👩‍🦰', name: 'Leila H.', progress: 60  },
    ],
  },
  3: {
    howItWorks: [
      'Connect with a partner through the The Wheezy League buddy system.',
      'Both of you log runs on the same day (virtual runs count).',
      'Do this 3 times to complete the challenge.',
    ],
    rules: 'Runs don\'t have to be at the same time — just on the same calendar day. Partner must be a The Wheezy League member.',
    tip: '💡 Even a 10-minute run counts. Consistency over distance.',
    participants: [
      { emoji: '🧑‍🦳', name: 'David K.', progress: 100 },
      { emoji: '🧑🏽', name: 'Sam O.',    progress: 33  },
    ],
  },
}

export default function ChallengeModal({ challenge, joined, onClose, onToggleJoin }) {
  const overlayRef = useRef(null)
  const details    = CHALLENGE_DETAILS[challenge.id] || {}

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  const isJoined = joined

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog" aria-modal="true"
      aria-label={`Challenge: ${challenge.name}`}
    >
      <div className="modal-panel challenge-modal">

        {/* Header */}
        <div className="ch-modal-hero">
          {challenge.featured && <div className="ch-featured-tag">🏆 Featured Challenge</div>}
          <div className="ch-modal-emoji">{challenge.emoji}</div>
          <div className="ch-modal-header-right">
            <h2 className="ch-modal-title">{challenge.name}</h2>
            <div className="ch-modal-meta">
              <span className="tag tag-gold">+{challenge.points} pts</span>
              <span>📅 {challenge.daysLeft} days left</span>
              <span>👥 {challenge.joined?.toLocaleString()} joined</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ch-modal-body">
          {/* Description */}
          <p className="ch-modal-desc">{challenge.desc}</p>

          {/* Progress (if joined) */}
          {isJoined && challenge.progress > 0 && (
            <div className="ch-progress-block">
              <div className="progress-label">
                <span>Your progress</span>
                <span className="progress-pct">{challenge.progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${challenge.progress}%` }} />
              </div>
            </div>
          )}

          {/* Tags */}
          {challenge.tags?.length > 0 && (
            <div className="ch-tags">
              {challenge.tags.map(t => <span key={t} className="tag tag-earth">{t}</span>)}
            </div>
          )}

          {/* How it works */}
          {details.howItWorks && (
            <div className="ch-section">
              <h3 className="ch-section-title">📋 How It Works</h3>
              <ol className="ch-steps">
                {details.howItWorks.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Rules */}
          {details.rules && (
            <div className="ch-section">
              <h3 className="ch-section-title">📌 Rules</h3>
              <p className="ch-rules">{details.rules}</p>
            </div>
          )}

          {/* Tip */}
          {details.tip && (
            <div className="ch-tip">{details.tip}</div>
          )}

          {/* Participants preview */}
          {details.participants?.length > 0 && (
            <div className="ch-section">
              <h3 className="ch-section-title">🏃 Active Participants</h3>
              <div className="ch-participants">
                {details.participants.map((p, i) => (
                  <div key={i} className="ch-participant">
                    <div className="avatar avatar-sm">{p.emoji}</div>
                    <div className="ch-p-info">
                      <span className="ch-p-name">{p.name}</span>
                      <div className="progress-track ch-p-bar">
                        <div
                          className={`progress-fill progress-fill--${p.progress === 100 ? 'sage' : 'sky'}`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="ch-p-pct">{p.progress}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="ch-modal-footer">
          <button
            className={`btn ${isJoined ? 'btn-outline' : challenge.featured ? 'btn-primary' : 'btn-primary'}`}
            onClick={() => { onToggleJoin(challenge.id); onClose() }}
          >
            {isJoined ? '✕ Leave Challenge' : '🏃 Join Challenge'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
