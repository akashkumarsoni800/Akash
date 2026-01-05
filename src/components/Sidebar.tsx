import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // पहचानें कि यूजर Admin है, Teacher है या Student
  const isAdmin = location.pathname.includes('/admin');
  const isTeacher = location.pathname.includes('/teacher');
  const isStudent = location.pathname.includes('/student');

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // नाम निकालने के लिए ईमेल का इस्तेमाल करें या जो भी आपके पास उपलब्ध हो
        setUserProfile({ name: user.email?.split('@')[0], email: user.email });
      }
    };
    getProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 1. Header with Menu Button */}
      <DashboardHeader 
        userName={userProfile?.name || "User"} 
        userRole={isAdmin ? "Admin" : (isTeacher ? "Teacher" : "Student")}
        onMenuClick={() => setIsOpen(true)} 
      />

      {/* 2. Sidebar Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={() => setIsOpen(false)}></div>
      )}

      {/* 3. Sliding Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Header */}
        <div className="h-44 bg-blue-900 flex flex-col items-center justify-center text-white relative">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-4xl mb-2 border-2 border-white/30">
            {isStudent ? '🎓' : (isTeacher ? '👨‍🏫' : '🔑')}
          </div>
          <p className="font-bold tracking-wide uppercase text-sm">ASM Portal</p>
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white text-xl">✕</button>
        </div>

        {/* Links Based on Role */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-250px)] font-medium">
          
          {/* COMMON HOME LINK */}
          <Link to={isAdmin ? "/admin/dashboard" : (isTeacher ? "/teacher/dashboard" : "/student/dashboard")} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition">
             🏠 Dashboard
          </Link>

          {/* ADMIN ONLY LINKS */}
          {isAdmin && (
            <>
              <Link to="/admin/manage-fees" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-xl">💰 Manage Fees</Link>
              <Link to="/admin/add-student" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-xl">🎓 Add Student</Link>
            </>
          )}

          {/* STUDENT ONLY LINKS */}
          {isStudent && (
            <>
              <Link to="/student/fees" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-xl">💸 My Fees</Link>
              <Link to="/student/result" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-xl">📊 My Results</Link>
              <Link to="/student/notices" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-xl">📢 School Notices</Link>
            </>
          )}

          <div className="border-t my-4 opacity-50"></div>
          <Link to="/profile-setup" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl">👤 Edit Profile</Link>
        </nav>

        {/* Logout at bottom */}
        <div className="absolute bottom-0 w-full p-4">
          <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* 4. Content Area */}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
