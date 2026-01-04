import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate('/');
  };

  // Check karein ki user Admin hai ya Student (URL se andaza lagayenge)
  const isAdmin = location.pathname.includes('/admin');
  const isStudent = location.pathname.includes('/student');
  const isTeacher = location.pathname.includes('/teacher');

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* --- SIDEBAR START --- */}
      <div className="w-64 bg-blue-900 text-white flex flex-col fixed h-full shadow-lg">
        
        {/* 🏫 SCHOOL LOGO SECTION */}
        <div className="p-6 flex flex-col items-center border-b border-blue-800 bg-blue-950">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden border-4 border-blue-200 mb-3">
            {/* Logo Image - Make sure 'logo.png' is in public folder */}
            <img 
              src="/logo.png" 
              alt="School Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Agar logo na mile to Text dikhaye
                (e.target as HTMLImageElement).style.display = 'none';
              }} 
            />
            {/* Fallback Text if image fails */}
            <span className="text-blue-900 font-bold text-3xl absolute opacity-0">ASM</span>
          </div>
          <h2 className="text-lg font-bold text-center leading-tight">Adarsh Shishu Mandir</h2>
          <p className="text-xs text-blue-300 mt-1 uppercase tracking-wider">
            {isAdmin ? 'Admin Panel' : isStudent ? 'Student Panel' : 'Teacher Panel'}
          </p>
        </div>

        {/* 🔗 MENU LINKS */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          
          {/* Common Dashboard Link */}
          <Link to={isAdmin ? "/admin/dashboard" : isStudent ? "/student/dashboard" : "/teacher/dashboard"} className="block px-4 py-3 rounded hover:bg-blue-800 transition flex items-center gap-3">
            🏠 Dashboard
          </Link>

          {/* Admin Links */}
          {isAdmin && (
            <>
              <Link to="/admin/manage-fees" className="block px-4 py-3 rounded hover:bg-blue-800 transition">💰 Manage Fees</Link>
              <Link to="/admin/create-exam" className="block px-4 py-3 rounded hover:bg-blue-800 transition">📝 Create Exam</Link>
              <Link to="/admin/upload-result" className="block px-4 py-3 rounded hover:bg-blue-800 transition">📤 Upload Result</Link>
              <Link to="/admin/add-event" className="block px-4 py-3 rounded hover:bg-blue-800 transition">📢 Add Notice</Link>
            </>
          )}

          {/* Student Links (Example) */}
          {isStudent && (
             <Link to="/student/fees" className="block px-4 py-3 rounded hover:bg-blue-800 transition">💳 My Fees</Link>
          )}

        </nav>

        {/* LOGOUT BUTTON */}
        <div className="p-4 border-t border-blue-800">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold transition"
          >
            🚪 Logout
          </button>
        </div>
      </div>
      {/* --- SIDEBAR END --- */}

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 ml-64 p-8 overflow-auto h-screen">
        {/* Yahan par baki pages dikhenge */}
        <Outlet />
      </div>
    </div>
  );
};

export default Sidebar;
