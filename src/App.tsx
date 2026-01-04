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
import Sidebar from './components/Sidebar';

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        
        {/* 1. LOGIN PAGE (Sabse pehle ye dikhega) */}
        <Route path="/" element={<LoginPage />} />

        {/* 2. MAIN APP (Login ke baad wale pages) */}
        <Route element={<Sidebar />}>
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/manage-fees" element={<ManageFees />} />
          <Route path="/admin/create-exam" element={<CreateExam />} />
          <Route path="/admin/upload-result" element={<UploadResult />} />
          <Route path="/admin/add-event" element={<AddEvent />} />

          {/* Student & Teacher Routes (Future ke liye) */}
          <Route path="/student/dashboard" element={<div className="p-10">Student Panel Coming Soon...</div>} />
          
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
