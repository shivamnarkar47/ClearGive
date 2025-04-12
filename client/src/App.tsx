import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/AuthContext'
import { StellarProvider } from './contexts/StellarContext'
import { Toaster } from 'sonner'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import DonationsPage from './pages/DonationsPage'
import CharitiesPage from './pages/CharitiesPage'
import TaxReportingPage from './pages/TaxReportingPage'
import CertificatesPage from './pages/CertificatesPage'


function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="cleargive-theme">
      <AuthProvider>
        <StellarProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/donations"
                element={
                  <ProtectedRoute>
                    <DonationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/charities"
                element={
                  <ProtectedRoute>
                    <CharitiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/certificates"
                element={
                  <ProtectedRoute>
                    <CertificatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/tax-reporting"
                element={
                  <ProtectedRoute>
                    <TaxReportingPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
          <Toaster />
        </StellarProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
