import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import RoleSelect from './pages/RoleSelect';
import MapDiscovery from './pages/MapDiscovery';
import JobsList from './pages/JobsList';
import PostJob from './pages/PostJob';
import EmployerDashboard from './pages/EmployerDashboard';
import EmployerWorkersMap from './pages/EmployerWorkersMap';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerProfileSetup from './pages/WorkerProfileSetup';
import EmployerProfileSetup from './pages/EmployerProfileSetup';
import ResidentProfileSetup from './pages/ResidentProfileSetup';
import PostTask from './pages/PostTask';
import ResidentDashboard from './pages/ResidentDashboard';
import TaskBoard from './pages/TaskBoard';
import FindWorkers from './pages/FindWorkers';
import Profile from './pages/Profile';
import ContractorProfileSetup from './pages/ContractorProfileSetup';
import PostProject from './pages/PostProject';
import ContractorDashboard from './pages/ContractorDashboard';
import ApplicantManagement from './pages/ApplicantManagement';
import LabourContractorDirectory from './pages/LabourContractorDirectory';
import ContractorLabourPool from './pages/ContractorLabourPool';
import SitesList from './pages/SitesList';
import './App.css';

// ── Protected Route ─────────────────────────────────────
const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <span className="spinner spinner-lg" />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading…</span>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" />;
  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(currentUser.role)) return <Navigate to="/" />;
  }
  return children;
};

// ── Home Redirect — route to correct home based on role ──
const HomeRedirect = () => {
  const { currentUser } = useAuth();

  if (!currentUser) return <Navigate to="/login" />;
  if (!currentUser.role) return <Navigate to="/role-select" />;
  
  if (currentUser.role === 'worker') {
    if (!currentUser.name || !currentUser.skills || currentUser.skills.length === 0) {
      return <Navigate to="/setup/worker" />;
    }
    return <Navigate to="/map" />;
  }
  
  if (currentUser.role === 'resident') {
    if (!currentUser.name || !currentUser.locality || !currentUser.location?.lat) {
      return <Navigate to="/setup/resident" />;
    }
    return <Navigate to="/resident/dashboard" />;
  }

  if (currentUser.role === 'contractor') {
    if (!currentUser.companyName || !currentUser.ownerName || !currentUser.contractorType) {
      return <Navigate to="/setup/contractor" />;
    }
    return <Navigate to="/contractor/dashboard" />;
  }

  // Employer
  if (!currentUser.name || !currentUser.shopName || !currentUser.shopAddress) {
    return <Navigate to="/setup/employer" />;
  }
  return <Navigate to="/employer/dashboard" />;
};

// ── App ─────────────────────────────────────────────────
function App() {
  const { currentUser } = useAuth();
  const showNav = currentUser && currentUser.role;

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          {/* ── Public ─────────────────────────── */}
          <Route
            path="/login"
            element={!currentUser ? <Login /> : <Navigate to="/" />}
          />

          {/* ── Onboarding ─────────────────────── */}
          <Route
            path="/role-select"
            element={
              currentUser
                ? <RoleSelect />
                : <Navigate to="/login" />
            }
          />
          <Route
            path="/setup/worker"
            element={
              <ProtectedRoute requiredRole="worker">
                <WorkerProfileSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/setup/employer"
            element={
              <ProtectedRoute requiredRole="employer">
                <EmployerProfileSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/setup/resident"
            element={
              <ProtectedRoute requiredRole="resident">
                <ResidentProfileSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/setup/contractor"
            element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorProfileSetup />
              </ProtectedRoute>
            }
          />

          {/* ── Home Redirect ──────────────────── */}
          <Route path="/" element={<HomeRedirect />} />

          {/* ── Worker Routes ──────────────────── */}
          <Route
            path="/map"
            element={
              <ProtectedRoute requiredRole="worker">
                <MapDiscovery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute requiredRole="worker">
                <JobsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/dashboard"
            element={
              <ProtectedRoute requiredRole="worker">
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute requiredRole="worker">
                <TaskBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sites"
            element={
              <ProtectedRoute requiredRole="worker">
                <SitesList />
              </ProtectedRoute>
            }
          />

          {/* ── Employer Routes ────────────────── */}
          <Route
            path="/employer/workers-map"
            element={
              <ProtectedRoute requiredRole="employer">
                <EmployerWorkersMap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/dashboard"
            element={
              <ProtectedRoute requiredRole="employer">
                <EmployerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/post-job"
            element={
              <ProtectedRoute requiredRole="employer">
                <PostJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/stats"
            element={
              <ProtectedRoute requiredRole="employer">
                <EmployerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/find-workers"
            element={
              <ProtectedRoute requiredRole={['employer', 'resident', 'contractor']}>
                <FindWorkers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/workers-map"
            element={
              <ProtectedRoute requiredRole="employer">
                <EmployerWorkersMap />
              </ProtectedRoute>
            }
          />

          {/* ── Resident Routes ────────────────── */}
          <Route
            path="/resident/dashboard"
            element={
              <ProtectedRoute requiredRole="resident">
                <ResidentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resident/post-task"
            element={
              <ProtectedRoute requiredRole="resident">
                <PostTask />
              </ProtectedRoute>
            }
          />

          {/* â”€â”€ Contractor Routes â”€â”€ */}
          <Route
            path="/contractor/post-project"
            element={
              <ProtectedRoute requiredRole="contractor">
                <PostProject />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractor/dashboard"
            element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractor/projects"
            element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractor/projects/:projectId/applicants"
            element={
              <ProtectedRoute requiredRole="contractor">
                <ApplicantManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractor/labour-pool"
            element={
              <ProtectedRoute requiredRole="contractor">
                <ContractorLabourPool />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractor/find-labour"
            element={
              <ProtectedRoute requiredRole="contractor">
                <LabourContractorDirectory />
              </ProtectedRoute>
            }
          />

          {/* ── Shared Routes ──────────────────── */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ── Catch-all ──────────────────────── */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {/* Bottom Navigation */}
        {showNav && <BottomNav role={currentUser.role} />}

        {/* Toast Notifications */}
        <Toaster
          position="bottom-center"
          containerStyle={{ bottom: showNav ? 80 : 20 }}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1A1A1A',
              color: '#FFFFFF',
              border: '1px solid #2A2A2A',
              borderRadius: '14px',
              fontSize: '0.9rem',
              fontFamily: "'DM Sans', sans-serif",
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: {
                primary: '#00C851',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#FF3B3B',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
