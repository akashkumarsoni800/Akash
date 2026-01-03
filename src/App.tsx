import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

// --- Error Boundary (Crash Catcher) ---
class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorInfo: "" };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("CRASH REPORT:", error, errorInfo);
    this.setState({ errorInfo: error.toString() });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-900 h-screen">
          <h1 className="text-2xl font-bold">Something went wrong!</h1>
          <p className="mt-2">React crashed due to an Object/Invalid Child error.</p>
          <div className="mt-4 p-4 bg-white border border-red-300 rounded font-mono text-sm">
            {this.state.errorInfo}
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload App
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

// --- Backend Helper ---
// Agar ye import error de, to ise hata dein aur code me niche 'admin' string use karein
import { UserRole } from './backend'; 

// --- Pages ---
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import ResetPassword from './pages/ResetPassword';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AddTeacher from './pages/AddTeacher';
import AddStudent from './pages/AddStudent';
import UploadResult from './pages/UploadResult';
import ManageFees from './pages/ManageFees';

// Other Dashboards
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

const queryClient = new QueryClient();

// --- Auth Logic ---
const AuthRedirector = () => {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: userRole, isLoading: roleLoading } = useGetCallerUserRole();

  const isAuthenticated = !!identity;

  if (isInitializing || (isAuthenticated && (profileLoading || roleLoading))) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAuthenticated && !userProfile) return <Navigate to="/setup" replace />;

  // Role Check
  const isAdmin = userRole === (UserRole?.admin || 'admin'); 
  const userType = userProfile?.userType || '';

  if (isAdmin || userType === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (userType === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (userType === 'student') return <Navigate to="/student/dashboard" replace />;

  return <div className="p-10 text-center">Role Unknown. Please contact support.</div>;
};

// --- Main App ---
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <BrowserRouter>
            <Toaster position="top-center" richColors />
            
            <Routes>
              {/* Root */}
              <Route path="/" element={<AuthRedirector />} />
              
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/setup" element={<ProfileSetupPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/add-teacher" element={<AddTeacher />} />
              <Route path="/admin/add-student" element={<AddStudent />} />
              <Route path="/admin/upload-result" element={<UploadResult />} />
              <Route path="/admin/manage-fees" element={<ManageFees />} />

              {/* Teacher Routes */}
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              
              {/* Student Routes */}
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              
              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
