import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useContext } from 'react';

// Pages
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CourseCatalog from './pages/Courses';
import Lesson from './pages/Lesson';
import Profile from './pages/Profile';
import TeacherStudio from './pages/TeacherStudio';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import IDE from './pages/IDE';
import Challenges from './pages/Challenges';
import ChallengeDetail from './pages/ChallengeDetail';
import Projects from './pages/Projects';
import LearningPaths from './pages/LearningPaths';

// Context & Layouts
import { AppContext } from './context/AppContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import WorkspaceLayout from './components/WorkspaceLayout';

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    style={{ height: '100%' }}
  >
    {children}
  </motion.div>
);

const ProtectedWorkspaceRoute = () => {
  const { isAuthenticated, user, isLoading } = useContext(AppContext);
  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-darker)', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--overlay-bg-hover)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return (
    <WorkspaceProvider>
      <WorkspaceLayout />
    </WorkspaceProvider>
  );
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useContext(AppContext);
  if (isLoading) return null;
  if (isAuthenticated) {
    const lastProject = localStorage.getItem('lastActiveProjectId');
    if (lastProject) {
      return <Navigate to={`/ide?project=${lastProject}`} replace />;
    }
    return <Navigate to={user?.role === 'teacher' ? '/teacher/courses' : '/dashboard'} replace />;
  }
  return children;
};



const WildcardRedirect = () => {
  const { user } = useContext(AppContext);
  const lastProject = localStorage.getItem('lastActiveProjectId');
  if (lastProject) {
    return <Navigate to={`/ide?project=${lastProject}`} replace />;
  }
  return <Navigate to={user?.role === 'teacher' ? '/teacher/courses' : '/dashboard'} replace />;
};

function AnimatedRoutes() {
  const location = useLocation();
  const { user } = useContext(AppContext);
  return (
    <Routes location={location}>
      {/* Public & Auth Routes */}
      <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
      <Route path="/login" element={<PublicRoute><PageWrapper><Auth type="login" /></PageWrapper></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><PageWrapper><Auth type="register" /></PageWrapper></PublicRoute>} />
      
      {/* Workspace Routes (all protected) */}
      <Route element={<ProtectedWorkspaceRoute />}>
        <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/courses" element={<PageWrapper><CourseCatalog /></PageWrapper>} />
        <Route path="/lesson/:id" element={<PageWrapper><Lesson /></PageWrapper>} />
        <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
        <Route path="/profile/:id" element={<PageWrapper><Profile /></PageWrapper>} />
        <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
        
        <Route path="/ide" element={<PageWrapper><IDE /></PageWrapper>} />
        <Route path="/challenges" element={<PageWrapper><Challenges /></PageWrapper>} />
        <Route path="/challenges/:id" element={<PageWrapper><ChallengeDetail /></PageWrapper>} />
        <Route path="/projects" element={<PageWrapper><Projects /></PageWrapper>} />
        <Route path="/paths" element={<PageWrapper><LearningPaths /></PageWrapper>} />
        
        <Route path="/teacher/courses" element={<PageWrapper><TeacherStudio /></PageWrapper>} />
        <Route path="/teacher/studio" element={<PageWrapper><TeacherStudio /></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
      </Route>
      
      {/* Wildcard redirect */}
      <Route path="*" element={<WildcardRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <div className="gradient-bg">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;
