import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { exchangeSession } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use useRef to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          console.error('No session_id found in URL');
          navigate('/login');
          return;
        }

        // Exchange session_id for session_token
        const user = await exchangeSession(sessionId);
        
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        
        // Redirect based on role
        if (user.role === 'ADMIN') {
          navigate('/admin', { state: { user }, replace: true });
        } else {
          navigate('/dashboard', { state: { user }, replace: true });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    processCallback();
  }, [location, navigate, exchangeSession]);

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto" />
        <p className="text-slate-600 font-medium">Memproses login...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
