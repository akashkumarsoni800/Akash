import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// --- 1. COMPONENTS ---
import Sidebar from './components/Sidebar';
import StudentRegistrationForm from './components/student/StudentRegistrationForm';

// --- 2. PUBLIC PAGES (Auth) ---
import LoginPage from './pages/LoginPage';
import ResetPassword from './pages/ResetPassword';
import ProfileSetupPage from './pages/ProfileSetupPage';

// --- 3. DASHBOARDS ---
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

// --- 4. STUDENT FEATURES ---
import StudentResult from './pages/StudentResult';
import StudentNotices from './pages/StudentNotices';
import StudentFees from './pages/StudentFees';

// --- 5. TEACHER FEATURES ---
import TeacherAttendance from './pages/TeacherAttendance';

// --- 6. ADMIN FEATURES ---
import AddStudent from './pages/AddStudent';
import AddTeacher from './pages/AddTeacher';
import AddEvent from './pages/AddEvent';
import CreateExam from './pages/CreateExam';
import ManageFees from './pages/ManageFees';
import UploadResult from './pages/UploadResult';

function App() {
  return (
    <Router>
      {/* ग्लोबल नोटिफिकेशन सिस्टम */}
      <Toaster position="top-right" richColors closeButton />

      <Routes>
        {/* ========================== */}
        {/* 🟢 PUBLIC ROUTES (No Sidebar) */}
        {/* ========================== */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<StudentRegistrationForm />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ========================== */}
        {/* 🔵 UNIVERSAL SIDEBAR ROUTES */}
        {/* ========================== */}
        {/* इसके अंदर जो भी Route होगा, उसे Sidebar (☰ Menu) मिलेगा */}
        <Route element={<Sidebar />}>
          
          {/* Universal Profile Setup */}
          <Route path="/profile-setup" element={<ProfileSetupPage />} />

          {/* --- Student Section --- */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/fees" element={<StudentFees />} />
          <Route path="/student/result" element={<StudentResult />} />
          <Route path="/student/notices" element={<StudentNotices />} />

          {/* --- Teacher Section --- */}
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/attendance" element={<TeacherAttendance />} />
          <Route path="/teacher/upload-result" element={<UploadResult />} />

          {/* --- Admin Section --- */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/manage-fees" element={<ManageFees />} />
          <Route path="/admin/create-exam" element={<CreateExam />} />
          <Route path="/admin/upload-result" element={<UploadResult />} />
          <Route path="/admin/add-student" element={<AddStudent />} />
          <Route path="/admin/add-teacher" element={<AddTeacher />} />
          <Route path="/admin/add-event" element={<AddEvent />} />
        </Route>

        {/* ========================== */}
        {/* 🔴 404 - PAGE NOT FOUND    */}
        {/* ========================== */}
        <Route path="*" element={
          <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-center p-6">
            <span className="text-6xl mb-4">🚫</span>
            <h1 className="text-2xl font-bold text-red-600 mb-2">404 - Page Not Found</h1>
            <button 
              onClick={() => window.location.href = '/'}
              className="mt-4 bg-blue-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg"
            >
              Go to Login
            </button>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
