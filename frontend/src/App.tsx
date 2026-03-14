import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserRole } from './types';

import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { CandidatesPage } from './pages/Candidates';
import { SupervisorPWA } from './pages/Supervisor';
import { CorrectionPage } from './pages/Correction';
import { DeliberationPage } from './pages/Deliberation';
import { ExamPlanningPage } from './pages/ExamPlanning';
import { AnonymizationPage } from './pages/Anonymization';
import { DiscrepanciesPage } from './pages/Discrepancies';
import { OfficialResultsPage } from './pages/OfficialResults';
import { UserManagementPage } from './pages/UserManagement';
import { AuditTrailPage } from './pages/AuditTrail';
import { SystemSettingsPage } from './pages/SystemSettings';
import { NotFoundPage } from './pages/NotFound';

const { ADMIN, CFD_HEAD, COORDINATOR, CORRECTOR, SUPERVISOR, JURY_PRESIDENT, JURY_MEMBER, ANONYMITY_COMMISSION } = UserRole;

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          {/* Redirect /register → /login since there is no registration */}
          <Route path={ROUTES.REGISTER} element={<Navigate to={ROUTES.LOGIN} replace />} />

          {/* ── Protected Routes ── */}
          <Route path={ROUTES.DASHBOARD} element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path={ROUTES.CANDIDATES} element={
            <ProtectedRoute allowedRoles={[ADMIN, CFD_HEAD, COORDINATOR]}>
              <CandidatesPage />
            </ProtectedRoute>
          } />

          <Route path={ROUTES.IMPORT} element={
            <ProtectedRoute allowedRoles={[ADMIN, CFD_HEAD]}>
              {/* Import page reuses Candidates / dashboard for now */}
              <CandidatesPage />
            </ProtectedRoute>
          } />

          <Route path={ROUTES.EXAM_PLANNING} element={
            <ProtectedRoute allowedRoles={[ADMIN, CFD_HEAD]}>
              <ExamPlanningPage />
            </ProtectedRoute>
          } />

          <Route path={ROUTES.SUPERVISOR} element={
            <ProtectedRoute allowedRoles={[ADMIN, CFD_HEAD, COORDINATOR, SUPERVISOR]}>
              <SupervisorPWA />
            </ProtectedRoute>
          } />

          <Route path={ROUTES.ANONYMIZATION} element={
            <ProtectedRoute allowedRoles={[ADMIN, CFD_HEAD, ANONYMITY_COMMISSION]}>
              <AnonymizationPage />
            </ProtectedRoute>
          } />

          <Route path={ROUTES.CORRECTION} element={
            <ProtectedRoute allowedRoles={[ADMIN, CFD_HEAD, COORDINATOR, CORRECTOR]}>
              <CorrectionPage />
            </ProtectedRoute>
          } />

          <Route path={ROUTES.DISCREPANCIES} element={
            <ProtectedRoute allowedRoles={[ADMIN, CFD_HEAD, COORDINATOR]}>
              <DiscrepanciesPage />
            </ProtectedRoute>
          } />

          <Route path={ROUTES.DELIBERATION} element={
            <ProtectedRoute allowedRoles={[ADMIN, CFD_HEAD, JURY_PRESIDENT, JURY_MEMBER]}>
              <DeliberationPage />
            </ProtectedRoute>
          } />

          <Route path={ROUTES.RESULTS} element={
            <ProtectedRoute allowedRoles={[ADMIN, CFD_HEAD, JURY_PRESIDENT]}>
              <OfficialResultsPage />
            </ProtectedRoute>
          } />

          <Route path={ROUTES.USERS} element={
            <ProtectedRoute allowedRoles={[ADMIN]}>
              <UserManagementPage />
            </ProtectedRoute>
          } />

          <Route path={ROUTES.AUDIT} element={
            <ProtectedRoute allowedRoles={[ADMIN]}>
              <AuditTrailPage />
            </ProtectedRoute>
          } />

          <Route path={ROUTES.SETTINGS} element={
            <ProtectedRoute allowedRoles={[ADMIN]}>
              <SystemSettingsPage />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
