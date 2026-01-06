import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); 
  const [profile, setProfile] = useState({ name: 'User', role: '' });

  // पहचानें कि अभी कौन सा सेक्शन खुला है
  const isAdmin = location.pathname.startsWith('/admin');
  const isTeacher = location.pathname.startsWith('/teacher');
  const isStudent = location.pathname.startsWith('/student');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // अगर डेटाबेस में नाम न मिले तो ईमेल का इस्तेमाल करें
        setProfile(prev => ({ ...prev, name: user.email?.split('@')[0] || 'User' }));
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* 1. DashboardHeader - यह सबको दिखेगा */}
      <DashboardHeader 
        full_name={profile.name} 
        userRole={isAdmin ? "Admin" : (isTeacher ? "Teacher" : "Student")} 
        onMenuClick={() => setIsOpen(true)} 
      />

      {/* 2. Sidebar Drawer */}
      <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setIsOpen(false)}></div>

      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="h-44 bg-blue-900 flex flex-col items-center justify-center text-white relative">
          <span className="text-4xl mb-2">{isStudent ? '🎓' : (isTeacher ? '👨‍🏫' : '🔑')}</span>
          <p className="font-bold uppercase tracking-widest text-xs">ASM Portal</p>
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-2xl">✕</button>
        </div>

        <nav className="p-4 space-y-1 font-bold text-gray-600">
          {/* Dashboard Link - सबके लिए */}
          <Link to={isAdmin ? "/admin/dashboard" : (isTeacher ? "/teacher/dashboard" : "/student/dashboard")} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">🏠 Dashboard</Link>

          {/* Admin Links */}
          {isAdmin && (
            <>
              <Link to="/admin/manage-fees" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">💰 Manage Fees</Link>
              <Link to="/admin/create-exam" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📝 Create Exam</Link>
              <Link to="/admin/upload-result" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📤 Upload Result</Link>
              <Link to="/admin/add-event" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📢 Add Notices</Link>
              <Link to="/admin/add-student" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">🎓 Add Student</Link>
            </>
          )}

          {/* Student Links */}
          {isStudent && (
            <>
              <Link to="/student/fees" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">💸 My Fees</Link>
              <Link to="/student/result" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📊 My Result</Link>
            </>
          )}

          {/* Teacher Links */}
          {isTeacher && (
            <>
              <Link to="/teacher/attendance" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📅 Attendance</Link>
              <Link to="/teacher/upload-result" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📤 Post Marks</Link>
            </>
          )}
        </nav>
      </div>

      {/* 3. Page Content */}
      <main className="pt-16 p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
