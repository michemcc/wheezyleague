import React, { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useDemo } from '../context/DemoContext'
import { getSymptomLog, addSymptomEntry } from '../services/dataService'
import './BreathZonePage.css'

const AQI_LEVELS = [
  { range: '0–50',   label: 'Good',      cls: 'good',   advice: 'Great day to run outdoors.' },
  { range: '51–100', label: 'Moderate',  cls: 'mod',    advice: 'Unusually sensitive people should consider reducing prolonged exertion.' },
  { range: '101–150',label: 'Unhealthy*',cls: 'unhealthy',advice: 'People with asthma should limit prolonged outdoor exertion.' },
  { range: '151+',   label: 'Very Unhealthy', cls: 'very', advice: 'Avoid outdoor exertion entirely. Run indoors.' },
]

const SYMPTOM_LOG = [
  { date: 'Mar 13', run: '4.2 mi', symptoms: 'Mild wheeze at mile 3', triggers: 'Cold air, high pollen', level: 'mild' },
  { date: 'Mar 11', run: '5.1 mi', symptoms: 'None', triggers: '–', level: 'none' },
  { date: 'Mar 10', run: '3.8 mi', symptoms: 'Chest tightness, used rescue inhaler', triggers: 'PM2.5 spike', level: 'moderate' },
  { date: 'Mar 8',  run: '5.3 mi', symptoms: 'None', triggers: '–', level: 'none' },
  { date: 'Mar 6',  run: '2.1 mi', symptoms: 'Shortness of breath, cut run short', triggers: 'High humidity + heat', level: 'severe' },
]

const TREND_DATA = [
  { week: 'W1', score: 8 },
  { week: 'W2', score: 6 },
  { week: 'W3', score: 7 },
  { week: 'W4', score: 5 },
  { week: 'W5', score: 9 },
  { week: 'W6', score: 8 },
  { week: 'W7', score: 10 },
  { week: 'W8', score: 9 },
]

const levelColors = { none: 'tag-sage', mild: 'tag-amber', moderate: 'tag-rust', severe: 'tag-red' }

export default function BreathZonePage() {
  const { user } = useAuth0()
  const { isDemo } = useDemo()
  const [activeTab, setActiveTab] = useState('overview')
  const [symptomLog, setSymptomLog] = useState([])

  useEffect(() => {
    getSymptomLog(user?.sub || 'demo', isDemo)
      .then(d => setSymptomLog(Array.isArray(d) ? d : SYMPTOM_LOG))
  }, [isDemo, user?.sub])
  const [formData, setFormData] = useState({ date: '', run: '', symptoms: '', triggers: '', level: 'none', notes: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Log entry saved! (Connect backend to persist data.)')
    setFormData({ date: '', run: '', symptoms: '', triggers: '', level: 'none', notes: '' })
  }

  const maxScore = Math.max(...TREND_DATA.map(d => d.score))

  return (
    <div className="page-container bz-page">
      <div className="bz-header">
        <div>
          <span className="section-label">BreathZone</span>
          <h1 className="section-title">Your asthma, <em>your data.</em></h1>
          <p className="section-sub">Track symptoms, triggers, and breathing trends alongside your training.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveTab('log')}>+ Log Symptoms</button>
      </div>

      {/* Tabs */}
      <div className="bz-tabs" role="tablist">
        {['overview', 'log', 'history', 'guide'].map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`bz-tab${activeTab === tab ? ' bz-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {{ overview: '📊 Overview', log: '✏️ Log Entry', history: '📋 History', guide: '🌬️ AQI Guide' }[tab]}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="bz-overview">
          <div className="bz-summary-grid">
            <div className="card bz-sum-card">
              <div className="bz-sum-label">30-Day Symptom-Free Runs</div>
              <div className="bz-sum-val bz-sum-val--green">18 <span>/ 22</span></div>
              <div className="progress-track" style={{ marginTop: '0.5rem' }}>
                <div className="progress-fill progress-fill--sage" style={{ width: '82%' }} />
              </div>
            </div>
            <div className="card bz-sum-card">
              <div className="bz-sum-label">Inhaler Uses This Month</div>
              <div className="bz-sum-val bz-sum-val--amber">4</div>
              <p className="bz-sum-sub">Down from 11 last month 📉</p>
            </div>
            <div className="card bz-sum-card">
              <div className="bz-sum-label">Breathing Score (Avg)</div>
              <div className="bz-sum-val bz-sum-val--rust">8.2 <span>/ 10</span></div>
              <p className="bz-sum-sub">Personal best: 10/10 ↑</p>
            </div>
          </div>

          {/* Trend chart */}
          <div className="card bz-trend-card">
            <div className="bz-card-header">📈 Breathing Score — Last 8 Weeks</div>
            <div className="trend-chart" role="img" aria-label="Breathing score trend chart">
              {TREND_DATA.map((d, i) => (
                <div key={i} className="trend-col">
                  <span className="trend-val">{d.score}</span>
                  <div className="trend-bar-track">
                    <div
                      className="trend-bar-fill"
                      style={{ height: `${(d.score / maxScore) * 100}%` }}
                    />
                  </div>
                  <span className="trend-label">{d.week}</span>
                </div>
              ))}
            </div>
            <p className="trend-note">Your breathing score has improved <strong>+25%</strong> over the past 8 weeks. Keep it up! 🎉</p>
          </div>

          {/* Top triggers */}
          <div className="card bz-triggers-card">
            <div className="bz-card-header">🎯 Your Top Triggers (Last 30 Days)</div>
            <div className="triggers-list">
              {[
                { trigger: 'Cold air (< 40°F)', count: 4, pct: 80 },
                { trigger: 'High pollen', count: 3, pct: 60 },
                { trigger: 'PM2.5 spikes', count: 2, pct: 40 },
                { trigger: 'High humidity', count: 1, pct: 20 },
              ].map(t => (
                <div key={t.trigger} className="trigger-row">
                  <span className="trigger-name">{t.trigger}</span>
                  <span className="trigger-count">{t.count}x</span>
                  <div className="trigger-bar-track">
                    <div className="trigger-bar-fill" style={{ width: `${t.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LOG ENTRY */}
      {activeTab === 'log' && (
        <div className="card bz-log-form-card">
          <h2 className="bz-form-title">Log a Run + Symptoms</h2>
          <form className="bz-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="bz-date">Date</label>
                <input id="bz-date" type="date" className="input" value={formData.date}
                  onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="bz-run">Run Distance</label>
                <input id="bz-run" type="text" className="input" placeholder="e.g. 3.5 mi"
                  value={formData.run}
                  onChange={e => setFormData(f => ({ ...f, run: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="bz-symptoms">Symptoms (if any)</label>
              <input id="bz-symptoms" type="text" className="input" placeholder="e.g. mild wheeze at mile 2"
                value={formData.symptoms}
                onChange={e => setFormData(f => ({ ...f, symptoms: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="bz-triggers">Possible Triggers</label>
              <input id="bz-triggers" type="text" className="input" placeholder="e.g. cold air, high pollen"
                value={formData.triggers}
                onChange={e => setFormData(f => ({ ...f, triggers: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Severity</label>
              <div className="severity-btns" role="group" aria-label="Severity level">
                {['none', 'mild', 'moderate', 'severe'].map(level => (
                  <button
                    key={level}
                    type="button"
                    className={`severity-btn severity-btn--${level}${formData.level === level ? ' severity-btn--active' : ''}`}
                    onClick={() => setFormData(f => ({ ...f, level }))}
                  >
                    {{ none: '✅ None', mild: '🟡 Mild', moderate: '🟠 Moderate', severe: '🔴 Severe' }[level]}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="bz-notes">Notes</label>
              <textarea id="bz-notes" className="input textarea" rows={3}
                placeholder="Any other observations…"
                value={formData.notes}
                onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary">Save Log Entry</button>
          </form>
        </div>
      )}

      {/* HISTORY */}
      {activeTab === 'history' && (
        <div className="bz-history">
          <div className="history-actions">
            <span className="history-count">{SYMPTOM_LOG.length} entries</span>
            <button className="btn btn-outline btn-sm">📄 Export PDF for Doctor</button>
          </div>
          <div className="card">
            <table className="history-table" aria-label="Symptom history">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Run</th>
                  <th>Symptoms</th>
                  <th>Triggers</th>
                  <th>Level</th>
                </tr>
              </thead>
              <tbody>
                {(isDemo ? SYMPTOM_LOG : symptomLog).map((entry, i) => (
                  <tr key={i}>
                    <td className="table-date">{entry.date}</td>
                    <td>{entry.run}</td>
                    <td>{entry.symptoms}</td>
                    <td className="table-muted">{entry.triggers}</td>
                    <td><span className={`tag ${levelColors[entry.level]}`}>{entry.level.charAt(0).toUpperCase() + entry.level.slice(1)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AQI GUIDE */}
      {activeTab === 'guide' && (
        <div className="bz-guide">
          <div className="guide-intro card">
            <p>Use this guide to decide when it's safe to run. Always consult your doctor for personalized advice.</p>
          </div>
          <div className="aqi-guide-grid">
            {AQI_LEVELS.map(level => (
              <div key={level.label} className={`card aqi-level-card aqi-level-card--${level.cls}`}>
                <div className="aqi-level-header">
                  <span className="aqi-level-range">{level.range}</span>
                  <span className="aqi-level-label">{level.label}</span>
                </div>
                <p className="aqi-level-advice">{level.advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
