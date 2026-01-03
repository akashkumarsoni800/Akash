import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

// Hooks
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerUserRole } from './hooks/useQueries';

// Pages
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard'; // Ensure file exists
import StudentDashboard from './pages/StudentDashboard'; // Ensure file exists
import AddTeacher from './pages/AddTeacher';
import UploadResult from './pages/UploadResult';
import { UserRole } from './backend';

// 1. Query Client Setup
const queryClient = new QueryClient();

// 2. Ye Component decide karega ki user ko kahan bhejna hai (Aapka main logic)
const AuthRedirector = () => {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: userRole, isLoading: roleLoading } = useGetCallerUserRole();

  const isAuthenticated = !!identity;

  // Loading State
  if (isInitializing || (isAuthenticated && (profileLoading || roleLoading))) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="text-gray-500">System Loading...</p>
        </div>
      </div>
    );
  }

  // Case 1: Login nahi hai -> Login page par bhejo
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Case 2: Login hai par Profile nahi -> Setup page par bhejo
  if (isAuthenticated && !userProfile) {
    return <Navigate to="/setup" replace />;
  }

  // Case 3: Sab set hai -> Role ke hisab se Dashboard par bhejo
  const isAdmin = userRole === UserRole.admin;
  const userType = userProfile?.userType || '';

  if (isAdmin || userType === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (userType === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (userType === 'student') return <Navigate to="/student/dashboard" replace />;

  return <div>Access Pending or Unknown Role</div>;
};

// 3. Main App Component
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        
        {/* IMPORTANT: BrowserRouter sabse bahar hona chahiye */}
        <BrowserRouter>
          <Toaster position="top-center" richColors />
          
          <Routes>
            {/* Jab koi "/" par aaye, to AuthRedirector decide karega kahan jana hai */}
            <Route path="/" element={<AuthRedirector />} />
            
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route path="/setup" element={<ProfileSetupPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            
            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
           
            <Route path="/admin/add-teacher" element={<AddTeacher />} />
            <Route path="/admin/upload-result" element={<UploadResult />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/login" element={<LoginPage />} />
<Route path="/reset-password" element={<ResetPassword />} />

          </Routes>
        
        </BrowserRouter>
      
      </ThemeProvider>
    </QueryClientProvider>
  );
}