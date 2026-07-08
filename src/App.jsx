import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useContext, useEffect } from 'react';

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

// ─── Premium Page Transition ─────────────────────────────────────────────────
const pageVariants = {
  initial:  { opacity: 0, scale: 0.993 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 1.004,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
};

const PageWrapper = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{ height: '100%' }}
  >
    {children}
  </motion.div>
);


// ─── Premium Loading Screen ──────────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg-workspace)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    gap: '24px',
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Ambient blobs */}
    <div style={{
      position: 'absolute', top: '20%', left: '20%',
      width: '300px', height: '300px',
      background: 'oklch(58% 0.25 274 / 15%)',
      borderRadius: '50%', filter: 'blur(80px)',
      animation: 'blobFloat 14s ease-in-out infinite',
    }} />
    <div style={{
      position: 'absolute', bottom: '20%', right: '20%',
      width: '250px', height: '250px',
      background: 'oklch(61% 0.26 300 / 12%)',
      borderRadius: '50%', filter: 'blur(80px)',
      animation: 'blobFloat 18s ease-in-out infinite',
      animationDelay: '-6s',
    }} />

    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
    >
      {/* Logo */}
      <img src="/logo.png" alt="CodeAI" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />

      {/* Shimmer bar */}
      <div style={{
        width: '200px',
        height: '4px',
        borderRadius: '9999px',
        background: 'linear-gradient(90deg, transparent, oklch(68% 0.21 278), oklch(61% 0.26 300), transparent)',
        backgroundSize: '300% 100%',
        animation: 'shimmer 1.6s ease-in-out infinite',
      }} />
    </motion.div>
  </div>
);

// ─── Route Guards ────────────────────────────────────────────────────────────
const ProtectedWorkspaceRoute = () => {
  const { isAuthenticated, isLoading } = useContext(AppContext);

  if (isLoading) return <LoadingScreen />;
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
    if (lastProject) return <Navigate to={`/ide?project=${lastProject}`} replace />;
    return <Navigate to={user?.role === 'teacher' ? '/teacher/courses' : '/dashboard'} replace />;
  }
  return children;
};

const WildcardRedirect = () => {
  const { user } = useContext(AppContext);
  const lastProject = localStorage.getItem('lastActiveProjectId');
  if (lastProject) return <Navigate to={`/ide?project=${lastProject}`} replace />;
  return <Navigate to={user?.role === 'teacher' ? '/teacher/courses' : '/dashboard'} replace />;
};

// ─── Animated Routes ─────────────────────────────────────────────────────────
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public & Auth Routes */}
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/login"    element={<PublicRoute><PageWrapper><Auth type="login" /></PageWrapper></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><PageWrapper><Auth type="register" /></PageWrapper></PublicRoute>} />

        {/* Workspace Routes (all protected) */}
        <Route element={<ProtectedWorkspaceRoute />}>
          <Route path="/dashboard"         element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/courses"           element={<PageWrapper><CourseCatalog /></PageWrapper>} />
          <Route path="/lesson/:id"        element={<PageWrapper><Lesson /></PageWrapper>} />
          <Route path="/profile"           element={<PageWrapper><Profile /></PageWrapper>} />
          <Route path="/profile/:id"       element={<PageWrapper><Profile /></PageWrapper>} />
          <Route path="/settings"          element={<PageWrapper><Settings /></PageWrapper>} />
          <Route path="/ide"               element={<PageWrapper><IDE /></PageWrapper>} />
          <Route path="/challenges"        element={<PageWrapper><Challenges /></PageWrapper>} />
          <Route path="/challenges/:id"    element={<PageWrapper><ChallengeDetail /></PageWrapper>} />
          <Route path="/projects"          element={<PageWrapper><Projects /></PageWrapper>} />
          <Route path="/paths"             element={<PageWrapper><LearningPaths /></PageWrapper>} />
          <Route path="/teacher/courses"   element={<PageWrapper><TeacherStudio /></PageWrapper>} />
          <Route path="/teacher/studio"    element={<PageWrapper><TeacherStudio /></PageWrapper>} />
          <Route path="/admin"             element={<PageWrapper><AdminDashboard /></PageWrapper>} />
        </Route>

        {/* Wildcard */}
        <Route path="*" element={<WildcardRedirect />} />
      </Routes>
    </AnimatePresence>
  );
}

// ─── App Root ────────────────────────────────────────────────────────────────
function App() {
  // Apply dark theme by default
  useEffect(() => {
    if (!document.documentElement.getAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  return (
    <Router>
      {/* Ambient global background (behind everything) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Primary aurora blob */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'oklch(58% 0.25 274 / 12%)',
          borderRadius: '50%',
          filter: 'blur(120px)',
          animation: 'blobFloat 18s ease-in-out infinite',
        }} />
        {/* Secondary aurora blob */}
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '500px',
          height: '500px',
          background: 'oklch(61% 0.26 300 / 10%)',
          borderRadius: '50%',
          filter: 'blur(120px)',
          animation: 'blobFloat 22s ease-in-out infinite',
          animationDelay: '-9s',
        }} />
        {/* Tertiary blue blob */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '40%',
          width: '400px',
          height: '400px',
          background: 'oklch(65% 0.22 240 / 8%)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          animation: 'blobFloat 26s ease-in-out infinite',
          animationDelay: '-4s',
        }} />
      </div>

      <AnimatedRoutes />
    </Router>
  );
}

export default App;
