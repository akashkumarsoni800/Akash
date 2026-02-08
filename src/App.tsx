import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// --- COMPONENTS ---
import Sidebar from './components/Sidebar';
import StudentRegistrationForm from './components/student/StudentRegistrationForm';

// --- PUBLIC PAGES ---
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import ResetPassword from './pages/ResetPassword';
import ProfileSetupPage from './pages/ProfileSetupPage';

// --- DASHBOARDS ---
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

// --- FEATURES ---
import StudentResult from './pages/StudentResult';
import StudentNotices from './pages/StudentNotices';
import StudentFees from './pages/StudentFees';
import TeacherAttendance from './pages/TeacherAttendance';
import TeacherHomework from './pages/TeacherHomework';        // ✅ NEW IMPORT
import AddStudent from './pages/AddStudent';
import AddTeacher from './pages/AddTeacher';
import AddEvent from './pages/AddEvent';
import CreateExam from './pages/CreateExam';
import ManageFees from './pages/ManageFees';
import UploadResult from './pages/UploadResult';
import StudentProfile from './pages/StudentProfile';
import CreateAdmin from './pages/CreateAdmin';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 notranslate flex flex-col">
        <Toaster position="top-right" richColors closeButton />

        <Routes>
          {/* 🟢 PUBLIC ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<StudentRegistrationForm />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* 🔵 PROTECTED ROUTES WITH SIDEBAR */}
          <Route element={<Sidebar />}>
            <Route path="/profile-setup" element={<ProfileSetupPage />} />

            {/* 👨‍🏫 TEACHER SECTION */}
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/attendance" element={<TeacherAttendance />} />
            <Route path="/teacher/homework" element={<TeacherHomework />} />      {/* ✅ NEW */}
            <Route path="/teacher/homework/:id" element={<TeacherHomework />} />  {/* ✅ DETAIL */}
            <Route path="/teacher/upload-result" element={<UploadResult />} />

            {/* 👨‍🎓 STUDENT SECTION */}
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/fees" element={<StudentFees />} />
            <Route path="/student/result" element={<StudentResult />} />
            <Route path="/student/notices" element={<StudentNotices />} />

            {/* 👨‍💼 ADMIN SECTION */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/manage-fees" element={<ManageFees />} />
            <Route path="/admin/create-exam" element={<CreateExam />} />
            <Route path="/admin/upload-result" element={<UploadResult />} />
            <Route path="/admin/add-student" element={<AddStudent />} />
            <Route path="/admin/add-teacher" element={<AddTeacher />} />
            <Route path="/admin/add-event" element={<AddEvent />} />
            <Route path="/admin/student/:id" element={<StudentProfile />} />
            <Route path="/admin/create-admin" element={<CreateAdmin />} />
          </Route>

          {/* 🔴 404 */}
          <Route path="*" element={
            <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-center p-6">
              <span className="text-6xl mb-4">🚫</span>
              <h1 className="text-2xl font-bold text-red-600 mb-2">404 - Page Not Found</h1>
              <a href="/" className="mt-4 bg-blue-900 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Go to Login</a>
            </div>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
