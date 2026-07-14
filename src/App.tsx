import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EventsProvider } from './contexts/EventsContext';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { VerificationDashboard } from './pages/dashboards/VerificationDashboard';
import { HospitalityDashboard } from './pages/dashboards/HospitalityDashboard';
import { EventCoordinatorDashboard } from './pages/dashboards/EventCoordinatorDashboard';
import { CertificateDashboard } from './pages/dashboards/CertificateDashboard';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { AnalyticsDashboard } from './pages/dashboards/AnalyticsDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return <div className="p-10 text-center text-xs">Loading ANVESHA session...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <EventsProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Dashboard Routes */}
            <Route
              path="/dashboard/verification"
              element={
                <ProtectedRoute>
                  <VerificationDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/hospitality"
              element={
                <ProtectedRoute>
                  <HospitalityDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/sports"
              element={
                <ProtectedRoute>
                  <EventCoordinatorDashboard category="SPORTS" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/culturals"
              element={
                <ProtectedRoute>
                  <EventCoordinatorDashboard category="CULTURAL" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/certificates"
              element={
                <ProtectedRoute>
                  <CertificateDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/reports"
              element={
                <ProtectedRoute>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </EventsProvider>
    </AuthProvider>
  );
};

export default App;
