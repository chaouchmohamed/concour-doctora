import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './guards/PrivateRoute'
import RoleRoute from './guards/RoleRoute'

// Layout
import AppShell from './components/layout/AppShell'

// Public Pages
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Protected Pages
import Dashboard from './pages/Dashboard'

// Candidates
import CandidatesList from './pages/candidates/CandidatesList'
import CandidateProfile from './pages/candidates/CandidateProfile'
import ImportCandidates from './pages/candidates/ImportCandidates'

// Planning
import ExamPlanning from './pages/planning/ExamPlanning'
import SubjectEditor from './pages/planning/SubjectEditor'

// Attendance
import AttendancePage from './pages/attendance/AttendancePage'

// Anonymization
import AnonymizationPage from './pages/anonymization/AnonymizationPage'

// Correction
import CorrectionPage from './pages/correction/CorrectionPage'
import CopyViewer from './pages/correction/CopyViewer'

// Discrepancies
import DiscrepanciesPage from './pages/discrepancies/DiscrepanciesPage'

// Deliberation
import DeliberationPage from './pages/deliberation/DeliberationPage'

// PV Reports
import PVReportsPage from './pages/pv/PVReportsPage'

// Admin
import UsersPage from './pages/admin/UsersPage'
import AuditLogsPage from './pages/admin/AuditLogsPage'
import SettingsPage from './pages/admin/SettingsPage'

// 404
import NotFound from './pages/NotFound'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route path="/app" element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Candidates */}
            <Route path="candidates">
              <Route index element={<CandidatesList />} />
              <Route path=":id" element={<CandidateProfile />} />
              <Route path="import" element={<ImportCandidates />} />
            </Route>
            
            {/* Planning */}
            <Route path="planning">
              <Route index element={<ExamPlanning />} />
              <Route path="subjects/:id" element={<SubjectEditor />} />
            </Route>
            
            {/* Attendance - Supervisor only */}
            <Route path="attendance" element={
              <RoleRoute allowedRoles={['ADMIN', 'CFD_HEAD', 'COORDINATOR', 'SUPERVISOR']}>
                <AttendancePage />
              </RoleRoute>
            } />
            
            {/* Anonymization - Coordinator only */}
            <Route path="anonymization" element={
              <RoleRoute allowedRoles={['ADMIN', 'CFD_HEAD', 'COORDINATOR']}>
                <AnonymizationPage />
              </RoleRoute>
            } />
            
            {/* Correction - Corrector only */}
            <Route path="correction">
              <Route index element={
                <RoleRoute allowedRoles={['ADMIN', 'CFD_HEAD', 'COORDINATOR', 'CORRECTOR']}>
                  <CorrectionPage />
                </RoleRoute>
              } />
              <Route path="copy/:id" element={
                <RoleRoute allowedRoles={['ADMIN', 'CFD_HEAD', 'COORDINATOR', 'CORRECTOR']}>
                  <CopyViewer />
                </RoleRoute>
              } />
            </Route>
            
            {/* Discrepancies - Coordinator only */}
            <Route path="discrepancies" element={
              <RoleRoute allowedRoles={['ADMIN', 'CFD_HEAD', 'COORDINATOR']}>
                <DiscrepanciesPage />
              </RoleRoute>
            } />
            
            {/* Deliberation - Jury only */}
            <Route path="deliberation" element={
              <RoleRoute allowedRoles={['ADMIN', 'CFD_HEAD', 'JURY_MEMBER']}>
                <DeliberationPage />
              </RoleRoute>
            } />
            
            {/* PV Reports */}
            <Route path="pv" element={<PVReportsPage />} />
            
            {/* Admin Routes - Admin only */}
            <Route path="admin">
              <Route path="users" element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <UsersPage />
                </RoleRoute>
              } />
              <Route path="audit" element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AuditLogsPage />
                </RoleRoute>
              } />
              <Route path="settings" element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <SettingsPage />
                </RoleRoute>
              } />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App