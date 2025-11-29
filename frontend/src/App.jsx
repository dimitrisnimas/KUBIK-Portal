import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminSettings from './pages/AdminSettings'
import Assets from './pages/Assets'
import Services from './pages/Services'
import Tickets from './pages/Tickets'
import Billing from './pages/Billing'
import Profile from './pages/Profile'
import AdminAssetManagement from './pages/AdminAssetManagement'
import AdminBillingManagement from './pages/AdminBillingManagement'
import AdminTicketManagement from './pages/AdminTicketManagement'
import AdminEmailTemplates from './pages/AdminEmailTemplates'
import AdminPackageManagement from './pages/AdminPackageManagement'
import AdminBilling from './pages/AdminBilling'
import AdminAssets from './pages/AdminAssets'
import AdminTickets from './pages/AdminTickets'
import ReactGA from "react-ga4";
import { useEffect } from 'react';

// Initialize Google Analytics
const GA_MEASUREMENT_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
if (GA_MEASUREMENT_ID) {
  ReactGA.initialize(GA_MEASUREMENT_ID);
}

function PrivateRoute({ children }) {
  try {
    const { user, loading } = useAuth()

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading-spinner h-32 w-32"></div>
        </div>
      )
    }

    return user ? children : <Navigate to="/login" replace />
  } catch (error) {
    // Handle hot-reload context errors
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner h-32 w-32"></div>
      </div>
    )
  }
}

function AdminRoute({ children }) {
  try {
    const { user, loading } = useAuth()

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading-spinner h-32 w-32"></div>
        </div>
      )
    }

    return user && user.admin_role === 'super_admin' ? children : <Navigate to="/" replace />
  } catch (error) {
    // Handle hot-reload context errors
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner h-32 w-32"></div>
      </div>
    )
  }
}

function AppRoutes() {
  try {
    const { user } = useAuth()
    const location = useLocation();

    useEffect(() => {
      if (GA_MEASUREMENT_ID) {
        ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
      }
    }, [location]);

    // Determine which dashboard to show based on user role
    const DashboardComponent = user?.admin_role === 'super_admin' ? AdminDashboard : Dashboard

    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<DashboardComponent />} />

          {/* Client Routes */}
          <Route path="assets" element={<Assets />} />
          <Route path="services" element={<Services />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="billing" element={<Billing />} />
          <Route path="profile" element={<Profile />} />

          {/* Super Admin Routes - Refactored for clarity and maintainability */}
          <Route path="admin" element={<AdminRoute><Outlet /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="clients" element={<AdminUsers />} />
            <Route path="assets" element={<AdminAssets />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="templates" element={<AdminEmailTemplates />} />
            <Route path="packages" element={<AdminPackageManagement />} />
            <Route path="settings" element={<AdminSettings />} />
            {/* Legacy admin route for backward compatibility */}
            <Route path="users" element={<Navigate to="/admin/clients" replace />} />
          </Route>
        </Route>
      </Routes>
    )
  } catch (error) {
    // Handle hot-reload context errors gracefully
    console.warn('AppRoutes context error (likely hot-reload):', error.message)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    )
  }
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App 
