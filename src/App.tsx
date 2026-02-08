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

// --- TEACHER FEATURES (NEW & EXISTING) ---
import TeacherAttendance from './pages/TeacherAttendance';
import TeacherHomework from './pages/TeacherHomework';           // ✅ NEW
import TeacherStudentList from './pages/TeacherStudentList';    // ✅ NEW
import TeacherAnalytics from './pages/TeacherAnalytics';        // ✅ NEW
import UploadResult from './pages/UploadResult';

// --- STUDENT FEATURES ---
import StudentResult from './pages/StudentResult';
import StudentNotices from './pages/StudentNotices';
import StudentFees from './pages/StudentFees';

// --- ADMIN FEATURES ---
import AddStudent from './pages/AddStudent';
import AddTeacher from './pages/AddTeacher';
import AddEvent from './pages/AddEvent';
import CreateExam from './pages/CreateExam';
import ManageFees from './pages/ManageFees';
import StudentProfile from './pages/StudentProfile';
import CreateAdmin from './pages/CreateAdmin';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 notranslate flex flex-col">
        {/* Global Notifications */}
        <Toaster position="top-right" richColors closeButton />

        <Routes>
          {/* 🟢 PUBLIC ROUTES (No Auth Required) */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<StudentRegistrationForm />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* 🔵 PROTECTED ROUTES (With Sidebar Layout) */}
          <Route element={<Sidebar />}>
            
            {/* 👤 Universal Profile */}
            <Route path="/profile-setup" element={<ProfileSetupPage />} />

            {/* 👨‍🏫 TEACHER SECTION - COMPLETE */}
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/attendance" element={<TeacherAttendance />} />
            <Route path="/teacher/homework" element={<TeacherHomework />} />
            <Route path="/teacher/homework/:id" element={<TeacherHomework />} />
            <Route path="/teacher/students" element={<TeacherStudentList />} />
            <Route path="/teacher/student/:id" element={<TeacherStudentList />} />
            <Route path="/teacher/analytics" element={<TeacherAnalytics />} />
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

          {/* 🔴 404 - PAGE NOT FOUND */}
          <Route path="*" element={
            <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 text-center p-6">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-8xl mb-8"
              >
                🚫
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-black text-red-600 mb-4 uppercase tracking-widest">
                404 - Page Not Found
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-md">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <a 
                href="/" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-3xl font-black text-xl uppercase tracking-widest shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300"
              >
                ← Back to Home
              </a>
            </div>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
