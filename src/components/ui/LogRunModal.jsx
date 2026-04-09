import React, { useState, useEffect, useRef } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import './LogRunModal.css'

const SURFACES  = ['Road', 'Trail', 'Track', 'Treadmill', 'Grass']
const FEELS     = [
  { val: 1, label: 'Tough',    emoji: '😤' },
  { val: 2, label: 'Hard',     emoji: '😓' },
  { val: 3, label: 'Moderate', emoji: '😐' },
  { val: 4, label: 'Good',     emoji: '😊' },
  { val: 5, label: 'Great',    emoji: '🤩' },
]
const BREATH_LEVELS = [
  { val: 'fine',         label: 'Fine',          color: 'sage'  },
  { val: 'mild',         label: 'Mild wheeze',   color: 'amber' },
  { val: 'moderate',     label: 'Moderate',      color: 'rust'  },
  { val: 'used-inhaler', label: 'Used inhaler',  color: 'red'   },
]

const API_BASE        = import.meta.env.VITE_API_BASE_URL ?? '/api'
const STRAVA_CLIENT_ID   = import.meta.env.VITE_STRAVA_CLIENT_ID   || ''
// Must exactly match the Redirect URI registered in your Strava app settings
const STRAVA_REDIRECT_URI = import.meta.env.VITE_STRAVA_REDIRECT_URI  || `${window.location.origin}/strava/callback`
const MMR_CLIENT_ID     = import.meta.env.VITE_MAPMYRUN_CLIENT_ID || ''

function pad(n) { return String(n).padStart(2, '0') }

export default function LogRunModal({ onClose, onSave, initialTab = 'manual' }) {
  const { getAccessTokenSilently } = useAuth0()
  const [tab,     setTab]     = useState(initialTab)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [stravaConnected,   setStravaConnected]   = useState(false)
  const [stravaActivities,  setStravaActivities]  = useState([])
  const [stravaLoading,     setStravaLoading]      = useState(false)
  const [stravaError,       setStravaError]        = useState('')
  const overlayRef = useRef(null)

  const [form, setForm] = useState({
    date:        new Date().toISOString().split('T')[0],
    distMi:      '',
    durationH:   '0',
    durationM:   '30',
    durationS:   '00',
    surface:     'Road',
    feel:        3,
    breath:      'fine',
    notes:       '',
    inhalerUsed: false,
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const totalSecs = (
    parseInt(form.durationH || 0) * 3600 +
    parseInt(form.durationM || 0) * 60   +
    parseInt(form.durationS || 0)
  )
  const dist = parseFloat(form.distMi) || 0
  const paceStr = (dist > 0 && totalSecs > 0)
    ? (() => {
        const s = totalSecs / dist
        return `${pad(Math.floor(s / 60))}:${pad(Math.round(s % 60))}/mi`
      })()
    : null

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  // Auto-load Strava runs when modal opens directly on Strava tab
  useEffect(() => {
    if (initialTab === 'strava' && !stravaConnected) {
      fetchStravaActivities()
    }
  }, [initialTab])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.distMi || parseFloat(form.distMi) <= 0) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    setSuccess(true)
    setTimeout(() => { onSave?.(form); onClose() }, 1200)
  }

  const connectStrava = () => {
    if (!STRAVA_CLIENT_ID) {
      alert('Add VITE_STRAVA_CLIENT_ID to .env.local to enable Strava.\nSee docs/STRAVA_SETUP.md.')
      return
    }
    const p = new URLSearchParams({
      client_id:       STRAVA_CLIENT_ID,
      redirect_uri:    STRAVA_REDIRECT_URI,
      response_type:   'code',
      approval_prompt: 'auto',
      scope:           'read,activity:read_all',
    })
    window.location.href = `https://www.strava.com/oauth/authorize?${p}`
  }

  const connectMMR = () => {
    if (!MMR_CLIENT_ID) {
      alert('Add VITE_MAPMYRUN_CLIENT_ID to .env.local to enable MapMyRun.\nSee docs/MAPMYRUN_SETUP.md.')
      return
    }
    const p = new URLSearchParams({
      client_id:     MMR_CLIENT_ID,
      redirect_uri:  `${window.location.origin}/mapmyrun/callback`,
      response_type: 'code',
      scope:         'read',
    })
    window.location.href = `https://www.underarmour.com/auth/oauth/uacf/authorize?${p}`
  }

  const TABS = [
    { id: 'manual',    label: '✏️ Manual' },
    { id: 'strava',    label: '🟠 Strava' },
    { id: 'mapmyrun',  label: '🔵 MapMyRun' },
  ]

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog" aria-modal="true" aria-label="Log a run"
    >
      <div className="modal-panel log-run-modal">

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">🏃 Log a Run</h2>
            <p className="modal-subtitle">Track your effort and validate for challenges</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`modal-tab${tab === t.id ? ' modal-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ MANUAL ══ */}
        {tab === 'manual' && (
          <form className="log-form-body" onSubmit={handleSave}>
            {success && (
              <div className="log-success">
                <span>✅</span><span>Run logged! Great work 💪</span>
              </div>
            )}

            <div className="lrf-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="input"
                  value={form.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => set('date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Distance (miles)</label>
                <input type="number" className="input" placeholder="e.g. 3.1"
                  min="0.1" step="0.01" value={form.distMi}
                  onChange={e => set('distMi', e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Duration</label>
              <div className="duration-row">
                {[['durationH','h',23],['durationM','m',59],['durationS','s',59]].map(([k,u,mx]) => (
                  <div className="duration-field" key={k}>
                    <input type="number" className="input input-sm" min="0" max={mx}
                      value={form[k]} onChange={e => set(k, e.target.value)} />
                    <span className="duration-unit">{u}</span>
                  </div>
                ))}
                {paceStr && (
                  <div className="pace-badge">⚡ {paceStr}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Surface</label>
              <div className="chip-row">
                {SURFACES.map(s => (
                  <button key={s} type="button"
                    className={`choice-chip${form.surface === s ? ' choice-chip--active' : ''}`}
                    onClick={() => set('surface', s)}>{s}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">How did it feel?</label>
              <div className="feel-row">
                {FEELS.map(f => (
                  <button key={f.val} type="button"
                    className={`feel-btn${form.feel === f.val ? ' feel-btn--active' : ''}`}
                    onClick={() => set('feel', f.val)} title={f.label}>
                    <span>{f.emoji}</span>
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">🫁 Breathing</label>
              <div className="chip-row">
                {BREATH_LEVELS.map(b => (
                  <button key={b.val} type="button"
                    className={`choice-chip choice-chip--${b.color}${form.breath === b.val ? ' choice-chip--active' : ''}`}
                    onClick={() => set('breath', b.val)}>{b.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="form-check form-check--inline">
              <input type="checkbox" checked={form.inhalerUsed}
                onChange={e => set('inhalerUsed', e.target.checked)} />
              <span>💨 Inhaler used during this run</span>
            </label>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="input textarea" rows={2}
                placeholder="How was the run? Any observations…"
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            <div className="modal-actions">
              <button type="submit" className="btn btn-primary"
                disabled={saving || !form.distMi || success}>
                {saving ? 'Saving…' : success ? '✓ Saved!' : '💾 Save Run'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}

        {/* ══ STRAVA ══ */}
        {tab === 'strava' && (
          <div className="integration-body">

            {/* Loading */}
            {stravaLoading && (
              <div className="strava-loading-state">
                <div className="strava-spinner" />
                <p>Loading your Strava runs…</p>
              </div>
            )}

            {/* Error */}
            {!stravaLoading && stravaError && (
              <div className="strava-error-state">
                <p className="strava-error-msg">{stravaError}</p>
                <div className="int-btn-row">
                  <button className="btn int-connect-btn strava-btn" onClick={connectStrava}>🟠 Reconnect Strava</button>
                  <button className="btn btn-ghost btn-sm" onClick={fetchStravaActivities}>Retry</button>
                </div>
              </div>
            )}

            {/* Activities list */}
            {!stravaLoading && !stravaError && stravaConnected && stravaActivities.length > 0 && (
              <>
                <div className="strava-header-row">
                  <div>
                    <span className="strava-badge">🟠 Strava Connected</span>
                    <p className="strava-header-hint">Tap a run to fill in the log form</p>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setStravaConnected(false); setStravaActivities([]) }}>Disconnect</button>
                </div>
                <div className="strava-activities">
                  {stravaActivities.map(a => {
                    const km      = a.distance / 1000
                    const mi      = km * 0.621371
                    const distStr = mi.toFixed(2)
                    const secsPerMi = a.moving_time / mi
                    const paceStr = mi > 0 && a.moving_time > 0
                      ? `${Math.floor(secsPerMi / 60)}:${String(Math.round(secsPerMi % 60)).padStart(2,'0')}/mi`
                      : ''
                    const dateStr = new Date(a.start_date_local).toLocaleDateString('en-US', { month:'short', day:'numeric' })
                    return (
                      <button key={a.id} className="strava-activity-row" onClick={() => {
                        setForm(f => ({ ...f,
                          distMi:    distStr,
                          durationH: String(Math.floor(a.moving_time / 3600)),
                          durationM: String(Math.floor((a.moving_time % 3600) / 60)).padStart(2, '0'),
                          durationS: String(a.moving_time % 60).padStart(2, '0'),
                          date:      new Date(a.start_date_local).toISOString().split('T')[0],
                          notes:     a.name,
                        }))
                        setTab('manual')
                      }}>
                        <div className="strava-act-main">
                          <span className="strava-act-name">{a.name}</span>
                          <span className="strava-act-meta">{dateStr}</span>
                        </div>
                        <div className="strava-act-stats">
                          <span>{distStr} mi</span>
                          {paceStr && <span>{paceStr}</span>}
                        </div>
                        <span className="strava-act-arrow">→</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {/* Not connected yet */}
            {!stravaLoading && !stravaError && !stravaConnected && (
              <>
                <div className="int-hero">
                  <span className="int-logo strava-color">🟠</span>
                  <h3>Import from Strava</h3>
                  <p>Connect once, then pick any recent run to auto-fill the log form.</p>
                </div>
                {STRAVA_CLIENT_ID ? (
                  <div className="int-btn-col">
                    <button className="btn int-connect-btn strava-btn" onClick={connectStrava}>
                      🟠 Connect with Strava
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={fetchStravaActivities}>
                      Already connected — load runs
                    </button>
                    <p className="int-note">You'll authorise on Strava, then land back here with your runs ready.</p>
                  </div>
                ) : (
                  <p className="int-not-configured">Strava not configured — add VITE_STRAVA_CLIENT_ID to your environment.</p>
                )}
              </>
            )}

          </div>
        )}

        {/* ══ MAPMYRUN ══ */}
        {tab === 'mapmyrun' && (
          <div className="integration-body">
            <div className="int-hero">
              <span className="int-logo mmr-color">🔵</span>
              <h3>MapMyRun</h3>
              <p>Sync runs from MapMyRun (by Under Armour) using their free Connected Fitness API. Works with any Under Armour app.</p>
            </div>
            <div className="int-features">
              {[
                { icon:'✅', t:'Auto-validated',    d:'Workouts sync and validate for challenges automatically.' },
                { icon:'🏃', t:'MapMyRun + UA apps', d:'Works with MapMyRun, MapMyWalk, MapMyFitness and more.' },
                { icon:'🔒', t:'Read-only scope',   d:'We only request read access to your workouts.' },
                { icon:'🆓', t:'Free API',          d:'Under Armour Connected Fitness API — no cost for standard use.' },
              ].map(f => (
                <div key={f.t} className="int-feature">
                  <span>{f.icon}</span>
                  <div><strong>{f.t}</strong><p>{f.d}</p></div>
                </div>
              ))}
            </div>
            <div className="int-setup">
              <p className="int-setup-label">⚙️ Quick setup</p>
              <ol>
                <li>Register at <a href="https://developer.underarmour.com" target="_blank" rel="noreferrer">developer.underarmour.com</a></li>
                <li>Create an app — choose "Connected Fitness" product</li>
                <li>Add <code>VITE_MAPMYRUN_CLIENT_ID</code> + backend <code>MAPMYRUN_CLIENT_SECRET</code> to your .env files</li>
                <li>Full guide: <code>docs/MAPMYRUN_SETUP.md</code></li>
              </ol>
            </div>
            <button className="btn int-connect-btn mmr-btn" onClick={connectMMR}>
              {MMR_CLIENT_ID ? '🔵 Connect MapMyRun' : '📖 View Setup Guide'}
            </button>
            <p className="int-note">
              Also works with MapMyWalk, MapMyFitness, and any app using the Under Armour platform.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
