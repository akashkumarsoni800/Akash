import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // Sidebar State
  const [profile, setProfile] = useState<{name: string, avatar?: string}>({ name: 'Loading...' });

  const isAdmin = location.pathname.includes('/admin');
  const isTeacher = location.pathname.includes('/teacher');
  const isStudent = location.pathname.includes('/student');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let fullName = user.email?.split('@')[0]; // Fallback name
      let avatar = '';

      // Role के हिसाब से सही टेबल से नाम उठाएं
      if (isStudent) {
        const { data } = await supabase.from('students').select('full_name, avatar_url').eq('email', user.email).maybeSingle();
        if (data) { fullName = data.full_name; avatar = data.avatar_url; }
      } else if (isTeacher) {
        const { data } = await supabase.from('teachers').select('full_name, avatar_url').eq('email', user.email).maybeSingle();
        if (data) { fullName = data.full_name; avatar = data.avatar_url; }
      }

      setProfile({ name: fullName || 'User', avatar: avatar });
    };

    fetchProfile();
  }, [isStudent, isTeacher]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* ✅ 1. Header: यहाँ full_name और onMenuClick एकदम सही तरीके से पास किया है */}
      <DashboardHeader 
        full_name={profile.name} 
        userRole={isAdmin ? "Admin" : (isTeacher ? "Teacher" : "Student")} 
        avatarUrl={profile.avatar}
        onMenuClick={() => setIsOpen(true)} // यह बटन दबाने पर Sidebar खोलेगा
      />

      {/* ✅ 2. Sidebar Overlay (काली लेयर) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* ✅ 3. Sliding Sidebar Drawer */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Header */}
        <div className="h-44 bg-blue-900 flex flex-col items-center justify-center text-white relative">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-4xl mb-2 border-2 border-white/30 shadow-inner">
            {isStudent ? '🎓' : (isTeacher ? '👨‍🏫' : '🔑')}
          </div>
          <p className="font-black tracking-widest uppercase text-sm">ASM Portal</p>
          {/* Close Button */}
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white text-2xl hover:scale-125 transition">✕</button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-250px)] font-bold text-gray-600">
          
          <Link to={isAdmin ? "/admin/dashboard" : (isTeacher ? "/teacher/dashboard" : "/student/dashboard")} 
            onClick={() => setIsOpen(false)} 
            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-all"
          >
             🏠 Dashboard
          </Link>

          {/* Role Based Links */}
          {isAdmin && (
            <>
              <Link to="/admin/manage-fees" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl transition-all">💰 Manage Fees</Link>
              <Link to="/admin/add-student" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl transition-all">🎓 Add Student</Link>
            </>
          )}

          {isStudent && (
            <>
              <Link to="/student/fees" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl transition-all">💸 My Fees</Link>
              <Link to="/student/result" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl transition-all">📊 Results</Link>
            </>
          )}

          {isTeacher && (
            <Link to="/teacher/attendance" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl transition-all">📅 Attendance</Link>
          )}

          <div className="border-t my-4 opacity-30"></div>
          <Link to="/profile-setup" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">👤 Profile Settings</Link>
        </nav>

        {/* Bottom Area */}
        <div className="absolute bottom-0 w-full p-4 border-t bg-gray-50">
           <p className="text-[10px] text-center text-gray-400 font-bold uppercase mb-2">Adarsh Shishu Mandir v1.0</p>
        </div>
      </div>

      {/* ✅ 4. Main Content Area: यहाँ सारे पेज दिखेंगे */}
      <main className="flex-1 pt-16 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
