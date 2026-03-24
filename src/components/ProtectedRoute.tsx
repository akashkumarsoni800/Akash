import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: 'student' | 'teacher' | 'admin' | 'any';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        if (!currentSession) {
          setLoading(false);
          return;
        }

        const userEmail = currentSession.user.email;

        // 1. Check Student Table (Approved students only)
        const { data: student } = await supabase
          .from('students')
          .select('is_approved')
          .eq('email', userEmail)
          .limit(1)
          .maybeSingle();

        if (student && student.is_approved === 'approved') {
          setUserRole('student');
          setLoading(false);
          return;
        }

        // 2. Check Teacher/Admin Table
        const { data: staff } = await supabase
          .from('teachers')
          .select('role')
          .eq('email', userEmail)
          .limit(1)
          .maybeSingle();

        if (staff) {
          setUserRole(staff.role || 'teacher'); // 'teacher' or 'admin' (fallback to teacher)
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="font-black uppercase tracking-widest text-gray-400 italic animate-pulse">Verifying Access...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is still null after loading, it means user is not found in either table or not approved
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // Role Mismatch Protection
  if (allowedRole !== 'any' && allowedRole !== userRole) {
    // Redirect to their correct dashboard
    if (userRole === 'student') return <Navigate to="/student/dashboard" replace />;
    if (userRole === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
