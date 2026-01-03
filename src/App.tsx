import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

// --- Hooks ---
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerUserRole } from './hooks/useQueries';

// --- Backend Helper ---
// Make sure ye file exist karti ho, nahi to ise hata dein aur strings use karein
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
import ManageFees from './pages/ManageFees'; // <--- Yeh wahi file hai jo humne abhi fix ki thi

// Other Dashboards
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

// 1. Query Client Setup
const queryClient = new QueryClient();

// 2. Auth Redirector (Login Check Logic)
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
  // Note: Agar 'UserRole' import error de, to yahan direct string check karein e.g. userRole === 'admin'
  const isAdmin = userRole === (UserRole?.admin || 'admin'); 
  const userType = userProfile?.userType || '';

  if (isAdmin || userType === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (userType === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (userType === 'student') return <Navigate to="/student/dashboard" replace />;

  return <div className="p-10 text-center">Access Pending or Unknown Role. Contact Admin.</div>;
};

// 3. Main App Component
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        
        <BrowserRouter>
          <Toaster position="top-center" richColors />
          
          <Routes>
            {/* Root Route - Decides where to go */}
            <Route path="/" element={<AuthRedirector />} />
            
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Setup */}
            <Route path="/setup" element={<ProfileSetupPage />} />
            
            {/* --- ADMIN ROUTES --- */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/add-teacher" element={<AddTeacher />} />
            <Route path="/admin/add-student" element={<AddStudent />} />
            <Route path="/admin/upload-result" element={<UploadResult />} />
            <Route path="/admin/manage-fees" element={<ManageFees />} />

            {/* --- TEACHER ROUTES --- */}
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            
            {/* --- STUDENT ROUTES --- */}
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            
            {/* Fallback for unknown routes (404) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        
        </BrowserRouter>
      
      </ThemeProvider>
    </QueryClientProvider>
  );
}
