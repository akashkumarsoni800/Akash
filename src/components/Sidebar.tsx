import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import { X, LayoutDashboard, FileText, CreditCard, Calendar, UserPlus, Users, ClipboardList, ShieldCheck } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🟢 STATE FOR SIDEBAR DRAWER (Left Menu)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  // Role Logic
  const isAdminPath = location.pathname.startsWith('/admin');
  const isTeacherPath = location.pathname.startsWith('/teacher');
  const isStudentPath = location.pathname.startsWith('/student');

  // Default Role Logic (URL Based)
  const defaultRole = isAdminPath ? 'Administrator' : (isTeacherPath ? 'Teacher' : 'Student');
  
  const [profile, setProfile] = useState({ 
    name: 'Loading...', 
    avatar: '', 
    role: defaultRole 
  });

  // Profile Fetching Logic
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let fullName = user.user_metadata?.full_name || user.email?.split('@')[0];
      let avatar = user.user_metadata?.avatar_url || '';
      let detectedRole = defaultRole; // Fallback to URL role

      try {
        if (isAdminPath || isTeacherPath) {
          const { data } = await supabase.from('teachers').select('full_name, avatar_url, role').eq('id', user.id).maybeSingle();
          if (data) {
             fullName = data.full_name; avatar = data.avatar_url;
             detectedRole = data.role === 'admin' ? 'Administrator' : 'Teacher';
          }
        } else if (isStudentPath) {
          const { data } = await supabase.from('students').select('full_name, avatar_url').eq('id', user.id).maybeSingle();
          if (data) { fullName = data.full_name; avatar = data.avatar_url; detectedRole = 'Student'; }
        }
      } catch (err) { console.error(err); }

      setProfile({ name: fullName, avatar, role: detectedRole });
    };

    fetchProfile();
    // URL change hone par Sidebar band kar do
    setIsSidebarOpen(false); 
  }, [location.pathname]);

  const navLinkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 mb-1
    ${location.pathname === path 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1' 
      : 'text-gray-500 hover:bg-blue-50 hover:text-blue-800'}
  `;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* 🟢 1. HEADER (Pass Handler) */}
      <DashboardHeader 
        full_name={profile.name} 
        userRole={profile.role} 
        avatarUrl={profile.avatar}
        // 👇 Jab Hamburger click hoga, ye 'true' karega
        onMenuClick={() => setIsSidebarOpen(true)} 
      />

      {/* 🟢 2. SIDEBAR DRAWER (Sliding Panel) */}
      {/* Overlay (Black Background) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Drawer Itself */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Header */}
        <div className="h-40 bg-blue-900 flex flex-col items-center justify-center text-white relative p-6 rounded-br-[3rem]">
          <div className="absolute top-4 right-4 cursor-pointer p-1 bg-blue-800 rounded-full hover:bg-blue-700 transition" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </div>
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-900 font-black text-xl mb-2 shadow-lg">
            ASM
          </div>
          <h2 className="font-black text-sm tracking-widest uppercase text-center leading-tight opacity-90">
            Adarsh Shishu Mandir
          </h2>
        </div>

        {/* Navigation Links */}
        <nav className="p-5 space-y-1 overflow-y-auto h-[calc(100vh-160px)] scrollbar-hide">
          <div className="text-[10px] font-black text-gray-300 uppercase px-4 mb-2 mt-2 tracking-widest">Main Menu</div>

          <Link to={isAdminPath ? "/admin/dashboard" : (isTeacherPath ? "/teacher/dashboard" : "/student/dashboard")} 
            className={navLinkClass(isAdminPath ? "/admin/dashboard" : (isTeacherPath ? "/teacher/dashboard" : "/student/dashboard"))}>
             <LayoutDashboard size={18} /> Dashboard
          </Link>

          {/* ADMIN TOOLS */}
          {isAdminPath && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">Admin Tools</div>
              <Link to="/admin/manage-fees" className={navLinkClass("/admin/manage-fees")}><CreditCard size={18}/> Manage Fees</Link>
              <Link to="/admin/upload-result" className={navLinkClass("/admin/upload-result")}><ClipboardList size={18}/> Result Center</Link>
              <Link to="/admin/add-event" className={navLinkClass("/admin/add-event")}><Calendar size={18}/> Events</Link>
              <Link to="/admin/add-student" className={navLinkClass("/admin/add-student")}><UserPlus size={18}/> Add Student</Link>
              <Link to="/admin/add-teacher" className={navLinkClass("/admin/add-teacher")}><Users size={18}/> Add Staff</Link>
              
              {/* ✅ NEW ADMIN FUNCTION ADDED HERE */}
              <Link to="/admin/create-admin" className={navLinkClass("/admin/create-admin")}><ShieldCheck size={18}/> New Admin</Link>
            </>
          )}

          {/* STUDENT TOOLS */}
          {isStudentPath && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">Academics</div>
              <Link to="/student/fees" className={navLinkClass("/student/fees")}><CreditCard size={18}/> My Fees</Link>
              <Link to="/student/result" className={navLinkClass("/student/result")}><FileText size={18}/> My Results</Link>
              <Link to="/student/notices" className={navLinkClass("/student/notices")}><Calendar size={18}/> Notice Board</Link>
            </>
          )}

           {/* TEACHER TOOLS */}
           {isTeacherPath && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">Classroom</div>
              <Link to="/teacher/attendance" className={navLinkClass("/teacher/attendance")}><Calendar size={18}/> Attendance</Link>
              <Link to="/teacher/upload-result" className={navLinkClass("/teacher/upload-result")}><FileText size={18}/> Marks Entry</Link>
            </>
          )}

        </nav>
      </div>

      {/* 🟢 3. CONTENT AREA */}
      <main className="flex-1 pt-20 p-4 md:p-8 overflow-x-hidden w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
