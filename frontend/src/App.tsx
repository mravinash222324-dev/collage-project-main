// frontend/src/App.tsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import {
  Box,
  Flex,
} from '@chakra-ui/react';

import Login from './components/Login';
import Register from './components/Register';
import ProjectSubmission from './components/ProjectSubmission';
import AIChatbot from './components/AIChatbot';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AIVivaSimulation from './components/AIVivaSimulation';
import ProjectArchiving from './components/ProjectArchiving';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AlumniPortal from './components/AlumniPortal';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import TopAlumniProjects from './components/TopAlumniProjects';
import TeacherApprovedProjects from './components/TeacherApprovedProjects';
import TeacherVivaHistory from './components/TeacherVivaHistory';
import AIProjectAssistant from './components/AIProjectAssistant';
import TeacherVivaAssistant from './components/TeacherVivaAssistant';
import TeacherProgressLog from './components/TeacherProgressLog';
import ForgotPassword from './components/ForgotPassword';
import ProjectKanban from './components/ProjectKanban';
import CodeReview from './components/CodeReview';
import StudentProjectDetails from './components/StudentProjectDetails';
import ProjectChat from './components/ProjectChat';
import StudentProfile from './components/StudentProfile';
import StudentMyProjects from './components/StudentMyProjects';
import StudentAssignmentView from './components/StudentAssignmentView';

import Settings from './components/Settings';
import Help from './components/Help';
import NotFound from './components/NotFound';
import Leaderboard from './components/Leaderboard';
import { NotificationProvider } from './context/NotificationContext';

// ----------------------------------------------------------------------
// 🌌 App Component — Fixed Layout & Background
// ----------------------------------------------------------------------
const App: React.FC = () => {
  return (
    <NotificationProvider>
      <Router>
        <Flex
          direction="column"
          minH="100vh"
          w="100%"
          bgGradient="linear(to-b, #0a0f1a, #000814, #001233)"
          color="white"
          overflowX="hidden"
          overflowY="auto"
        >
          <Box as="main" flex="1" p={0} m={0}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Public/Global Routes */}
              <Route path="/help" element={<Help />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/admin" element={<AdminLogin />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/student-dashboard" element={<StudentDashboard />} />
                <Route path="/student/project-view/:projectId" element={<StudentProjectDetails />} />
                <Route path="/student/profile" element={<StudentProfile />} />
                <Route path="/student/my-projects" element={<StudentMyProjects />} />
                <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                <Route path="/submit" element={<ProjectSubmission />} />
                <Route path="/ai-chat" element={<AIChatbot />} />
                <Route path="/ai-viva" element={<AIVivaSimulation />} />
                <Route path="/archive" element={<ProjectArchiving />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/alumni" element={<AlumniPortal />} />
                <Route path="/alumni" element={<AlumniPortal />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/ai-viva/:projectId" element={<AIVivaSimulation />} />
                <Route path="/top-projects" element={<TopAlumniProjects />} />
                <Route path="/teacher/approved-projects" element={<TeacherApprovedProjects />} />
                <Route path="/teacher/projects/:projectId/viva-history" element={<TeacherVivaHistory />} />
                <Route path="/teacher/projects/:projectId/progress-logs" element={<TeacherProgressLog />} />
                <Route path="/teacher/project-assistant/:projectId" element={<AIProjectAssistant />} />
                <Route path="/teacher/viva/:projectId" element={<TeacherVivaAssistant />} />
                <Route path="/projects/:projectId/tasks" element={<ProjectKanban />} />
                <Route path="/projects/:projectId/code-review" element={<CodeReview />} />
                <Route path="/projects/:projectId/messages" element={<ProjectChat />} />
                <Route path="/student/assignments/:id" element={<StudentAssignmentView />} />
                <Route path="/teacher/submissions/:submissionId" element={<TeacherDashboard />} />

                <Route path="/leaderboard" element={<Leaderboard />} />

                {/* Protected Global Routes */}
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </Box>
        </Flex>
      </Router>
    </NotificationProvider>
  );
};

export default App;
