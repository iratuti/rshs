import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAuthenticated, checkAuth } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(location.state?.user ? false : true);

  useEffect(() => {
    // If user data was passed from AuthCallback, skip auth check
    if (location.state?.user) {
      setIsChecking(false);
      return;
    }

    const verify = async () => {
      await checkAuth();
      setIsChecking(false);
    };

    verify();
  }, [location.state, checkAuth]);

  // Show loading while checking authentication
  if (loading || isChecking) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto" />
          <p className="text-slate-600 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check admin requirement
  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if non-admin trying to access admin routes
  if (!requireAdmin && user?.role === 'ADMIN' && location.pathname.startsWith('/dashboard')) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
