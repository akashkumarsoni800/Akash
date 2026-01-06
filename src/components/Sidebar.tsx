import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); 
  const [profile, setProfile] = useState({ name: 'User', avatar: '' });

  // ✅ पाथ डिटेक्शन लॉजिक को और सटीक बनाया
  const isAdmin = location.pathname.startsWith('/admin');
  const isTeacher = location.pathname.startsWith('/teacher');
  const isStudent = location.pathname.startsWith('/student');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let name = user.email?.split('@')[0] || 'User';
      let avatar = '';

      // रोल के हिसाब से सही डेटाबेस से नाम उठाएं
      if (isStudent) {
        const { data } = await supabase.from('students').select('full_name, avatar_url').eq('email', user.email).maybeSingle();
        if (data) { name = data.full_name; avatar = data.avatar_url; }
      } else if (isTeacher) {
        const { data } = await supabase.from('teachers').select('full_name, avatar_url').eq('email', user.email).maybeSingle();
        if (data) { name = data.full_name; avatar = data.avatar_url; }
      }

      setProfile({ name, avatar });
    };
    fetchUser();
    setIsOpen(false); // ✅ पेज बदलने पर साइडबार खुद बंद हो जाए
  }, [location.pathname]); // पाथ बदलते ही दोबारा चेक करें

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* 1. DashboardHeader - यह यूनिवर्सल है */}
      <DashboardHeader 
        full_name={profile.name} 
        userRole={isAdmin ? "Admin" : (isTeacher ? "Teacher" : "Student")} 
        avatarUrl={profile.avatar}
        onMenuClick={() => setIsOpen(true)} 
      />

      {/* 2. Sidebar Overlay - z-index को 40 रखा है */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={() => setIsOpen(false)}
      ></div>

      {/* 3. Sliding Sidebar - z-index 50 ताकि सबसे ऊपर रहे */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="h-44 bg-blue-900 flex flex-col items-center justify-center text-white relative">
          <span className="text-5xl mb-2">{isStudent ? '🎓' : (isTeacher ? '👨‍🏫' : '🔑')}</span>
          <p className="font-bold tracking-widest uppercase text-xs">ASM Portal</p>
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-2xl font-bold hover:text-red-400">✕</button>
        </div>

        <nav className="p-4 space-y-1 font-bold text-gray-600 overflow-y-auto h-[calc(100vh-176px)]">
          <Link to={isAdmin ? "/admin/dashboard" : (isTeacher ? "/teacher/dashboard" : "/student/dashboard")} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">🏠 Dashboard</Link>

          {isAdmin && (
            <>
              <Link to="/admin/manage-fees" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">💰 Manage Fees</Link>
              <Link to="/admin/create-exam" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📝 Create Exam</Link>
              <Link to="/admin/upload-result" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📤 Upload Result</Link>
              <Link to="/admin/add-student" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">🎓 Add Student</Link>
            </>
          )}

          {isStudent && (
            <>
              <Link to="/student/fees" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">💸 My Fees</Link>
              <Link to="/student/result" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📊 My Result</Link>
              <Link to="/student/notices" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📢 Notices</Link>
            </>
          )}

          {isTeacher && (
            <>
              <Link to="/teacher/attendance" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📅 Attendance</Link>
              <Link to="/teacher/upload-result" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📤 Post Marks</Link>
            </>
          )}

          <hr className="my-4 border-gray-100" />
          <Link to="/profile-setup" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-blue-900 rounded-xl">👤 Profile Settings</Link>
        </nav>
      </div>

      {/* 4. Page Content Area */}
      <main className="flex-1 pt-16 p-4 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
