import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// Pages Import
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ManageFees from './pages/ManageFees';
import CreateExam from './pages/CreateExam';
import UploadResult from './pages/UploadResult';
import AddEvent from './pages/AddEvent';

// Component Import
import Sidebar from './components/Sidebar'; // 👈 Ye naya import hai

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        
        {/* 1. LOGIN PAGE (Bina Logo/Sidebar ke) */}
        <Route path="/" element={<LoginPage />} />


        {/* 2. PROTECTED ROUTES (Sidebar + Logo ke sath) */}
        {/* Ye 'element={<Sidebar />}` ka matlab hai ki iske andar jitne pages hain, sabme Sidebar dikhega */}
        <Route element={<Sidebar />}>
          
          {/* Admin Pages */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/manage-fees" element={<ManageFees />} />
          <Route path="/admin/create-exam" element={<CreateExam />} />
          <Route path="/admin/upload-result" element={<UploadResult />} />
          <Route path="/admin/add-event" element={<AddEvent />} />

          {/* Student Pages */}
          <Route path="/student/dashboard" element={<div className="p-4">Student Dashboard (Coming Soon)</div>} />
          
          {/* Teacher Pages */}
          <Route path="/teacher/dashboard" element={<div className="p-4">Teacher Dashboard (Coming Soon)</div>} />

        </Route>

      </Routes>
    </Router>
  );
}

export default App;
