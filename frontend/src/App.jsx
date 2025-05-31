import { useContext } from 'react'; // Import useContext
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom'; // Import Navigate
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage'; // Import DashboardPage
import AuthContext, { AuthProvider } from './context/AuthContext'; // Import AuthContext
import { ProjectProvider } from './context/ProjectContext';
import Navbar from './components/Layout/Navbar';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/Routing/ProtectedRoute';

// Component to handle redirection based on authentication state
const RootRedirect = () => {
  const auth = useContext(AuthContext);
  if (auth.isLoading) {
    // Show a loading spinner while auth state is being determined
    return <div>Loading...</div>;
  }
  return auth.isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/auth" replace />
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProjectProvider>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/login" element={<AuthPage />} />
            <Route path="/auth/register" element={<AuthPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<DashboardPage />} />
            </Route>

            {/* Redirect from root */}
            <Route path="/" element={<RootRedirect />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ProjectProvider>
      </AuthProvider>
      <Toaster />
    </Router>
  );
}

export default App;
