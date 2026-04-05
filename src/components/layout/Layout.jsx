import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import './Layout.css'

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  )
}
