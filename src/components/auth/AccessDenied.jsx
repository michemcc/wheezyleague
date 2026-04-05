import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import './AccessDenied.css'

/**
 * AccessDenied — shown when a user is authenticated but lacks the required role.
 * This handles the case where someone logs in but hasn't been assigned
 * the WheezyLeague-Member role yet (e.g. pending approval, wrong org, etc.)
 */
export default function AccessDenied({ roles = [], requiredRole }) {
  const { logout, user } = useAuth0()

  return (
    <div className="access-denied-page">
      <div className="access-denied-card">
        <div className="ad-icon" aria-hidden="true">🔒</div>

        <h1 className="ad-title">Access Restricted</h1>

        <p className="ad-body">
          Hey {user?.given_name || 'there'} — you're logged in, but your account
          doesn't have the <strong>{requiredRole}</strong> role needed to access this page.
        </p>

        <div className="ad-detail">
          <p className="ad-detail-label">Your current roles:</p>
          {roles.length > 0
            ? <div className="ad-roles">{roles.map(r => <span key={r} className="tag tag-earth">{r}</span>)}</div>
            : <p className="ad-no-roles">No roles assigned yet.</p>
          }
        </div>

        <div className="ad-steps">
          <p className="ad-steps-title">What to do next:</p>
          <ol>
            <li>Ask your Wheezy League admin to assign you the <strong>WheezyLeague-Member</strong> role in Auth0.</li>
            <li>Or <Link to="/contact">contact The Wheezy League support</Link> if you believe this is a mistake.</li>
            <li>Once the role is assigned, log out and back in for it to take effect.</li>
          </ol>
        </div>

        <div className="ad-actions">
          <button
            className="btn btn-primary"
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          >
            Sign Out & Try Again
          </button>
          <Link to="/" className="btn btn-ghost">Go to Home</Link>
        </div>
      </div>
    </div>
  )
}
