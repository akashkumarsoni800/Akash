import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { motion } from 'framer-motion'; // ✅ Added for 404 animation

// --- COMPONENTS ---
import Sidebar from './components/Sidebar';
import StudentRegistrationForm from './components/student/StudentRegistrationForm';
import ProtectedRoute from './components/ProtectedRoute';

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
import TeacherHomework from './pages/TeacherHomework';           // ✅ EXISTING
import TeacherStudentList from './pages/TeacherStudentList';    // ✅ NEW 
import TeacherAnalytics from './pages/TeacherAnalytics';        // ✅ NEW
import UploadResult from './pages/UploadResult';

// --- STUDENT FEATURES ---
import StudentResult from './pages/StudentResult';
import StudentNotices from './pages/StudentNotices';
import StudentFees from './pages/StudentFees';
import StudentAttendance from './pages/StudentAttendance';
import StudentHomework from './pages/StudentHomework';
import StudentICardPage from './pages/StudentICardPage';

// --- ADMIN FEATURES ---
import AddStudent from './pages/AddStudent';
import AddTeacher from './pages/AddTeacher';
import AddEvent from './pages/AddEvent';
import CreateExam from './pages/CreateExam';
import ManageFees from './pages/ManageFees';
import StudentProfile from './pages/StudentProfile';
import CreateAdmin from './pages/CreateAdmin';
import TeacherSalary from './pages/TeacherSalary';
import ManageSalaries from './pages/ManageSalaries';
import ManageInventory from './pages/ManageInventory';
import DocumentHub from './pages/DocumentHub';


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
           <Route path="/profile-setup" element={<ProfileSetupPage />} />
           


          {/* 🔵 PROTECTED ROUTES WITH SIDEBAR */}
          <Route element={<Sidebar />}>
            {/* 👨‍🏫 TEACHER SECTION */}
            <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/attendance" element={<ProtectedRoute allowedRole="teacher"><TeacherAttendance /></ProtectedRoute>} />
            <Route path="/teacher/homework" element={<ProtectedRoute allowedRole="teacher"><TeacherHomework /></ProtectedRoute>} />
            <Route path="/teacher/homework/:id" element={<ProtectedRoute allowedRole="teacher"><TeacherHomework /></ProtectedRoute>} />
            <Route path="/teacher/students" element={<ProtectedRoute allowedRole="teacher"><TeacherStudentList /></ProtectedRoute>} />
            <Route path="/teacher/student/:id" element={<ProtectedRoute allowedRole="teacher"><TeacherStudentList /></ProtectedRoute>} />
            <Route path="/teacher/analytics" element={<ProtectedRoute allowedRole="teacher"><TeacherAnalytics /></ProtectedRoute>} />
            <Route path="/teacher/upload-result" element={<ProtectedRoute allowedRole="teacher"><UploadResult /></ProtectedRoute>} />

            {/* 👨‍🎓 STUDENT SECTION */}
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/fees" element={<ProtectedRoute allowedRole="student"><StudentFees /></ProtectedRoute>} />
            <Route path="/student/result" element={<ProtectedRoute allowedRole="student"><StudentResult /></ProtectedRoute>} />
            <Route path="/student/homework" element={<ProtectedRoute allowedRole="student"><StudentHomework /></ProtectedRoute>} />
            <Route path="/student/attendance" element={<ProtectedRoute allowedRole="student"><StudentAttendance /></ProtectedRoute>} />
            <Route path="/student/id-card" element={<ProtectedRoute allowedRole="student"><StudentICardPage /></ProtectedRoute>} />
            <Route path="/student/notices" element={<ProtectedRoute allowedRole="student"><StudentNotices /></ProtectedRoute>} />

            {/* 👨‍💼 ADMIN SECTION */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/manage-fees" element={<ProtectedRoute allowedRole="admin"><ManageFees /></ProtectedRoute>} />
            <Route path="/admin/create-exam" element={<ProtectedRoute allowedRole="admin"><CreateExam /></ProtectedRoute>} />
            <Route path="/admin/upload-result" element={<ProtectedRoute allowedRole="admin"><UploadResult /></ProtectedRoute>} />
            <Route path="/admin/add-student" element={<ProtectedRoute allowedRole="admin"><AddStudent /></ProtectedRoute>} />
            <Route path="/admin/add-teacher" element={<ProtectedRoute allowedRole="admin"><AddTeacher /></ProtectedRoute>} />
            <Route path="/admin/add-event" element={<ProtectedRoute allowedRole="admin"><AddEvent /></ProtectedRoute>} />
            <Route path="/admin/student/:id" element={<ProtectedRoute allowedRole="admin"><StudentProfile /></ProtectedRoute>} />
            <Route path="/admin/create-admin" element={<ProtectedRoute allowedRole="admin"><CreateAdmin /></ProtectedRoute>} />
            <Route path="/admin/teacher-salary" element={<ProtectedRoute allowedRole="admin"><TeacherSalary /></ProtectedRoute>} />
            <Route path="/admin/manage-salaries" element={<ProtectedRoute allowedRole="admin"><ManageSalaries /></ProtectedRoute>} />
            <Route path="/admin/inventory" element={<ProtectedRoute allowedRole="admin"><ManageInventory /></ProtectedRoute>} />
            <Route path="/admin/documents" element={<ProtectedRoute allowedRole="admin"><DocumentHub /></ProtectedRoute>} />
          </Route>

          {/* 🔴 404 - ENHANCED */}
          <Route path="*" element={
            <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 text-center p-6">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.6 }}
                className="text-8xl mb-8 drop-shadow-2xl"
              >
                 🚫 404
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold text-red-600 mb-4  tracking-widest animate-pulse">
                404 - Page Not Found
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-md leading-relaxed">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <a 
                href="/" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-3xl font-bold text-xl  tracking-widest shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 border-0"
              >
                ← Back to Login
              </a>
            </div>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
