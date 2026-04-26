import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ShaktiCareChatbot } from './components/ShaktiCareChatbot'
import { AppLayout } from './components/AppLayout'
import { getCurrentUser } from './auth'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { SignupPage } from './pages/SignupPage'
import { DigitalTwinPage } from './pages/DigitalTwinPage'
import { AlertsPage } from './pages/AlertsPage'
import { ProfilePage } from './pages/ProfilePage'
import { DataEntryPage } from './pages/DataEntryPage'
import { ResourcesPage } from './pages/ResourcesPage'
import { CommunityPage } from './pages/CommunityPage'

function RequireAuth() {
  const user = getCurrentUser()
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function GuestOnly() {
  const user = getCurrentUser()
  if (user) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function App() {
  return (
    <>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Public resources (no login required), but keep the same app layout/navbar */}
        <Route element={<AppLayout />}>
          <Route path="/resources" element={<ResourcesPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/data-entry" element={<DataEntryPage />} />
            <Route path="/digital-twin" element={<DigitalTwinPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ShaktiCareChatbot />
    </>
  )
}

export default App
