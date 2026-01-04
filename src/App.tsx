import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// --- 1. COMPONENTS ---
import Sidebar from './components/Sidebar';

// --- 2. PUBLIC PAGES (Auth) ---
import LoginPage from './pages/LoginPage';
import ResetPassword from './pages/ResetPassword';
import ProfileSetupPage from './pages/ProfileSetupPage'; // Screenshot ke hisab se naam update kiya

// --- 3. DASHBOARDS ---
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

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
      {/* Notifications ke liye */}
      <Toaster position="top-right" richColors />
      
      <Routes>
        
        {/* ========================== */}
        {/* 🟢 PUBLIC ROUTES           */}
        {/* ========================== */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile-setup" element={<ProfileSetupPage />} />


        {/* ========================== */}
        {/* 🟠 TEACHER & STUDENT ROUTES */}
        {/* ========================== */}
        {/* Inko Sidebar se bahar rakha hai taki full screen dikhe */}
        
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        
        <Route path="/student/dashboard" element={<StudentDashboard />} />


        {/* ========================== */}
        {/* 🔵 ADMIN ROUTES (Sidebar)  */}
        {/* ========================== */}
        {/* Sidebar sirf Admin Pages par dikhega */}
        <Route element={<Sidebar />}>
          
          {
