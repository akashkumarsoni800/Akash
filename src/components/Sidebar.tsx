import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import { X, LayoutDashboard, FileText, CreditCard, Calendar, UserPlus, Users, ClipboardList } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // ✅ Default State based on URL (Instant Fix)
  // Agar URL me 'admin' hai to pehle se hi 'Administrator' manlo
  const isAdminPath = location.pathname.startsWith('/admin');
  const isTeacherPath = location.pathname.startsWith('/teacher');
  const isStudentPath = location.pathname.startsWith('/student');

  const [profile, setProfile] = useState({ 
    name: 'Loading...', 
    avatar: '', 
    role: isAdminPath ? 'Administrator' : (isTeacherPath ? 'Teacher' : 'Student') 
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let fullName = user.user_metadata?.full_name || user.email?.split('@')[0];
      let avatar = user.user_metadata?.avatar_url || '';
      let finalRole = profile.role; // Keep URL based role as fallback

      try {
        // 1. Agar Admin/Teacher Route par h, to Teachers table check karo
        if (isAdminPath || isTeacherPath) {
          const { data } = await supabase
            .from('teachers')
            .select('full_name, avatar_url, role')
            .eq('id', user.id) // ID se check karna best h
            .maybeSingle();

          if (data) {
            fullName = data.full_name;
            avatar = data.avatar_url;
            // Database role ko priority do
            finalRole = data.role === 'admin' ? 'Administrator' : 'Teacher';
          }
        } 
        // 2. Agar Student Route par h
        else if (isStudentPath) {
          const { data } = await supabase
            .from('students')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          if (data) {
            fullName = data.full_name;
            avatar = data.avatar_url;
            finalRole = 'Student';
          }
        }
      } catch (err) {
        console.error("Profile Fetch Error:", err);
      }

      setProfile({ name: fullName, avatar, role: finalRole });
    };

    fetchProfile();
    setIsOpen(false);
  }, [location.pathname]); // URL change hone par dubara chalega

  // CSS for Links
  const navLinkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 mb-1
    ${location.pathname === path 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1' 
      : 'text-gray-500 hover:bg-blue-50 hover:text-blue-800'}
  `;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* 🟢 1. HEADER (Pass correct role) */}
      <DashboardHeader 
        full_name={profile.name} 
        userRole={profile.role} // ✅ Ab ye sahi role dikhayega
        avatarUrl={profile.avatar}
        onMenuClick={() => setIsOpen(true)} 
      />

      {/* 🟢 2. SIDEBAR OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* 🟢 3. SIDEBAR DRAWER */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header */}
        <div className="h-40 bg-blue-900 flex flex-col items-center justify-center text-white relative p-6 rounded-br-[3rem]">
          <div className="absolute top-4 right-4 cursor-pointer p-1 bg-blue-800 rounded-full hover:bg-blue-700" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </div>
          <h2 className="font-black text-xl tracking-tighter uppercase text-center leading-tight mt-2">
            ASM <span className="text-blue-400">SYSTEM</span>
          </h2>
          <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1 opacity-70">School Management</p>
        </div>

        {/* Links */}
        <nav className="p-5 space-y-1 overflow-y-auto h-[calc(100vh-160px)]">

          <div className="text-[10px] font-black text-gray-300 uppercase px-4 mb-2 mt-2 tracking-widest">Main Menu</div>

          {/* HOME LINK */}
          <Link 
            to={isAdminPath ? "/admin/dashboard" : (isTeacherPath ? "/teacher/dashboard" : "/student/dashboard")} 
            className={navLinkClass(isAdminPath ? "/admin/dashboard" : (isTeacherPath ? "/teacher/dashboard" : "/student/dashboard"))}
            onClick={() => setIsOpen(false)}
          >
             <LayoutDashboard size={18} /> Dashboard
          </Link>

          {/* ADMIN LINKS */}
          {isAdminPath && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">Admin Tools</div>
              <Link to="/admin/manage-fees" className={navLinkClass("/admin/manage-fees")} onClick={() => setIsOpen(false)}><CreditCard size={18}/> Manage Fees</Link>
              <Link to="/admin/upload-result" className={navLinkClass("/admin/upload-result")} onClick={() => setIsOpen(false)}><ClipboardList size={18}/> Result Center</Link>
              <Link to="/admin/add-event" className={navLinkClass("/admin/add-event")} onClick={() => setIsOpen(false)}><Calendar size={18}/> Events</Link>
              <Link to="/admin/add-student" className={navLinkClass("/admin/add-student")} onClick={() => setIsOpen(false)}><UserPlus size={18}/> Add Student</Link>
              <Link to="/admin/add-teacher" className={navLinkClass("/admin/add-teacher")} onClick={() => setIsOpen(false)}><Users size={18}/> Add Staff</Link>
            </>
          )}

          {/* STUDENT LINKS */}
          {isStudentPath && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">My Academics</div>
              <Link to="/student/fees" className={navLinkClass("/student/fees")} onClick={() => setIsOpen(false)}><CreditCard size={18}/> My Fees</Link>
              <Link to="/student/result" className={navLinkClass("/student/result")} onClick={() => setIsOpen(false)}><FileText size={18}/> My Results</Link>
              <Link to="/student/notices" className={navLinkClass("/student/notices")} onClick={() => setIsOpen(false)}><Calendar size={18}/> Notice Board</Link>
            </>
          )}

          {/* TEACHER LINKS */}
          {isTeacherPath && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">Classroom</div>
              <Link to="/teacher/attendance" className={navLinkClass("/teacher/attendance")} onClick={() => setIsOpen(false)}><Calendar size={18}/> Attendance</Link>
              <Link to="/teacher/upload-result" className={navLinkClass("/teacher/upload-result")} onClick={() => setIsOpen(false)}><FileText size={18}/> Marks Entry</Link>
            </>
          )}

        </nav>
      </div>

      {/* 🟢 4. MAIN CONTENT */}
      <main className="flex-1 pt-20 p-4 md:p-8 overflow-x-hidden w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
