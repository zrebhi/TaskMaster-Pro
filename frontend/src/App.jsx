import { useContext } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import AuthPage from './pages/AuthPage';
import ProjectListPage from './pages/ProjectListPage';
import ProjectTasksPage from './pages/ProjectTasksPage';
import AuthContext, { AuthProvider } from './context/AuthContext';
import { ErrorProvider } from './context/ErrorContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import Layout from './components/Layout/Layout';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/Routing/ProtectedRoute';

// Component to handle redirection based on authentication state
const RootRedirect = () => {
  const auth = useContext(AuthContext);
  // if (auth.isLoading) {
  //   return <div>Loading...</div>;
  // }
  return auth.isAuthenticated ? (
    <Navigate to="/projects" replace />
  ) : (
    <Navigate to="/auth" replace />
  );
};

function App() {
  return (
    <ErrorProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary fallbackComponent="App">
          <Router>
            <AuthProvider>
                  <Layout>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/auth/login" element={<AuthPage />} />
                      <Route path="/auth/register" element={<AuthPage />} />

                      {/* Protected Routes */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="/projects" element={<ProjectListPage />} />
                        <Route
                          path="/projects/:projectId"
                          element={<ProjectTasksPage />}
                        />
                      </Route>

                      {/* Redirect from root */}
                      <Route path="/" element={<RootRedirect />} />

                      {/* Catch-all redirect */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
            </AuthProvider>
            <Toaster />
          </Router>
        </ErrorBoundary>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorProvider>
  );
}

export default App;
