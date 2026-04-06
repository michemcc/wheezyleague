import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import Layout         from './components/layout/Layout'
import ScrollToTop    from './components/ui/ScrollToTop'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoadingSpinner from './components/ui/LoadingSpinner'

import HomePage       from './pages/HomePage'
import DashboardPage  from './pages/DashboardPage'
import CommunityPage  from './pages/CommunityPage'
import ChallengesPage from './pages/ChallengesPage'
import RoutesPage     from './pages/RoutesPage'
import ProfilePage    from './pages/ProfilePage'
import IncentivesPage from './pages/IncentivesPage'
import AdminPage      from './pages/AdminPage'
import AboutPage      from './pages/AboutPage'
import ContactPage    from './pages/ContactPage'
import PrivacyPage    from './pages/PrivacyPage'
import CallbackPage   from './pages/CallbackPage'

export default function App() {
  const { isLoading } = useAuth0()
  if (isLoading) return <LoadingSpinner fullscreen />

  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/"           element={<HomePage />} />
        <Route path="/callback"   element={<CallbackPage />} />
        <Route path="/about"      element={<AboutPage />} />
        <Route path="/contact"    element={<ContactPage />} />
        <Route path="/privacy"    element={<PrivacyPage />} />
        <Route path="/incentives" element={<IncentivesPage />} />

        {/* Member-protected */}
        <Route path="/dashboard"  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/community"  element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
        <Route path="/challenges" element={<ProtectedRoute><ChallengesPage /></ProtectedRoute>} />
        <Route path="/routes"     element={<ProtectedRoute><RoutesPage /></ProtectedRoute>} />
        <Route path="/profile"    element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Admin-only */}
        <Route path="/admin" element={
          <ProtectedRoute requireRole="admin"><AdminPage /></ProtectedRoute>
        } />
      </Routes>
    </Layout>
  )
}
