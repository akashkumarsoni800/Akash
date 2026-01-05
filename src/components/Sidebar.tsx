import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); 
  const [profile, setProfile] = useState<{name: string, avatar?: string}>({ name: 'Loading...' });

  const isAdmin = location.pathname.includes('/admin');
  const isTeacher = location.pathname.includes('/teacher');
  const isStudent = location.pathname.includes('/student');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let fullName = user.email?.split('@')[0]; 
      let avatar = '';

      if (isStudent) {
        const { data } = await supabase.from('students').select('full_name, avatar_url').eq('email', user.email).maybeSingle();
        if (data) { fullName = data.full_name; avatar = data.avatar_url; }
      } else if (isTeacher) {
        const { data } = await supabase.from('teachers').select('full_name, avatar_url').eq('email', user.email).maybeSingle();
        if (data) { fullName = data.full_name; avatar = data.avatar_url; }
      } else if (isAdmin) {
          fullName = "Admin User"; // Admin ke liye default name
      }

      setProfile({ name: fullName || 'User', avatar: avatar });
    };
    fetchProfile();
  }, [isStudent, isTeacher, isAdmin]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* 1. Header with Hamburger Connect */}
      <DashboardHeader 
        full_name={profile.name} 
        userRole={isAdmin ? "Admin" : (isTeacher ? "Teacher" : "Student")} 
        avatarUrl={profile.avatar}
        onMenuClick={() => setIsOpen(true)} 
      />

      {/* 2. Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={() => setIsOpen(false)}></div>
      )}

      {/* 3. Sliding Sidebar Drawer */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="h-44 bg-blue-900 flex flex-col items-center justify-center text-white relative">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-4xl mb-2 border-2 border-white/30 shadow-inner">
            {isStudent ? '🎓' : (isTeacher ? '👨‍🏫' : '🔑')}
          </div>
          <p className="font-black tracking-widest uppercase text-sm">ASM Portal</p>
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white text-2xl">✕</button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-250px)] font-bold text-gray-600">
          
          {/* --- COMMON DASHBOARD --- */}
          <Link to={isAdmin ? "/admin/dashboard" : (isTeacher ? "/teacher/dashboard" : "/student/dashboard")} 
            onClick={() => setIsOpen(false)} 
            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-all"
          >
             🏠 Dashboard
          </Link>

          {/* --- 🛠️ ADMIN ONLY BUTTONS (RE-ADDED) --- */}
          {isAdmin && (
            <>
              <div className="text-[10px] text-gray-400 uppercase px-4 mt-4 mb-1">Management</div>
              <Link to="/admin/manage-fees" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-all">💰 Manage Fees</Link>
              <Link to="/admin/create-exam" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-all">📝 Create Exam</Link>
              <Link to="/admin/upload-result" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-all">📤 Upload Result</Link>
              <Link to="/admin/add-event" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-all">📢 Add Notices</Link>
              
              <div className="text-[10px] text-gray-400 uppercase px-4 mt-4 mb-1">People</div>
              <Link to="/admin/add-student" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-all">🎓 Add Student</Link>
              <Link to="/admin/add-teacher" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-all">👨‍🏫 Add Teacher</Link>
            </>
          )}

          {/* --- 🎓 STUDENT ONLY LINKS --- */}
          {isStudent && (
            <>
              <Link to="/student/fees" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">💸 My Fees</Link>
              <Link to="/student/result" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📊 My Result</Link>
            </>
          )}

          {/* --- 👨‍🏫 TEACHER ONLY LINKS --- */}
          {isTeacher && (
            <>
              <Link to="/teacher/attendance" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl font-bold">📅 Daily Attendance</Link>
              <Link to="/teacher/upload-result" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl font-bold">📤 Post Marks</Link>
            </>
          )}

          <div className="border-t my-4 opacity-30"></div>
          <Link to="/profile-setup" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl">👤 Profile Settings</Link>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t bg-gray-50">
           <button onClick={async () => { await supabase.auth.signOut(); navigate('/'); }} className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2">🚪 Logout</button>
        </div>
      </div>

      {/* 4. Main Content Area */}
      <main className="flex-1 pt-16 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
