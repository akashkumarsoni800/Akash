import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import DashboardHeader from './DashboardHeader'; // Header को यहाँ इम्पोर्ट करें

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = location.pathname.includes('/admin');

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* ✅ 1. Header को यहाँ कॉल करें और menu click handle करें */}
      <DashboardHeader 
        userName={isAdmin ? "Admin" : "Teacher"} 
        userRole={isAdmin ? "Administrator" : "Staff"} 
        onMenuClick={() => setIsOpen(true)} 
      />

      {/* ✅ 2. Sidebar Drawer */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={() => setIsOpen(false)}></div>
      )}

      <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Top Logo Area */}
        <div className="h-40 bg-blue-900 flex flex-col items-center justify-center text-white p-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden mb-2 border-4 border-blue-200">
             <span className="text-4xl">🏫</span>
          </div>
          <h2 className="font-bold text-lg">ASM Portal</h2>
          <button onClick={() => setIsOpen(false)} className="absolute top-2 right-2 text-white text-xl">✖</button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-220px)] font-medium">
          <Link to={isAdmin ? "/admin/dashboard" : "/teacher/dashboard"} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded transition">
            🏠 Dashboard
          </Link>
          
          {isAdmin && (
            <>
              <Link to="/admin/manage-fees" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded">💰 Manage Fees</Link>
              <Link to="/admin/upload-result" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded">📤 Upload Result</Link>
              <Link to="/admin/add-student" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded">🎓 Add Student</Link>
              <Link to="/admin/add-teacher" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded">👨‍🏫 Add Teacher</Link>
            </>
          )}
        </nav>
      </div>

      {/* ✅ 3. Main Content Area */}
      <div className="pt-16 p-6 min-h-screen">
        <Outlet />
      </div>

    </div>
  );
};

export default Sidebar;
