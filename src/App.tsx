import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

// --- Error Boundary (Crash Catcher) ---
class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("CRASH:", error);
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-10 text-red-600 font-bold">💥 Component Crashed (Check Console)</div>;
    }
    return this.props.children;
  }
}

// --- Imports ---
// Agar inme se koi file missing h to use hata dein
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import AdminDashboard from './pages/AdminDashboard';
import AddTeacher from './pages/AddTeacher';
import AddStudent from './pages/AddStudent';
import UploadResult from './pages/UploadResult';
import ManageFees from './pages/ManageFees';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

const queryClient = new QueryClient();

// --- TEST MODE REDIRECTOR (Isme Crash hone ka chance 0% hai) ---
const ManualAuth = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6 text-blue-900">🛠️ Debug Mode Active</h1>
      <p className="mb-4 text-gray-600">Database logic disabled. Choose where to go:</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
        <button onClick={() => window.location.href = '/login'} className="p-3 bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium">
          Go to Login Page
        </button>
        
        <button onClick={() => window.location.href = '/admin/dashboard'} className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
          Go to Admin Dashboard
        </button>
        
        <button onClick={() => window.location.href = '/admin/manage-fees'} className="p-3 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium">
          Check Manage Fees (Isme Error tha?)
        </button>

        <button onClick={() => window.location.href = '/student/dashboard'} className="p-3 bg-green-600 text-white rounded hover:bg-green-700 font-medium">
          Go to Student Dashboard
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <BrowserRouter>
            <Toaster position="top-center" richColors />
            
            <Routes>
              {/* Root par ab hum sidha Logic nahi lagayenge, Manual Buttons dikhayenge */}
              <Route path="/" element={<ManualAuth />} />
              
              <Route path="/login" element={<LoginPage />} />
              <Route path="/setup" element={<ProfileSetupPage />} />
              
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/add-teacher" element={<AddTeacher />} />
              <Route path="/admin/add-student" element={<AddStudent />} />
              <Route path="/admin/upload-result" element={<UploadResult />} />
              
              {/* Is Route ko dhyaan se dekhein */}
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
