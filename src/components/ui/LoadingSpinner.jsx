import React from 'react'
import './LoadingSpinner.css'

export default function LoadingSpinner({ fullscreen = false, size = 'md' }) {
  if (fullscreen) {
    return (
      <div className="spinner-fullscreen">
        <div className="spinner-logo">
          <span className="spinner-ring-icon">◎</span>
          <p>LOADING...</p>
        </div>
      </div>
    )
  }
  return <div className={`spinner spinner--${size}`} aria-label="Loading" />
}
