import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

// --- Imports ---
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import AdminDashboard from './pages/AdminDashboard';
import AddTeacher from './pages/AddTeacher';
import AddStudent from './pages/AddStudent';
import UploadResult from './pages/UploadResult';
import ManageFees from './pages/ManageFees'; // Ye abhi fix kiya tha humne
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CreateExam from './pages/CreateExam'; // Import karein
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {/* Toast Notification Position */}
        <Toaster position="top-center" richColors />

        {/* --- ROUTES --- */}
        <Routes>
          {/* ✅ AB YAHAN CHANGE KIYA HAI: */}
          {/* Jaise hi app khulegi, sidha /login par bhej dega */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Login & Setup */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup" element={<ProfileSetupPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/add-teacher" element={<AddTeacher />} />
          <Route path="/admin/add-student" element={<AddStudent />} />
          <Route path="/admin/upload-result" element={<UploadResult />} />
          <Route path="/admin/manage-fees" element={<ManageFees />} />

          {/* User Routes */}
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          
          {/* Agar koi galat link dale to Login par wapas bhej do */}
          <Route path="*" element={<Navigate to="/login" replace />} />
<Route path="/admin/create-exam" element={<CreateExam />} />
        </Routes>
        
      </ThemeProvider>
    </QueryClientProvider>
  );
}
