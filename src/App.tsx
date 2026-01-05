import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// --- 1. COMPONENTS ---
import Sidebar from './components/Sidebar';
// पक्का करें कि फ़ाइल का नाम और यहाँ लिखा नाम एक ही है
import StudentRegistrationForm from './components/student/StudentRegistrationForm';

// --- 2. PUBLIC PAGES ---
import LoginPage from './pages/LoginPage';
import ResetPassword from './pages/ResetPassword';
import ProfileSetupPage from './pages/ProfileSetupPage';

// --- 3. DASHBOARDS ---
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentResult from './pages/StudentResult';
import StudentNotices from './pages/StudentNotices';
import StudentFees from './pages/StudentFees'; // ✅ सही जगह इम्पोर्ट

// --- 4. ADMIN FEATURES ---
import AddStudent from './pages/AddStudent';
import AddTeacher from './pages/AddTeacher';
import AddEvent from './pages/AddEvent';
import CreateExam from './pages/CreateExam';
import ManageFees from './pages/ManageFees';
import UploadResult from './pages/UploadResult';

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />

      <Routes>
        {/* 🟢 PUBLIC ROUTES */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<StudentRegistrationForm />} />

        {/* 🟠 STUDENT & TEACHER ROUTES (Full Screen) */}
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/profile-setup" element={<ProfileSetupPage />} />
        <Route path="/student/result" element={<StudentResult />} />
        <Route path="/student/notices" element={<StudentNotices />} />
        <Route path="/student/fees" element={<StudentFees />} /> {/* ✅ अब यहाँ सही है */}

        {/* 🔵 ADMIN ROUTES (With Sidebar) */}
        <Route element={<Sidebar />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/add-student" element={<AddStudent />} />
          <Route path="/admin/add-teacher" element={<AddTeacher />} />
          <Route path="/admin/create-exam" element={<CreateExam />} />
          <Route path="/admin/upload-result" element={<UploadResult />} />
          <Route path="/admin/add-event" element={<AddEvent />} />
          <Route path="/admin/manage-fees" element={<ManageFees />} />
        </Route>

        {/* 🔴 404 PAGE */}
        <Route path="*" element={
          <div className="flex h-screen items-center justify-center text-red-600 font-bold text-xl bg-gray-100">
            🚫 404 - Page Not Found
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
