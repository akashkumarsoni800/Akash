import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import { 
  X, LayoutDashboard, FileText, CreditCard, Calendar, 
  UserPlus, Users, ClipboardList, ShieldCheck 
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); 
  const [profile, setProfile] = useState({ name: 'User', avatar: '', role: '' });

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
      } catch (err) { console.error("Profile fetch error:", err); }

      setProfile({ name: fullName || 'User', avatar: avatar, role: detectedRole });
    };

    fetchProfile();
    setIsOpen(false); 
  }, [location.pathname]);

  const navLinkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200
    ${location.pathname === path ? 'bg-blue-900 text-white shadow-lg translate-x-2' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-900'}
  `;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* 🟢 1. Dashboard Header (Profile control is here) */}
      <DashboardHeader 
        full_name={profile.name} 
        userRole={profile.role} 
        avatarUrl={profile.avatar}
        onMenuClick={() => setIsOpen(true)} // Opens Sidebar
      />

      {/* 🟢 2. Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
      )}

      {/* 🟢 3. Sliding Sidebar Drawer (Navigation control is here) */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar School Info */}
        <div className="h-40 bg-blue-900 flex flex-col items-center justify-center text-white relative p-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-2 shadow-xl">
             <span className="text-blue-900 font-black text-2xl">ASM</span>
          </div>
          <h2 className="font-black text-xs tracking-widest uppercase text-center opacity-90">
            Adarsh Shishu Mandir
          </h2>
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition"><X size={20}/></button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-160px)] scrollbar-hide">
          <div className="text-[10px] font-black text-gray-300 uppercase px-4 mb-2 tracking-widest">Main Menu</div>
          
          <Link to={isAdmin ? "/admin/dashboard" : (isTeacher ? "/teacher/dashboard" : "/student/dashboard")} 
            className={navLinkClass(isAdmin ? "/admin/dashboard" : (isTeacher ? "/teacher/dashboard" : "/student/dashboard"))}
          >
             <LayoutDashboard size={18} /> Dashboard
          </Link>

          {isAdmin && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">Management</div>
              <Link to="/admin/manage-fees" className={navLinkClass("/admin/manage-fees")}><CreditCard size={18}/> Fees Management</Link>
              <Link to="/admin/upload-result" className={navLinkClass("/admin/upload-result")}><ClipboardList size={18}/> Result Center</Link>
              <Link to="/admin/add-event" className={navLinkClass("/admin/add-event")}><Calendar size={18}/> School Events</Link>
              <Link to="/admin/add-student" className={navLinkClass("/admin/add-student")}><UserPlus size={18}/> New Student</Link>
              <Link to="/admin/add-teacher" className={navLinkClass("/admin/add-teacher")}><Users size={18}/> Add Staff</Link>
            </>
          )}

          {isStudent && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">Student Portal</div>
              <Link to="/student/fees" className={navLinkClass("/student/fees")}><CreditCard size={18}/> My Fees</Link>
              <Link to="/student/result" className={navLinkClass("/student/result")}><FileText size={18}/> My Results</Link>
              <Link to="/student/notices" className={navLinkClass("/student/notices")}><Calendar size={18}/> Notice Board</Link>
            </>
          )}

          {isTeacher && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">Teacher Tools</div>
              <Link to="/teacher/attendance" className={navLinkClass("/teacher/attendance")}><Calendar size={18}/> Attendance</Link>
              <Link to="/teacher/upload-result" className={navLinkClass("/teacher/upload-result")}><FileText size={18}/> Marks Entry</Link>
            </>
          )}
        </nav>
      </div>

      {/* 🟢 4. Content Area */}
      <main className="flex-1 pt-20 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
