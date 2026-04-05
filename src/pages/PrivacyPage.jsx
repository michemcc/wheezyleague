import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './PrivacyPage.css'

const SECTIONS = [
  {
    id: 'collect',
    title: '1. What We Collect',
    content: `We collect information you provide directly to us, such as when you create an account, update your profile, log runs or symptoms, or contact us. This includes:
    
• Account information: name, email address, username, and optional profile details.
• Health data: asthma type, inhaler usage logs, symptom notes, and run data you choose to enter into BreathZone. This data is entirely optional and you control it completely.
• Run activity: distance, pace, duration, and routes — only when you voluntarily log them.
• Device and usage data: browser type, operating system, pages visited, and approximate location (city level) for AQI features.

We do NOT collect GPS tracking data without explicit permission, and we never sell your health data under any circumstances.`,
  },
  {
    id: 'use',
    title: '2. How We Use It',
    content: `We use the information we collect to:

• Provide, maintain, and improve The Wheezy League's features.
• Personalise your experience, including AQI alerts for your city and relevant challenge recommendations.
• Send notifications you've opted into (challenge updates, community replies, AQI alerts).
• Generate your doctor export reports — these are processed locally in your browser and never stored on our servers.
• Analyse aggregate, anonymised usage patterns to improve the platform. Individual health data is never included in analytics.`,
  },
  {
    id: 'share',
    title: '3. How We Share It',
    content: `We do not sell, rent, or trade your personal information to third parties.

We may share information only in these limited circumstances:
• With service providers who help us operate the platform (hosting, email delivery) under strict data processing agreements.
• When required by law, such as responding to a valid legal process.
• With your explicit consent — for example, if you choose to share your profile publicly or export data to a third-party health app.

Community posts and profile information you mark as public are visible to other The Wheezy League members.`,
  },
  {
    id: 'health',
    title: '4. Your Health Data',
    content: `Your BreathZone data (symptom logs, inhaler usage, trigger notes) is treated with the highest level of care:

• It is encrypted at rest and in transit.
• It is never used for advertising purposes.
• It is never shared with insurance companies, employers, or pharmaceutical companies.
• Doctor export PDFs are generated client-side and never stored on our servers.
• You can delete all your health data at any time from your Profile settings.

The Wheezy League is not a HIPAA-covered entity, but we voluntarily apply HIPAA-equivalent standards to all health data.`,
  },
  {
    id: 'rights',
    title: '5. Your Rights',
    content: `You have the right to:

• Access: request a copy of all data we hold about you.
• Correction: update or correct inaccurate information in your profile settings.
• Deletion: delete your account and all associated data at any time.
• Portability: export your run and health data in a standard format (JSON or CSV).
• Opt-out: unsubscribe from any notification type in your profile settings.

To exercise these rights, contact us at privacy@wheezyleague.run or use the controls in your Profile settings.`,
  },
  {
    id: 'cookies',
    title: '6. Cookies',
    content: `We use a minimal set of cookies:

• Essential cookies: required for authentication and session management.
• Preference cookies: remember settings like your distance unit preference.
• Analytics cookies: anonymised usage analytics via a privacy-first analytics provider. No advertising cookies or tracking pixels.

You can control cookies through your browser settings. Disabling essential cookies will affect your ability to log in.`,
  },
  {
    id: 'retention',
    title: '7. Data Retention',
    content: `We retain your account data for as long as your account is active. If you delete your account, your personal data is permanently deleted within 30 days, except where retention is required by law.

Anonymised, aggregated data (e.g. aggregate run statistics for a city) may be retained indefinitely as it cannot be linked back to you.`,
  },
  {
    id: 'contact',
    title: '8. Contact Us',
    content: `If you have questions about this Privacy Policy or how we handle your data, contact us at:

📧 privacy@wheezyleague.run

The Wheezy League  
Data Privacy Team  
Boston, MA 02101

We aim to respond to all privacy requests within 5 business days.`,
  },
]

export default function PrivacyPage() {
  const [active, setActive] = useState('collect')

  return (
    <div className="privacy-page">
      <div className="privacy-hero">
        <div className="page-container">
          <span className="section-label section-label--light">Legal</span>
          <h1 className="privacy-hero-title">Privacy Policy</h1>
          <p className="privacy-hero-sub">
            Your data — especially your health data — is yours. Here's exactly how we handle it.
          </p>
          <div className="privacy-meta">
            <span className="tag tag-sage">Last updated: March 2026</span>
            <Link to="/contact" className="tag tag-sky" style={{ textDecoration: 'none' }}>Questions? Contact us →</Link>
          </div>
        </div>
      </div>

      <div className="page-container privacy-body">
        <div className="privacy-layout">

          {/* Sticky TOC */}
          <nav className="privacy-toc card" aria-label="Table of contents">
            <p className="toc-heading">Contents</p>
            {SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`toc-link${active === s.id ? ' toc-link--active' : ''}`}
                onClick={() => setActive(s.id)}
              >
                {s.title}
              </a>
            ))}
          </nav>

          {/* Content */}
          <div className="privacy-content">
            <div className="card privacy-intro-card">
              <p>
                The Wheezy League ("The Wheezy League", "we", "us") is committed to protecting your
                privacy, particularly regarding your health and respiratory data. This policy explains
                what we collect, why, and the controls you have over it.
              </p>
            </div>

            {SECTIONS.map(s => (
              <section key={s.id} id={s.id} className="card privacy-section">
                <h2 className="privacy-section-title">{s.title}</h2>
                <div className="privacy-text">
                  {s.content.split('\n').map((line, i) => {
                    if (!line.trim()) return null
                    if (line.startsWith('•')) {
                      return <p key={i} className="privacy-bullet">{line}</p>
                    }
                    return <p key={i}>{line}</p>
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
