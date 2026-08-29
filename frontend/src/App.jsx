import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Student Layout & Pages
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfilePage from './pages/student/StudentProfilePage';
import SkillPassportPage from './pages/student/SkillPassportPage';
import EvidencePage from './pages/student/EvidencePage';
import JobOpportunitiesPage from './pages/student/JobOpportunitiesPage';
import SkillGapsPage from './pages/student/SkillGapsPage';
import LearningPlanPage from './pages/student/LearningPlanPage';
import ReassessmentPage from './pages/student/ReassessmentPage';
import StudentApplicationsPage from './pages/student/StudentApplicationsPage';
import BlockersPage from './pages/student/BlockersPage';
import SimulationPage from './pages/student/SimulationPage';

// Placement Cell Layout & Pages
import PlacementLayout from './layouts/PlacementLayout';
import PlacementDashboard from './pages/placement/PlacementDashboard';
import StudentManagementPage from './pages/placement/StudentManagementPage';
import JobManagementPage from './pages/placement/JobManagementPage';
import EligibleStudentsPage from './pages/placement/EligibleStudentsPage';
import AtRiskPage from './pages/placement/AtRiskPage';
import TrainingPage from './pages/placement/TrainingPage';
import DriveManagementPage from './pages/placement/DriveManagementPage';

// Trainer / Faculty Portal Layout & Pages
import TrainerLayout from './layouts/TrainerLayout';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import TrainerCohortsPage from './pages/trainer/TrainerCohortsPage';
import TrainerCohortDetailsPage from './pages/trainer/TrainerCohortDetailsPage';
import TrainerGradingPage from './pages/trainer/TrainerGradingPage';


// Protected Route Guard
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.firstLogin) {
    return <Navigate to="/reset-password" replace />;
  }

  if (allowedRole) {
    const isAllowed = Array.isArray(allowedRole)
      ? allowedRole.includes(user.role)
      : user.role === allowedRole;
    if (!isAllowed) {
      if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
      if (user.role === 'TRAINER') return <Navigate to="/trainer/dashboard" replace />;
      return <Navigate to="/placement/dashboard" replace />;
    }
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Student Portal Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="passport" element={<SkillPassportPage />} />
        <Route path="evidence" element={<EvidencePage />} />
        <Route path="blockers" element={<BlockersPage />} />
        <Route path="simulation" element={<SimulationPage />} />
        <Route path="jobs" element={<JobOpportunitiesPage />} />
        <Route path="gaps" element={<SkillGapsPage />} />
        <Route path="learning" element={<LearningPlanPage />} />
        <Route path="reassessment" element={<ReassessmentPage />} />
        <Route path="applications" element={<StudentApplicationsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Placement Cell Admin Routes */}
      <Route
        path="/placement"
        element={
          <ProtectedRoute allowedRole="PLACEMENT_CELL">
            <PlacementLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PlacementDashboard />} />
        <Route path="students" element={<StudentManagementPage />} />
        <Route path="jobs" element={<JobManagementPage />} />
        <Route path="drives" element={<DriveManagementPage />} />
        <Route path="eligible" element={<EligibleStudentsPage />} />
        <Route path="at-risk" element={<AtRiskPage />} />
        <Route path="training" element={<TrainingPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Faculty Trainer Portal Routes */}
      <Route
        path="/trainer"
        element={
          <ProtectedRoute allowedRole={["TRAINER", "PLACEMENT_CELL"]}>
            <TrainerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<TrainerDashboard />} />
        <Route path="cohorts" element={<TrainerCohortsPage />} />
        <Route path="cohorts/:id" element={<TrainerCohortDetailsPage />} />
        <Route path="grading" element={<TrainerGradingPage />} />

        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}


