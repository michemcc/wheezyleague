import React, { useState, useEffect, useRef } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import useAuth from '../hooks/useAuth'
import { getProfile, updateProfile } from '../services/dataService'
import { useDemo } from '../context/DemoContext'
import useAqi from '../hooks/useAqi'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user } = useAuth0()
  const { getToken } = useAuth()
  const { isDemo, setAvatarUrl } = useDemo()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing]   = useState(false)
  const [saving,  setSaving]    = useState(false)
  const [saved,   setSaved]     = useState(false)
  const [form,    setForm]       = useState({})
  const [avatarPreview, setAvatarPreview] = useState(null)
  const fileInputRef = useRef(null)
  const formTopRef   = useRef(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = isDemo ? null : await getToken().catch(() => null)
        const p = await getProfile(user?.sub || 'demo', isDemo, token)
        if (p) { setProfile(p); setForm(p) }
      } catch (e) { console.error('Profile load error:', e) }
    }
    loadProfile()
  }, [user, isDemo])

  // Scroll to top of form when editing starts
  useEffect(() => {
    if (editing && formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [editing])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = avatarPreview ? { ...form, avatarPreview } : form
    const token   = isDemo ? null : await getToken().catch(() => null)
    const updated = await updateProfile(user?.sub || 'demo', payload, isDemo, token)
    setProfile(updated)
    setSaving(false)
    setEditing(false)
    setSaved(true)
    // Sync avatar to navbar
    if (avatarPreview) setAvatarUrl(avatarPreview)
    setTimeout(() => setSaved(false), 2500)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Avatar is ALWAYS clickable — no need to be in edit mode
  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const preview = ev.target.result
      setAvatarPreview(preview)
      // Auto-save avatar immediately even outside edit mode
      if (!editing) {
        const updated = await updateProfile(user?.sub || 'demo', { ...form, avatarPreview: preview }, isDemo)
        setProfile(updated)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    }
    reader.readAsDataURL(file)
  }

  const aqi = useAqi(profile?.city || '')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const startEdit = () => {
    setEditing(true)
    setForm(profile)
  }

  const cancelEdit = () => {
    setEditing(false)
    setAvatarPreview(null)
    setForm(profile)
  }

  if (!profile) return (
    <div className="page-container profile-page">
      <div className="profile-loading">
        <div className="profile-loading-ring" />
        <p>Loading profile…</p>
      </div>
    </div>
  )

  const xpPct = Math.round((profile.xp / profile.xpToNext) * 100)
  const currentAvatar = avatarPreview || user?.picture || null

  return (
    <div className="page-container profile-page" ref={formTopRef}>

      {/* ── Hero banner ── */}
      <div className="profile-hero">
        <div className="profile-hero-bg" aria-hidden="true">
          <div className="ph-ring ph-ring-1" /><div className="ph-ring ph-ring-2" />
        </div>
        <div className="profile-hero-inner">

          {/* Avatar — clickable when editing */}
          <div className="profile-avatar-wrap">
            <button
              className="profile-avatar-btn profile-avatar-btn--always"
              onClick={handleAvatarClick}
              title="Click to change profile photo"
              aria-label="Change profile photo"
              type="button"
            >
              <div className="avatar avatar-xl profile-avatar">
                {currentAvatar
                  ? <img src={currentAvatar} alt={profile.name} />
                  : <span>{profile.name?.[0] || '?'}</span>
                }
              </div>
              <div className="avatar-edit-overlay" aria-hidden="true">
                <span>📷</span>
                <p>Change</p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
              aria-label="Upload profile photo"
            />
            <div className="level-badge profile-level">Lv.{profile.level}</div>
          </div>

          <div className="profile-hero-info">
            <div className="profile-name-row">
              <h1 className="profile-name">{editing ? form.name || profile.name : profile.name}</h1>
              <span className="tag tag-gold">{profile.badgeIcon} {profile.badge}</span>
            </div>
            <p className="profile-username">@{profile.username}</p>
            {!editing && <p className="profile-bio">{profile.bio}</p>}
            <p className="profile-city">
              📍 {profile.city || 'No location set'} · Member since {profile.joinedDate}
              {aqi.aqi && (
                <span className="profile-aqi-badge" title={aqi.label}>
                  {aqi.icon} AQI {aqi.aqi}
                </span>
              )}
            </p>
            <div className="profile-xp-wrap">
              <div className="xp-label-row">
                <span>Level {profile.level} — {profile.badge}</span>
                <span>{profile.xp} / {profile.xpToNext} XP ({xpPct}%)</span>
              </div>
              <div className="xp-track xp-track--lg"><div className="xp-fill" style={{ width: `${xpPct}%` }} /></div>
              <p className="xp-to-next">{profile.xpToNext - profile.xp} XP to Level {profile.level + 1}</p>
            </div>
          </div>

          <button
            className={`btn ${editing ? 'btn-ghost' : 'btn-primary'} profile-edit-btn`}
            onClick={editing ? cancelEdit : startEdit}
            type="button"
          >
            {editing ? '✕ Cancel' : '✏️ Edit Profile'}
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="profile-stats-row">
        {[
          { icon:'🏃', val: profile.totalMiles,   unit:'mi',   label:'Total Miles' },
          { icon:'📅', val: profile.totalRuns,    unit:'runs', label:'Total Runs' },
          { icon:'📏', val: profile.longestRun,   unit:'mi',   label:'Longest Run' },
          { icon:'⚡', val: profile.favoritePace, unit:'/mi',  label:'Avg Pace' },
          { icon:'🔥', val: profile.streak,       unit:'d',    label:'Streak' },
          { icon:'⭐', val: profile.bestStreak,   unit:'d',    label:'Best Streak' },
          { icon:'🪙', val: (profile.points||0).toLocaleString(), unit:'pts', label:'Points' },
        ].map((s, i) => (
          <div key={i} className="card profile-stat-card">
            <span className="psc-icon">{s.icon}</span>
            <span className="psc-val">{s.val}<span className="psc-unit">{s.unit}</span></span>
            <span className="psc-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Edit form (shown ABOVE achievements when editing) ── */}
      {editing && (
        <section className="card profile-section profile-section--edit">
          <h2 className="profile-section-title">✏️ Edit Profile</h2>
          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input className="input" value={form.name||''} onChange={e=>set('name',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Username / Alias</label>
                <div className="input-prefix-wrap">
                  <span className="input-prefix">@</span>
                  <input className="input input-prefixed" value={form.username||''} onChange={e=>set('username',e.target.value)} placeholder="handle" />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="input textarea" rows={3} value={form.bio||''} onChange={e=>set('bio',e.target.value)} placeholder="Tell the community about your running journey…" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="input" value={form.city||''} onChange={e=>set('city',e.target.value)} placeholder="Boston, MA" />
                <p className="form-hint">Used for live air quality data on your dashboard</p>
              </div>
              <div className="form-group">
                <label className="form-label">Distance Unit</label>
                <select className="input" value={form.distanceUnit||'mi'} onChange={e=>set('distanceUnit',e.target.value)}>
                  <option value="mi">Miles (mi)</option>
                  <option value="km">Kilometres (km)</option>
                </select>
              </div>
            </div>
            <div className="form-divider"><span>🫁 Asthma Info</span></div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Asthma Type</label>
                <input className="input" value={form.asthmaType||''} onChange={e=>set('asthmaType',e.target.value)} placeholder="e.g. Exercise-induced" />
              </div>
              <div className="form-group">
                <label className="form-label">Inhaler Type</label>
                <input className="input" value={form.inhalerType||''} onChange={e=>set('inhalerType',e.target.value)} placeholder="e.g. Albuterol rescue" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Year Diagnosed</label>
                <input className="input" value={form.diagnosedYear||''} onChange={e=>set('diagnosedYear',e.target.value)} placeholder="e.g. 2021" />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact</label>
                <input className="input" value={form.emergencyContact||''} onChange={e=>set('emergencyContact',e.target.value)} placeholder="Name & phone" />
              </div>
            </div>
            <div className="form-divider"><span>🔔 Notifications</span></div>
            <div className="form-checks">
              {[
                { key:'notifyAqi',       label:'AQI alerts for my city' },
                { key:'notifyChallenges',label:'Challenge milestones & reminders' },
              ].map(({ key, label }) => (
                <label key={key} className="form-check">
                  <input type="checkbox" checked={!!form[key]} onChange={e=>set(key,e.target.checked)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="profile-form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : '💾 Save Changes'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      <div className="profile-body">
        {/* Achievements */}
        <section className="card profile-section">
          <h2 className="profile-section-title">🏅 Achievements</h2>
          <div className="achievements-grid">
            {profile.achievements.map(a => (
              <div key={a.id} className={`achievement${a.earned ? '' : ' achievement--locked'}`} title={a.earned ? `Earned ${a.date}` : 'Not yet earned'}>
                <div className="achievement-icon">{a.icon}</div>
                <span className="achievement-label">{a.label}</span>
                {a.earned && <span className="achievement-date">{a.date}</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Details (only shown when not editing) */}
        {!editing && (
          <section className="card profile-section">
            <h2 className="profile-section-title">👤 Profile Details</h2>
            <div className="profile-details-grid">
              {[
                { icon:'📍', label:'Location',      val: profile.city },
                { icon:'🫁', label:'Asthma Type',   val: profile.asthmaType },
                { icon:'💨', label:'Inhaler',        val: profile.inhalerType },
                { icon:'📅', label:'Diagnosed',      val: profile.diagnosedYear },
                { icon:'📏', label:'Distance Unit',  val: profile.distanceUnit === 'mi' ? 'Miles' : 'Kilometres' },
                { icon:'🗓️', label:'Member Since',  val: profile.joinedDate },
              ].map(d => (
                <div key={d.label} className="profile-detail-row">
                  <span className="pd-icon">{d.icon}</span>
                  <span className="pd-label">{d.label}</span>
                  <span className="pd-val">{d.val || '—'}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {saved && (
        <div className="save-toast" role="status" aria-live="polite">✅ Profile saved!</div>
      )}
    </div>
  )
}
