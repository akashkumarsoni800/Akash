import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import { toast } from 'sonner';
import { 
  X, LayoutDashboard, FileText, CreditCard, Calendar, 
  UserPlus, Users, ClipboardList, ShieldCheck 
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); 
  const [loading, setLoading] = useState(true); // Loading state loop rokne ke liye
  const [profile, setProfile] = useState({ name: 'User', avatar: '', role: '' });

  // ✅ 1. Check User Role Only Once (No Loops)
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Agar user nahi hai to hi login par bhejo
          if (isMounted) navigate('/');
          return;
        }

        let fullName = user.email?.split('@')[0]; 
        let avatar = '';
        let detectedRole = 'student'; // Default

        // Teachers/Admin Table Check
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('full_name, avatar_url, role')
          .eq('email', user.email)
          .maybeSingle();

        if (teacherData) { 
          fullName = teacherData.full_name; 
          avatar = teacherData.avatar_url;
          detectedRole = teacherData.role === 'admin' ? 'admin' : 'teacher';
        } else {
          // Students Table Check
          const { data: studentData } = await supabase
            .from('students')
            .select('full_name, avatar_url')
            .eq('email', user.email)
            .maybeSingle();
            
          if (studentData) { 
            fullName = studentData.full_name; 
            avatar = studentData.avatar_url; 
            detectedRole = 'student';
          }
        }

        if (isMounted) {
          setProfile({ name: fullName || 'User', avatar: avatar, role: detectedRole });
          setLoading(false);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, []); // ⚠️ Empty dependency: Yeh loop ko 100% rok dega

  // ✅ Active link highlight logic
  const navLinkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200
    ${location.pathname === path 
      ? 'bg-blue-900 text-white shadow-lg translate-x-2' 
      : 'text-gray-500 hover:bg-blue-50 hover:text-blue-900'}
  `;

  if (loading) return (
    <div className="h-screen flex items-center justify-center font-bold text-blue-900 animate-pulse">
      ASM Loading...
    </div>
  );

  const roleName = profile.role === 'admin' ? 'Administrator' : profile.role === 'teacher' ? 'Teacher' : 'Student';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* 🟢 1. Dashboard Header */}
      <DashboardHeader 
        full_name={profile.name} 
        userRole={roleName} 
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

        {/* Sidebar Header */}
        <div className="h-48 bg-blue-900 flex flex-col items-center justify-center text-white relative p-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-xl">
             <span className="text-blue-900 font-black text-2xl">ASM</span>
          </div>
          <h2 className="font-black text-sm tracking-tighter uppercase text-center leading-tight">
            Adarsh Shishu Mandir
          </h2>
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition">✕</button>
        </div>

        {/* Navigation Links (Role Based) */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-192px)] scrollbar-hide">

          {/* --- ADMIN LINKS --- */}
          {profile.role === 'admin' && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mb-2 tracking-widest">Admin Dashboard</div>
              <Link to="/admin/dashboard" className={navLinkClass("/admin/dashboard")} onClick={() => setIsOpen(false)}><LayoutDashboard size={18}/> Overview</Link>
              <Link to="/admin/manage-fees" className={navLinkClass("/admin/manage-fees")} onClick={() => setIsOpen(false)}><CreditCard size={18}/> Fees Management</Link>
              <Link to="/admin/upload-result" className={navLinkClass("/admin/upload-result")} onClick={() => setIsOpen(false)}><ClipboardList size={18}/> Result Center</Link>
              <Link to="/admin/add-event" className={navLinkClass("/admin/add-event")} onClick={() => setIsOpen(false)}><Calendar size={18}/> School Events</Link>
              <Link to="/admin/add-student" className={navLinkClass("/admin/add-student")} onClick={() => setIsOpen(false)}><UserPlus size={18}/> New Student</Link>
              <Link to="/admin/add-teacher" className={navLinkClass("/admin/add-teacher")} onClick={() => setIsOpen(false)}><Users size={18}/> Add Staff</Link>
              <Link to="/admin/create-admin" className={navLinkClass("/admin/create-admin")} onClick={() => setIsOpen(false)}><ShieldCheck size={18}/> New Admin</Link>
            </>
          )}

          {/* --- STUDENT LINKS --- */}
          {profile.role === 'student' && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mb-2 tracking-widest">Student Portal</div>
              <Link to="/student/dashboard" className={navLinkClass("/student/dashboard")} onClick={() => setIsOpen(false)}><LayoutDashboard size={18}/> Dashboard</Link>
              <Link to="/student/fees" className={navLinkClass("/student/fees")} onClick={() => setIsOpen(false)}><CreditCard size={18}/> My Fees</Link>
              <Link to="/student/result" className={navLinkClass("/student/result")} onClick={() => setIsOpen(false)}><FileText size={18}/> My Results</Link>
              <Link to="/student/notices" className={navLinkClass("/student/notices")} onClick={() => setIsOpen(false)}><Calendar size={18}/> Notice Board</Link>
            </>
          )}

          {/* --- TEACHER LINKS --- */}
          {profile.role === 'teacher' && (
            <>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mb-2 tracking-widest">Teacher Tools</div>
              <Link to="/teacher/dashboard" className={navLinkClass("/teacher/dashboard")} onClick={() => setIsOpen(false)}><LayoutDashboard size={18}/> Dashboard</Link>
              <Link to="/teacher/attendance" className={navLinkClass("/teacher/attendance")} onClick={() => setIsOpen(false)}><Calendar size={18}/> Attendance</Link>
              <Link to="/teacher/upload-result" className={navLinkClass("/teacher/upload-result")} onClick={() => setIsOpen(false)}><FileText size={18}/> Marks Entry</Link>
            </>
          )}

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
