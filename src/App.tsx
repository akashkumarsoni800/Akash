import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

// --- Crash Catcher (Error Boundary) ---
class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorInfo: "" };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("CRASH REPORT:", error);
    this.setState({ errorInfo: error.toString() });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 text-red-900 min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold">App Crashed</h1>
          <p className="mt-2 text-sm text-red-700">Please check console for details.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Imports ---
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerUserRole } from './hooks/useQueries';

// --- Pages ---
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import AddTeacher from './pages/AddTeacher';
import AddStudent from './pages/AddStudent';
import UploadResult from './pages/UploadResult';
import ManageFees from './pages/ManageFees';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

const queryClient = new QueryClient();

// --- Auth Logic (Safe Mode) ---
const AuthRedirector = () => {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: userRole, isLoading: roleLoading } = useGetCallerUserRole();

  const isAuthenticated = !!identity;

  // 1. Loading Check
  if (isInitializing || (isAuthenticated && (profileLoading || roleLoading))) {
    return <div className="p-10 text-center">Loading System...</div>;
  }

  // 2. Login Check
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAuthenticated && !userProfile) return <Navigate to="/setup" replace />;

  // 3. Role Check (Converted to String to prevent crash)
  const safeRole = String(userRole || ""); 
  const safeType = String(userProfile?.userType || "");

  if (safeRole === 'admin' || safeType === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (safeType === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (safeType === 'student') return <Navigate to="/student/dashboard" replace />;

  return <div className="p-10 text-center">Role Unknown. Contact Admin.</div>;
};

// --- Main App ---
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <BrowserRouter>
            <Toaster position="top-center" richColors />
            
            {/* Routes Block: No comments allowed here */}
            <Routes>
              <Route path="/" element={<AuthRedirector />} />
              
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/setup" element={<ProfileSetupPage />} />
              
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/add-teacher" element={<AddTeacher />} />
              <Route path="/admin/add-student" element={<AddStudent />} />
              <Route path="/admin/upload-result" element={<UploadResult />} />
              <Route path="/admin/manage-fees" element={<ManageFees />} />

              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
