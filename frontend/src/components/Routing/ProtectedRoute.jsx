import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const ProtectedRoute = () => {
  const auth = useContext(AuthContext);

  if (auth === null) {
    // AuthContext might not be initialized yet, or there's an issue.
    // For simplicity, redirecting if context is not available.
    console.warn("AuthContext not available in ProtectedRoute. Redirecting to login.");
    return <Navigate to="/auth" replace />;
  }

  const { isAuthenticated, isLoading } = auth;

  if (isLoading) {
    // Optional: Show a loading spinner while auth state is being determined
    return <div>Loading authentication status...</div>;
  }

  if (!isAuthenticated) {
    // User not authenticated, redirect to login page
    // 'replace' avoids adding the current (protected) route to history
    return <Navigate to="/auth" replace />;
  }

  // User is authenticated, render the child route content
  return <Outlet />; // Renders the nested route components
};

export default ProtectedRoute;
