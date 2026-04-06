import React, { useState, useEffect, useCallback } from 'react'
import { useDemo } from '../context/DemoContext'
import useAuth from '../hooks/useAuth'
import './AdminPage.css'

const API = import.meta.env.VITE_API_BASE_URL ?? '/api'

// ── Mock admin data for demo mode ─────────────────────────────────────────────
const DEMO_REWARDS = [
  { id: 'rw-1', icon: '🧣', name: 'Buff Headband',             pts: 400,  stock: true,  description: 'The Wheezy League branded headband.' },
  { id: 'rw-2', icon: '🏁', name: 'Race Entry Credit ($25)',   pts: 1000, stock: true,  description: '$25 toward any partner race entry.' },
  { id: 'rw-3', icon: '💨', name: 'Partner Inhaler Discount',  pts: 600,  stock: true,  description: '20% off partner pharmacy. UK/US only.' },
  { id: 'rw-4', icon: '🟤', name: 'Foam Roller',               pts: 800,  stock: true,  description: 'High-density foam roller, shipped.' },
  { id: 'rw-5', icon: '🧢', name: 'The Wheezy League Cap',     pts: 1200, stock: false, description: 'Limited edition. Back in stock soon.' },
]
const DEMO_CHALLENGES = [
  { id: 'ch-1', emoji: '🌬️', name: 'Wheeze to Ease 5K',  points: 500, daysLeft: 14, featured: true,  joined: 3241 },
  { id: 'ch-2', emoji: '🌅', name: '5AM Sunrise Club',    points: 300, daysLeft: 21, featured: false, joined: 891  },
  { id: 'ch-3', emoji: '🤝', name: 'Buddy System Sprint', points: 250, daysLeft: 7,  featured: false, joined: 512  },
]
const DEMO_STATS = { totalUsers: 14200, totalPosts: 3847, totalChallenges: 3, totalRewards: 5, rewardsInStock: 4 }

function StatPill({ label, value, color = 'orange' }) {
  return (
    <div className={`admin-stat-pill admin-stat-pill--${color}`}>
      <span className="admin-stat-num">{typeof value === 'number' ? value.toLocaleString() : value}</span>
      <span className="admin-stat-label">{label}</span>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="admin-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal" role="dialog" aria-modal="true">
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">{title}</h3>
          <button className="admin-modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Rewards section ───────────────────────────────────────────────────────────
function RewardsSection({ isDemo, getToken }) {
  const [rewards, setRewards]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(null)   // null | 'new' | reward obj
  const [saving,  setSaving]    = useState(false)
  const [form,    setForm]      = useState({ icon: '', name: '', pts: '', stock: true, description: '' })
  const [toast,   setToast]     = useState('')

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2800) }

  const load = useCallback(async () => {
    setLoading(true)
    if (isDemo) { setRewards(DEMO_REWARDS); setLoading(false); return }
    try {
      const token = await getToken()
      const res   = await fetch(`${API}/admin/rewards`, { headers: { Authorization: `Bearer ${token}` } })
      setRewards(await res.json())
    } catch (e) {
      showToast('API error: ' + (e.message || 'check backend is running'))
      setRewards([])
    }
    finally { setLoading(false) }
  }, [isDemo, getToken])

  useEffect(() => { load() }, [load])

  const openNew  = () => { setForm({ icon: '🎁', name: '', pts: '', stock: true, description: '' }); setEditing('new') }
  const openEdit = r  => { setForm({ icon: r.icon, name: r.name, pts: r.pts, stock: r.stock, description: r.description || '' }); setEditing(r) }

  const save = async () => {
    if (!form.name || !form.pts) return
    setSaving(true)
    try {
      if (isDemo) {
        if (editing === 'new') setRewards(r => [{ id: `rw-${Date.now()}`, ...form, pts: Number(form.pts) }, ...r])
        else setRewards(r => r.map(x => x.id === editing.id ? { ...x, ...form, pts: Number(form.pts) } : x))
        showToast(editing === 'new' ? 'Reward created' : 'Reward updated')
        setEditing(null); return
      }
      const token   = await getToken()
      const method  = editing === 'new' ? 'POST' : 'PATCH'
      const url     = editing === 'new' ? `${API}/admin/rewards` : `${API}/admin/rewards/${editing.id}`
      const res     = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, pts: Number(form.pts) }) })
      const data    = await res.json()
      if (editing === 'new') setRewards(r => [data, ...r])
      else setRewards(r => r.map(x => x.id === data.id ? data : x))
      showToast(editing === 'new' ? 'Reward created' : 'Reward updated')
      setEditing(null)
    } catch (e) { showToast('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Delete this reward?')) return
    if (isDemo) { setRewards(r => r.filter(x => x.id !== id)); showToast('Deleted'); return }
    try {
      const token = await getToken()
      await fetch(`${API}/admin/rewards/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      setRewards(r => r.filter(x => x.id !== id)); showToast('Deleted')
    } catch (e) { showToast('Error: ' + e.message) }
  }

  const toggleStock = async r => {
    const updated = { ...r, stock: !r.stock }
    if (isDemo) { setRewards(rs => rs.map(x => x.id === r.id ? updated : x)); return }
    try {
      const token = await getToken()
      await fetch(`${API}/admin/rewards/${r.id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ stock: !r.stock }) })
      setRewards(rs => rs.map(x => x.id === r.id ? updated : x))
    } catch (e) { showToast('Error: ' + e.message) }
  }

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">REWARDS</h2>
          <p className="admin-section-sub">{rewards.length} items · {rewards.filter(r => r.stock).length} in stock</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ New Reward</button>
      </div>

      {loading ? <div className="admin-loading">Loading…</div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Reward</th><th>Points</th><th>Stock</th><th>Actions</th></tr></thead>
            <tbody>
              {rewards.map(r => (
                <tr key={r.id}>
                  <td><span className="admin-row-icon">{r.icon}</span>{r.name}</td>
                  <td><span className="admin-pts">🪙 {r.pts.toLocaleString()}</span></td>
                  <td>
                    <button className={`admin-stock-btn${r.stock ? ' in-stock' : ' oos'}`} onClick={() => toggleStock(r)}>
                      {r.stock ? '✓ In Stock' : '✗ Out'}
                    </button>
                  </td>
                  <td className="admin-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>Edit</button>
                    <button className="btn btn-ghost btn-sm admin-del-btn" onClick={() => del(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'New Reward' : `Edit: ${editing.name}`} onClose={() => setEditing(null)}>
          <div className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Icon</label>
                <input className="input" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🎁" maxLength={4} />
              </div>
              <div className="form-group">
                <label className="form-label">Points Cost</label>
                <input className="input" type="number" min="0" value={form.pts} onChange={e => setForm(f => ({ ...f, pts: e.target.value }))} placeholder="500" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Reward name" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="input textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description shown to members" rows={2} />
            </div>
            <div className="form-check">
              <input type="checkbox" id="stock-check" checked={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.checked }))} />
              <label htmlFor="stock-check">In stock (members can redeem)</label>
            </div>
            <div className="admin-form-actions">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.name || !form.pts}>
                {saving ? 'Saving…' : editing === 'new' ? 'Create Reward' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <div className="admin-toast">{toast}</div>}
    </section>
  )
}

// ── Challenges section ────────────────────────────────────────────────────────
function ChallengesSection({ isDemo, getToken }) {
  const [challenges, setChallenges] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [editing,    setEditing]    = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [form,       setForm]       = useState({ emoji: '', name: '', points: '', daysLeft: '30', featured: false, description: '' })
  const [toast,      setToast]      = useState('')

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2800) }

  const load = useCallback(async () => {
    setLoading(true)
    if (isDemo) { setChallenges(DEMO_CHALLENGES); setLoading(false); return }
    try {
      const token = await getToken()
      const res   = await fetch(`${API}/admin/challenges`, { headers: { Authorization: `Bearer ${token}` } })
      setChallenges(await res.json())
    } catch (e) {
      showToast('API error: ' + (e.message || 'check backend is running'))
      setChallenges([])
    }
    finally { setLoading(false) }
  }, [isDemo, getToken])

  useEffect(() => { load() }, [load])

  const openNew  = () => { setForm({ emoji: '🏃', name: '', points: '', daysLeft: '30', featured: false, description: '' }); setEditing('new') }
  const openEdit = c  => { setForm({ emoji: c.emoji, name: c.name, points: c.points, daysLeft: c.daysLeft, featured: c.featured, description: c.description || '' }); setEditing(c) }

  const save = async () => {
    if (!form.name || !form.points) return
    setSaving(true)
    try {
      const payload = { ...form, points: Number(form.points), daysLeft: Number(form.daysLeft) }
      if (isDemo) {
        if (editing === 'new') setChallenges(c => [{ id: `ch-${Date.now()}`, joined: 0, ...payload }, ...c])
        else setChallenges(c => c.map(x => x.id === editing.id ? { ...x, ...payload } : x))
        showToast(editing === 'new' ? 'Challenge created' : 'Challenge updated')
        setEditing(null); return
      }
      const token  = await getToken()
      const method = editing === 'new' ? 'POST' : 'PATCH'
      const url    = editing === 'new' ? `${API}/admin/challenges` : `${API}/admin/challenges/${editing.id}`
      const res    = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data   = await res.json()
      if (editing === 'new') setChallenges(c => [data, ...c])
      else setChallenges(c => c.map(x => x.id === data.id ? data : x))
      showToast(editing === 'new' ? 'Challenge created' : 'Challenge updated')
      setEditing(null)
    } catch (e) { showToast('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Delete this challenge?')) return
    if (isDemo) { setChallenges(c => c.filter(x => x.id !== id)); showToast('Deleted'); return }
    try {
      const token = await getToken()
      await fetch(`${API}/admin/challenges/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      setChallenges(c => c.filter(x => x.id !== id)); showToast('Deleted')
    } catch (e) { showToast('Error: ' + e.message) }
  }

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">CHALLENGES</h2>
          <p className="admin-section-sub">{challenges.length} active · {challenges.filter(c => c.featured).length} featured</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ New Challenge</button>
      </div>

      {loading ? <div className="admin-loading">Loading…</div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Challenge</th><th>Points</th><th>Days Left</th><th>Members</th><th>Actions</th></tr></thead>
            <tbody>
              {challenges.map(c => (
                <tr key={c.id}>
                  <td>
                    <span className="admin-row-icon">{c.emoji}</span>
                    {c.name}
                    {c.featured && <span className="tag tag-gold" style={{ marginLeft: '0.5rem' }}>Featured</span>}
                  </td>
                  <td><span className="admin-pts">🪙 {Number(c.points).toLocaleString()}</span></td>
                  <td><span className={`admin-days${c.daysLeft <= 7 ? ' admin-days--urgent' : ''}`}>{c.daysLeft}d</span></td>
                  <td>{Number(c.joined || 0).toLocaleString()}</td>
                  <td className="admin-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                    <button className="btn btn-ghost btn-sm admin-del-btn" onClick={() => del(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'New Challenge' : `Edit: ${editing.name}`} onClose={() => setEditing(null)}>
          <div className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Emoji</label>
                <input className="input" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="🏃" maxLength={4} />
              </div>
              <div className="form-group">
                <label className="form-label">Points Reward</label>
                <input className="input" type="number" min="0" value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} placeholder="500" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Challenge Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Challenge name" />
            </div>
            <div className="form-group">
              <label className="form-label">Days Remaining</label>
              <input className="input" type="number" min="1" max="365" value={form.daysLeft} onChange={e => setForm(f => ({ ...f, daysLeft: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="input textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What do members need to do?" rows={2} />
            </div>
            <div className="form-check">
              <input type="checkbox" id="feat-check" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
              <label htmlFor="feat-check">Featured (shown first in Challenges page)</label>
            </div>
            <div className="admin-form-actions">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.name || !form.points}>
                {saving ? 'Saving…' : editing === 'new' ? 'Create Challenge' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <div className="admin-toast">{toast}</div>}
    </section>
  )
}

// ── Main AdminPage ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { isDemo } = useDemo()
  const { getToken, user, roles } = useAuth()
  const [stats, setStats]   = useState(null)
  const [tab,   setTab]     = useState('rewards')

  useEffect(() => {
    if (isDemo) { setStats(DEMO_STATS); return }
    const load = async () => {
      try {
        const token = await getToken()
        const res   = await fetch(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
        setStats(await res.json())
      } catch (e) { console.error('Admin stats error:', e); setStats(null) }
    }
    load()
  }, [isDemo, getToken])

  return (
    <div className="admin-page">
      <div className="page-container">

        {/* Header */}
        <div className="admin-header">
          <div>
            <span className="section-label">ADMIN PANEL</span>
            <h1 className="admin-title">The Wheezy League<span className="admin-title-accent"> HQ</span></h1>
            <p className="admin-sub">Signed in as <strong>{user?.email}</strong> · Roles: <code>{roles.join(', ') || 'none'}</code></p>
          </div>
          {isDemo && <span className="tag tag-gold">DEMO MODE</span>}
        </div>

        {/* Platform stats */}
        {stats && (
          <div className="admin-stats-row">
            <StatPill label="Total Members"    value={stats.totalUsers}      color="orange" />
            <StatPill label="Community Posts"  value={stats.totalPosts}      color="blue" />
            <StatPill label="Active Challenges"value={stats.totalChallenges} color="gold" />
            <StatPill label="Rewards In Stock" value={stats.rewardsInStock}  color="green" />
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          {[['rewards','🎁 Rewards'],['challenges','🏆 Challenges']].map(([id, label]) => (
            <button key={id} className={`admin-tab${tab === id ? ' admin-tab--active' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {tab === 'rewards'    && <RewardsSection    isDemo={isDemo} getToken={getToken} />}
        {tab === 'challenges' && <ChallengesSection isDemo={isDemo} getToken={getToken} />}

      </div>
    </div>
  )
}
