import React, { useState, useEffect, useCallback } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useSearchParams } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { useDemo } from '../context/DemoContext'
import { getDashboard, getProfile } from '../services/dataService'
import useAqi from '../hooks/useAqi'
import LogRunModal from '../components/ui/LogRunModal'
import './DashboardPage.css'

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function StatCard({ icon, label, value, unit, sub, color = 'rust', empty }) {
  return (
    <div className={`card stat-card${empty ? ' stat-card--empty' : ''}`}>
      <div className="stat-card-top">
        <span className="stat-card-icon">{icon}</span>
        <span className="stat-card-label">{label}</span>
      </div>
      {empty
        ? <div className="empty-val">—<span className="pending-dot" /></div>
        : <div className={`stat-card-value stat-card-value--${color}`}>{value}<span className="stat-card-unit">{unit}</span></div>
      }
      {!empty && sub && <p className="stat-card-sub">{sub}</p>}
      {empty && <p className="stat-card-sub pending-text">Pending backend data</p>}
    </div>
  )
}

function PendingBanner() {
  return (
    <div className="pending-banner">
      <span className="pending-banner-icon">🔌</span>
      <div>
        <strong>Live Mode Active</strong>
        <p>Connect your backend to stream real data. Fields will populate once the API responds.</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0()
  const { getToken } = useAuth()
  const { isDemo } = useDemo()
  const [data,         setData]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [logRunOpen,    setLogRunOpen]   = useState(false)
  const [initialTab,    setInitialTab]   = useState('manual')
  const [searchParams,  setSearchParams] = useSearchParams()
  const [logEntry,     setLogEntry]     = useState('')
  const [logEntries,   setLogEntries]   = useState([])
  const [userLocation, setUserLocation] = useState('')

  // Auto-open Log Run modal on Strava tab after OAuth callback
  // Also exchange the pending Strava code if one was stashed
  useEffect(() => {
    if (searchParams.get('openStrava') !== '1') return

    // Clean URL immediately
    setSearchParams({}, { replace: true })

    const pendingCode = sessionStorage.getItem('strava_pending_code')
    if (pendingCode) {
      sessionStorage.removeItem('strava_pending_code')
      // Exchange the code in the background — user is authenticated here
      const doExchange = async () => {
        try {
          const token = await getToken()
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/strava/connect`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: pendingCode }),
            }
          )
          if (!res.ok) console.error('Strava exchange failed:', await res.json().catch(() => ({})))
          // Whether it worked or not, open the modal — LogRunModal will fetch activities
        } catch (e) {
          console.error('Strava exchange error:', e)
        } finally {
          setInitialTab('strava')
          setLogRunOpen(true)
        }
      }
      doExchange()
    } else {
      // No pending code — just open the modal on Strava tab
      setInitialTab('strava')
      setLogRunOpen(true)
    }
  }, [])

  // Load user's saved location for AQI
  useEffect(() => {
    if (!user?.sub || isDemo) return
    const load = async () => {
      const token = await getToken().catch(() => null)
      const p = await getProfile(user.sub, false, token)
      if (p?.city) setUserLocation(p.city)
    }
    load()
  }, [user?.sub, isDemo])

  const aqi = useAqi(isDemo ? 'Boston, MA' : userLocation)

  useEffect(() => {
    if (!isDemo && (authLoading || !isAuthenticated)) return
    setLoading(true)
    const load = async () => {
      try {
        const token = isDemo ? null : await getToken().catch(() => null)
        const d = await getDashboard(user?.sub || 'demo', isDemo, token)
        setData(d || {})
        setLogEntries(d?.inhalerLog || [])
      } catch {
        setData({})
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isDemo, user?.sub, authLoading, isAuthenticated])

  const handleAddLog = (e) => {
    e.preventDefault()
    if (!logEntry.trim()) return
    const now  = new Date()
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    setLogEntries(prev => [...prev, { time, note: logEntry, tag: 'Manual', tagClass: 'tag-earth' }])
    setLogEntry('')
  }

  const firstName = user?.given_name || user?.name?.split(' ')[0] || 'Runner'
  const empty     = !isDemo && !data

  return (
    <div className="page-container dashboard-page">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-greeting">Good morning, <em>{firstName}</em> 👋</h1>
          <p className="dashboard-date">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setLogRunOpen(true)}>+ Log Run</button>
      </div>

      {/* Live mode notice */}
      {!isDemo && <PendingBanner />}

      {/* XP bar */}
      {(isDemo || data) && (
        <div className="card dash-xp-bar">
          <div className="dash-xp-left">
            <span className="level-badge">⭐ Level {data?.level ?? 12}</span>
            <span className="dash-xp-pts">🪙 {(data?.points ?? 1550).toLocaleString()} pts</span>
          </div>
          <div className="dash-xp-center">
            <div className="xp-label-row">
              <span>XP Progress</span>
              <span>{data?.xp ?? 3400} / {data?.xpToNext ?? 4000}</span>
            </div>
            <div className="xp-track">
              <div className="xp-fill" style={{ width: `${((data?.xp ?? 3400) / (data?.xpToNext ?? 4000)) * 100}%` }} />
            </div>
          </div>
          <div className="dash-xp-right">
            <span className="dash-streak-pill">🔥 {data?.streak ?? 23}-day streak</span>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="stats-row-grid">
        <StatCard icon="🏃" label="This Week"   value={data?.weeklyMiles}  unit=" mi"   sub={`${data?.weeklySessions ?? 0} sessions`}           color="rust"  empty={empty} />
        <StatCard icon="⚡" label="Avg Pace"    value={data?.avgPace}      unit="/mi"   sub="↑ 0:18 from last week"                              color="sky"   empty={empty || !data?.avgPace} />
        <StatCard icon="🔥" label="Streak"      value={data?.streak}       unit=" days" sub={`Best: ${data?.bestStreak ?? 0} days`}              color="amber" empty={empty} />
        <StatCard icon="🎯" label="Weekly Goal" value={data ? Math.round((data.weeklyMiles / data.weeklyGoal) * 100) : null} unit="%" sub={`${data?.weeklyMiles ?? 0} / ${data?.weeklyGoal ?? 25} mi`} color="sage" empty={empty} />
      </div>

      {/* Main grid */}
      <div className="dashboard-grid">

        {/* Weekly bars */}
        <div className="card dash-card dash-card--wide">
          <div className="dash-card-header"><span>📈 Weekly Distance</span></div>
          {empty ? (
            <div className="empty-chart"><span>📊</span><p>Distance data pending</p></div>
          ) : (
            <>
              <div className="progress-wrap" style={{ marginBottom: '1.25rem' }}>
                <div className="progress-label">
                  <span>Goal</span>
                  <span>{data?.weeklyMiles ?? 0} / {data?.weeklyGoal ?? 25} mi</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min(100, ((data?.weeklyMiles ?? 0) / (data?.weeklyGoal ?? 25)) * 100)}%` }} />
                </div>
              </div>
              <div className="week-bar-grid">
                {(data?.weekBars ?? [0,0,0,0,0,0,0]).map((mi, i) => (
                  <div key={i} className="week-bar-col">
                    <span className="week-bar-val">{mi > 0 ? `${mi}mi` : ''}</span>
                    <div className="week-bar-track">
                      <div className="week-bar-fill" style={{ height: `${mi > 0 ? (mi / 6) * 100 : 0}%` }} />
                    </div>
                    <span className="week-bar-day">{WEEK_DAYS[i]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* AQI */}
        <div className="card dash-card">
          <div className="dash-card-header"><span>🌬️ Air Quality</span></div>
          {aqi.loading ? (
            <div className="empty-chart"><span>🌍</span><p>Loading AQI…</p></div>
          ) : !aqi.aqi && !userLocation && !isDemo ? (
            <div className="empty-chart aqi-no-location">
              <span>📍</span>
              <p>Add your city on your <a href="/profile">profile page</a> to see live air quality.</p>
            </div>
          ) : aqi.aqi ? (
            <>
              <div className="aqi-main">
                <div className={`aqi-circle aqi-${aqi.color}`}>
                  <span className="aqi-num">{aqi.aqi}</span>
                  <span className="aqi-word">{aqi.label}</span>
                </div>
                <div className="aqi-rows">
                  {aqi.pm25  != null && <div className="aqi-row"><span>PM2.5</span><span className="aqi-val-ok">{aqi.pm25} μg/m³</span></div>}
                  {aqi.pm10  != null && <div className="aqi-row"><span>PM10</span><span className="aqi-val-ok">{aqi.pm10} μg/m³</span></div>}
                  <div className="aqi-row"><span>Safe to run?</span><span className={aqi.safe ? 'aqi-val-ok' : 'aqi-val-warn'}>{aqi.safe ? '✓ Yes' : '⚠ Take care'}</span></div>
                  <div className="aqi-row"><span>Location</span><span className="aqi-val-ok" style={{fontSize:'0.7rem'}}>{aqi.location}</span></div>
                </div>
              </div>
              <div className="aqi-advice">{aqi.safe ? 'Good conditions for your run today.' : 'Consider indoor training or a mask.'}</div>
            </>
          ) : (
            <div className="empty-chart"><span>🌍</span><p>AQI data pending</p></div>
          )}
        </div>

        {/* Streak */}
        <div className="card dash-card">
          <div className="dash-card-header"><span>🔥 Run Streak</span></div>
          {empty ? (
            <div className="empty-chart"><span>🔥</span><p>Streak data pending</p></div>
          ) : (
            <>
              <div className="streak-display">
                <span className="streak-num">{data?.streak ?? 0}</span>
                <span className="streak-label">days</span>
              </div>
              <div className="streak-dots">
                {WEEK_DAYS.map((d, i) => (
                  <div key={i} className={`streak-dot${i < 5 ? ' streak-dot--done' : i === 5 ? ' streak-dot--today' : ''}`}>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
              <p className="streak-msg">You're <strong>7 days</strong> from your best streak! 💪</p>
            </>
          )}
        </div>

        {/* Symptom log */}
        <div className="card dash-card">
          <div className="dash-card-header"><span>💨 Symptom Log</span></div>
          {empty && logEntries.length === 0 ? (
            <div className="empty-chart"><span>💨</span><p>Log data pending</p></div>
          ) : (
            <div className="log-entries">
              {logEntries.map((e, i) => (
                <div key={i} className="log-entry">
                  <span className="log-time">{e.time}</span>
                  <span className="log-note">{e.note}</span>
                  <span className={`tag ${e.tagClass}`}>{e.tag}</span>
                </div>
              ))}
            </div>
          )}
          <form className="log-form" onSubmit={handleAddLog}>
            <input className="input" placeholder="Add a note…" value={logEntry}
              onChange={e => setLogEntry(e.target.value)} />
            <button type="submit" className="btn btn-sm btn-primary" disabled={!logEntry.trim()}>Add</button>
          </form>
        </div>

        {/* Active challenges */}
        <div className="card dash-card dash-card--wide">
          <div className="dash-card-header"><span>🏆 Active Challenges</span></div>
          {empty ? (
            <div className="empty-chart"><span>🏆</span><p>Challenge data pending</p></div>
          ) : (
            <div className="challenges-mini">
              {(data?.activeChallenges ?? []).map(c => (
                <div key={c.name} className="challenge-mini">
                  <span className="challenge-mini-emoji">{c.emoji}</span>
                  <div className="challenge-mini-info">
                    <div className="challenge-mini-top">
                      <span className="challenge-mini-name">{c.name}</span>
                      <span className="challenge-mini-days">{c.days}d left</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${c.progress}%` }} />
                    </div>
                    <span className="challenge-mini-pct">{c.progress}% complete</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Log Run modal — rendered at page root, never inside child components */}
      {logRunOpen && (
        <LogRunModal
          initialTab={initialTab}
          onClose={() => { setLogRunOpen(false); setInitialTab('manual') }}
          onSave={() => { setLogRunOpen(false); setInitialTab('manual') }}
        />
      )}

    </div>
  )
}
