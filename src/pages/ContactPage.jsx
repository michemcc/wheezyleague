import React, { useState } from 'react'
import './ContactPage.css'

const TOPICS = [
  'General Question',
  'Technical Support',
  'Medical / BreathZone',
  'Partnership Inquiry',
  'Press & Media',
  'Report a Bug',
  'Other',
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' })
  const [sent, setSent]     = useState(false)
  const [sending, setSending] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    // Simulate send — replace with real API call
    await new Promise(r => setTimeout(r, 900))
    setSending(false)
    setSent(true)
  }

  return (
    <div className="contact-page">

      <div className="contact-hero">
        <div className="page-container contact-hero-inner">
          <span className="section-label section-label--light">Get In Touch</span>
          <h1 className="contact-hero-title">We'd love to <em>hear from you.</em></h1>
          <p className="contact-hero-sub">
            Questions, feedback, partnership ideas, or just want to say hi — we read every message.
          </p>
        </div>
      </div>

      <div className="page-container contact-body">
        <div className="contact-grid">

          {/* Form */}
          <div className="card contact-form-card">
            {sent ? (
              <div className="sent-state">
                <span className="sent-icon" aria-hidden="true">✅</span>
                <h2>Message sent!</h2>
                <p>We'll get back to you within 1–2 business days. Thanks for reaching out.</p>
                <button className="btn btn-primary" onClick={() => { setSent(false); setForm({ name:'',email:'',topic:'',message:'' }) }}>
                  Send Another
                </button>
              </div>
            ) : (
              <>
                <h2 className="contact-form-title">Send a Message</h2>
                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="c-name">Your Name</label>
                      <input id="c-name" className="input" required placeholder="Alex Runner"
                        value={form.name} onChange={e => set('name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="c-email">Email Address</label>
                      <input id="c-email" type="email" className="input" required placeholder="alex@email.com"
                        value={form.email} onChange={e => set('email', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="c-topic">Topic</label>
                    <select id="c-topic" className="input" value={form.topic} onChange={e => set('topic', e.target.value)} required>
                      <option value="" disabled>Select a topic…</option>
                      {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="c-message">Message</label>
                    <textarea id="c-message" className="input textarea" rows={6} required
                      placeholder="Tell us what's on your mind…"
                      value={form.message} onChange={e => set('message', e.target.value)} />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={sending || !form.name || !form.email || !form.topic || !form.message}
                  >
                    {sending ? 'Sending…' : '✉️ Send Message'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Sidebar info */}
          <aside className="contact-sidebar">
            <div className="card contact-info-card">
              <h3>Contact Info</h3>
              <div className="contact-info-rows">
                <div className="ci-row">
                  <span aria-hidden="true">📧</span>
                  <div>
                    <strong>Email</strong>
                    <a href="mailto:hello@wheezyleague.run">hello@wheezyleague.run</a>
                  </div>
                </div>
                <div className="ci-row">
                  <span aria-hidden="true">🐛</span>
                  <div>
                    <strong>Bug Reports</strong>
                    <a href="mailto:bugs@wheezyleague.run">bugs@wheezyleague.run</a>
                  </div>
                </div>
                <div className="ci-row">
                  <span aria-hidden="true">🤝</span>
                  <div>
                    <strong>Partnerships</strong>
                    <a href="mailto:partners@wheezyleague.run">partners@wheezyleague.run</a>
                  </div>
                </div>
                <div className="ci-row">
                  <span aria-hidden="true">📰</span>
                  <div>
                    <strong>Press</strong>
                    <a href="mailto:press@wheezyleague.run">press@wheezyleague.run</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="card contact-info-card">
              <h3>Response Times</h3>
              <div className="response-rows">
                {[
                  { type: 'General',   time: '1–2 business days' },
                  { type: 'Support',   time: 'Within 24 hours' },
                  { type: 'Medical',   time: '2–3 business days' },
                  { type: 'Press',     time: 'Same day' },
                ].map(r => (
                  <div key={r.type} className="resp-row">
                    <span>{r.type}</span>
                    <span className="tag tag-sage">{r.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card contact-info-card card--dark">
              <h3 style={{ color: 'var(--warm-white)' }}>🫁 Medical Note</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(248,242,232,0.7)', lineHeight: 1.6 }}>
                The Wheezy League is not a medical service and cannot provide individual health advice.
                For asthma emergencies, contact your doctor or call emergency services.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
