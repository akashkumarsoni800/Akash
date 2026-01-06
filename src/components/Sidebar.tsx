import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import { toast } from 'sonner';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); 
  const [profile, setProfile] = useState({ name: 'User', avatar: '', role: '' });

  // ✅ Path matching logic for correct redirection
  const isAdmin = location.pathname.startsWith('/admin');
  const isTeacher = location.pathname.startsWith('/teacher');
  const isStudent = location.pathname.startsWith('/student');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let fullName = user.email?.split('@')[0]; 
      let avatar = '';
      let detectedRole = isAdmin ? 'Admin' : (isTeacher ? 'Teacher' : 'Student');

      try {
        if (isStudent) {
          const { data } = await supabase.from('students').select('full_name, avatar_url').eq('email', user.email).maybeSingle();
          if (data) { fullName = data.full_name; avatar = data.avatar_url; }
        } else {
          const { data } = await supabase.from('teachers').select('full_name, avatar_url, role').eq('email', user.email).maybeSingle();
          if (data) { 
            fullName = data.full_name; 
            avatar = data.avatar_url;
            if (data.role === 'admin') detectedRole = 'Admin';
          }
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }

      setProfile({ name: fullName || 'User', avatar: avatar, role: detectedRole });
    };

    fetchProfile();
    setIsOpen(false); 
  }, [location.pathname]);

  const navLinkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200
    ${location.pathname === path 
      ? 'bg-blue-900 text-white shadow-lg translate-x-2' 
      : 'text-gray-500 hover:bg-blue-50 hover:text-blue-900'}
  `;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* 🟢 1. Dashboard Header */}
      <DashboardHeader 
        full_name={profile.name} 
        userRole={profile.role} 
        avatarUrl={profile.avatar}
        onMenuClick={() => setIsOpen(true)} 
      />

      {/* 🟢 2. Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* 🟢 3. Sliding Sidebar Drawer */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Header with School Logo */}
        <div className="h-48 bg-blue-900 flex flex-col items-center justify-center text-white relative p-6">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center overflow-hidden mb-3 shadow-2xl border-2 border-blue-400/30">
             {/* 🏫 School Logo Placeholder - Replace /logo.png with your actual path */}
             <img 
               src="/logo.png" 
               alt="School Logo" 
               className="w-full h-full object-cover"
               onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2602/2602414.png" }}
             />
          </div>
          <h2 className="font-black text-sm tracking-tighter uppercase text-center leading-tight">
            Adarsh Shishu Mandir
          </h2>
          <p className="text-[9px] font-bold text-blue-300 uppercase tracking-[0.2em] mt-1">Education Excellence</p>
          
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl transition">✕</button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-192px)] scrollbar-hide">
          
          <div className="text-[10px] font-black text-gray-300 uppercase px-4 mb-2 tracking-widest">Main Menu</div>
          
          <Link to={isAdmin ? "/admin/dashboard" : (isTeacher ? "/teacher/dashboard" : "/student/dashboard")} 
            className={navLinkClass(isAdmin ? "/admin/dashboard" : (isTeacher ? "/teacher/dashboard" : "/student/dashboard"))}
          >
             <span>🏠</span> Dashboard
          </Link>

          {/* ADMIN FEATURES */}
          {isAdmin && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">Management</div>
              <Link to="/admin/manage-fees" className={navLinkClass("/admin/manage-fees")}><span>💰</span> Fees Management</Link>
              <Link to="/admin/upload-result" className={navLinkClass("/admin/upload-result")}><span>📤</span> Result Center</Link>
              <Link to="/admin/add-event" className={navLinkClass("/admin/add-event")}><span>📢</span> School Events</Link>
              <Link to="/admin/add-student" className={navLinkClass("/admin/add-student")}><span>🎓</span> New Student</Link>
              <Link to="/admin/add-teacher" className={navLinkClass("/admin/add-teacher")}><span>👨‍🏫</span> Add Staff</Link>
            </>
          )}

          {/* STUDENT FEATURES */}
          {isStudent && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">Student Portal</div>
              <Link to="/student/fees" className={navLinkClass("/student/fees")}><span>💸</span> My Fees</Link>
              <Link to="/student/result" className={navLinkClass("/student/result")}><span>📊</span> My Results</Link>
              <Link to="/student/notices" className={navLinkClass("/student/notices")}><span>📢</span> Notice Board</Link>
            </>
          )}

          {/* TEACHER FEATURES */}
          {isTeacher && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">Teacher Tools</div>
              <Link to="/teacher/attendance" className={navLinkClass("/teacher/attendance")}><span>📅</span> Attendance</Link>
              <Link to="/teacher/upload-result" className={navLinkClass("/teacher/upload-result")}><span>📝</span> Marks Entry</Link>
            </>
          )}

          <div className="border-t border-gray-100 my-6"></div>
          <Link to="/profile-setup" className={navLinkClass("/profile-setup")}><span>👤</span> My Profile</Link>
          
          <button 
             onClick={async () => { await supabase.auth.signOut(); navigate('/'); }} 
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all mt-4"
          >
             <span>🚪</span> Logout Session
          </button>
        </nav>
      </div>

      {/* 🟢 4. Content Area */}
      <main className="flex-1 pt-16 p-4 md:p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
