import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// --- 1. COMPONENTS ---
import Sidebar from './components/Sidebar';
import StudentRegistrationForm from './components/student/StudentRegistrationForm';

// --- 2. PUBLIC PAGES (Auth) ---
import LoginPage from './pages/LoginPage';
import ResetPassword from './pages/ResetPassword';
import ProfileSetupPage from './pages/ProfileSetupPage'; // यूनिवर्सल प्रोफाइल पेज

// --- 3. STUDENT DASHBOARDS & FEATURES ---
import StudentDashboard from './pages/StudentDashboard';
import StudentResult from './pages/StudentResult';
import StudentNotices from './pages/StudentNotices';
import StudentFees from './pages/StudentFees';

// --- 4. TEACHER DASHBOARDS & FEATURES ---
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherAttendance from './pages/TeacherAttendance';

// --- 5. ADMIN FEATURES ---
import AdminDashboard from './pages/AdminDashboard';
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
        
        {/* प्रोफाइल सेटअप अब सबके लिए (Student/Teacher/Admin) */}
        <Route path="/profile-setup" element={<ProfileSetupPage />} />

        {/* ========================== */}
        {/* 🟠 STUDENT ROUTES           */}
        {/* ========================== */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/result" element={<StudentResult />} />
        <Route path="/student/notices" element={<StudentNotices />} />
        <Route path="/student/fees" element={<StudentFees />} />

        {/* ========================== */}
        {/* 🟡 TEACHER ROUTES          */}
        {/* ========================== */}
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/attendance" element={<TeacherAttendance />} />
        {/* टीचर भी उसी रिजल्ट अपलोड कंपोनेंट को देख सकता है */}
        <Route path="/teacher/upload-result" element={<UploadResult />} />

        {/* ========================== */}
        {/* 🔵 ADMIN ROUTES (With Sidebar Drawer) */}
        {/* ========================== */}
        <Route element={<Sidebar />}>
          {/* एडमिन के सभी पेज यहाँ Sidebar के Outlet में रेंडर होंगे */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/manage-fees" element={<ManageFees />} />
          <Route path="/admin/create-exam" element={<CreateExam />} />
          <Route path="/admin/upload-result" element={<UploadResult />} />
          <Route path="/admin/add-student" element={<AddStudent />} />
          <Route path="/admin/add-teacher" element={<AddTeacher />} />
          <Route path="/admin/add-event" element={<AddEvent />} />
        </Route>

        {/* ========================== */}
        {/* 🔴 ERROR HANDLING (404)    */}
        {/* ========================== */}
        <Route path="*" element={
          <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <span className="text-6xl mb-4">🚫</span>
            <h1 className="text-2xl font-bold text-red-600 mb-2">404 - Page Not Found</h1>
            <p className="text-gray-500 mb-6">Oops! The page you're looking for doesn't exist.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-900 text-white px-6 py-2 rounded-xl font-bold"
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
