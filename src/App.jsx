import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import Layout         from './components/layout/Layout'
import ScrollToTop    from './components/ui/ScrollToTop'
import HomePage       from './pages/HomePage'
import DashboardPage  from './pages/DashboardPage'
import CommunityPage  from './pages/CommunityPage'
import ChallengesPage from './pages/ChallengesPage'
import BreathZonePage from './pages/BreathZonePage'
import RoutesPage     from './pages/RoutesPage'
import ProfilePage    from './pages/ProfilePage'
import AboutPage      from './pages/AboutPage'
import ContactPage    from './pages/ContactPage'
import PrivacyPage    from './pages/PrivacyPage'
import IncentivesPage from './pages/IncentivesPage'
import CallbackPage   from './pages/CallbackPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoadingSpinner from './components/ui/LoadingSpinner'

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

        {/* Protected */}
        <Route path="/dashboard"  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/community"  element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
        <Route path="/challenges" element={<ProtectedRoute><ChallengesPage /></ProtectedRoute>} />
        <Route path="/breathzone" element={<ProtectedRoute><BreathZonePage /></ProtectedRoute>} />
        <Route path="/routes"     element={<ProtectedRoute><RoutesPage /></ProtectedRoute>} />
        <Route path="/profile"    element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Routes>
    </Layout>
  )
}
