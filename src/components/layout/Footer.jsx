import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="logo-ring">◎</span>
              <span>The Wheezy League</span>
            </Link>
            <p>Built for every runner who has ever fought for air and still showed up at the starting line.</p>
            <div className="footer-social">
              <a href="#" aria-label="Twitter / X"  className="social-btn">𝕏</a>
              <a href="#" aria-label="Instagram"     className="social-btn">📷</a>
              <a href="#" aria-label="Strava"        className="social-btn">🏃</a>
            </div>
          </div>

          <div className="footer-cols">
            <div className="footer-col">
              <strong>Platform</strong>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/breathzone">BreathZone</Link>
              <Link to="/challenges">Challenges</Link>
              <Link to="/routes">Routes</Link>
              <Link to="/incentives">Rewards</Link>
            </div>
            <div className="footer-col">
              <strong>Community</strong>
              <Link to="/community">Feed</Link>
              <a href="#">Local Clubs</a>
              <a href="#">Events</a>
              <a href="#">Member Stories</a>
            </div>
            <div className="footer-col">
              <strong>Company</strong>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
            </div>
            <div className="footer-col">
              <strong>Resources</strong>
              <a href="#">Asthma & Running</a>
              <a href="#">AQI Safety Guide</a>
              <a href="#">Find a Doctor</a>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 The Wheezy League · v2026.4.0 · Run with every breath. 🫁</span>
          <div className="footer-legal">
            <Link to="/privacy">Privacy</Link>
            <a href="#">Terms</a>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
