import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import { 
  X, LayoutDashboard, FileText, CreditCard, Calendar, 
  UserPlus, Users, ClipboardList, ShieldCheck, LogIn 
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 1. Loading & Error States
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(false);

  // 2. Profile State (Default empty)
  const [profile, setProfile] = useState({ 
    name: '', 
    avatar: '', 
    role: '' // Role ab Database se aayega
  });

  useEffect(() => {
    let mounted = true;

    const checkUserRoleAndRedirect = async () => {
      try {
        setLoading(true);

        // A. Check Session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (mounted) { setSessionError(true); setLoading(false); }
          return;
        }

        const user = session.user;
        let userRole = 'student'; // Default assume student
        let fullName = user.user_metadata?.full_name || 'User';
        let avatar = user.user_metadata?.avatar_url || '';

        // B. Check Teachers Table (For Admin or Teacher)
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('full_name, avatar_url, role')
          .eq('id', user.id)
          .maybeSingle();

        if (teacherData) {
          // Agar Teacher table me mila
          userRole = teacherData.role === 'admin' ? 'admin' : 'teacher';
          fullName = teacherData.full_name;
          avatar = teacherData.avatar_url;
        } else {
          // Agar Teacher nahi hai, to Student check karo
          const { data: studentData } = await supabase
            .from('students')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle();
            
          if (studentData) {
            fullName = studentData.full_name;
            avatar = studentData.avatar_url;
          }
        }

        // C. Update State
        if (mounted) {
          setProfile({ name: fullName, avatar, role: userRole });
          setSessionError(false);
        }

        // D. SECURITY REDIRECT (User ko sahi dashboard par bhejo)
        // Sirf tab redirect karo agar wo GALAT jagah par hai
        const currentPath = location.pathname;

        if (userRole === 'admin' && !currentPath.startsWith('/admin') && !currentPath.startsWith('/profile')) {
           navigate('/admin/dashboard', { replace: true });
        } 
        else if (userRole === 'teacher' && !currentPath.startsWith('/teacher') && !currentPath.startsWith('/profile')) {
           navigate('/teacher/dashboard', { replace: true });
        } 
        else if (userRole === 'student' && !currentPath.startsWith('/student') && !currentPath.startsWith('/profile')) {
           navigate('/student/dashboard', { replace: true });
        }

      } catch (error) {
        console.error("Role Check Error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkUserRoleAndRedirect();

    return () => { mounted = false; };
  }, []); // Empty array ka matlab ye sirf ek baar chalega (Reload par)

  // -------------------------------------------
  // UI LOGIC
  // -------------------------------------------

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <div className="text-blue-900 font-bold animate-pulse">Loading Your Dashboard...</div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-6">
         <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm">
            <h2 className="text-xl font-black text-red-600 mb-2">Session Expired</h2>
            <button onClick={() => { supabase.auth.signOut(); window.location.href = '/'; }} className="bg-blue-900 text-white px-6 py-3 rounded-xl font-bold mt-4 w-full">Go to Login</button>
         </div>
      </div>
    );
  }

  // Display Role Name properly
  const displayRole = profile.role === 'admin' ? 'Administrator' : 
                      profile.role === 'teacher' ? 'Teacher' : 'Student';

  const navLinkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 mb-1
    ${location.pathname === path 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1' 
      : 'text-gray-500 hover:bg-blue-50 hover:text-blue-800'}
  `;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* HEADER */}
      <DashboardHeader 
        full_name={profile.name} 
        userRole={displayRole} 
        avatarUrl={profile.avatar}
        onMenuClick={() => setIsSidebarOpen(true)} 
      />

      {/* SIDEBAR OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* SIDEBAR DRAWER */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Header */}
        <div className="h-40 bg-blue-900 flex flex-col items-center justify-center text-white relative p-6 rounded-br-[3rem]">
          <div className="absolute top-4 right-4 cursor-pointer p-1 bg-blue-800 rounded-full hover:bg-blue-700" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </div>
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-900 font-black text-xl mb-2 shadow-lg">ASM</div>
          <h2 className="font-black text-sm tracking-widest uppercase opacity-90">Adarsh Shishu Mandir</h2>
        </div>

        {/* 🟢 DYNAMIC MENU BASED ON DB ROLE */}
        <nav className="p-5 space-y-1 overflow-y-auto h-[calc(100vh-160px)] scrollbar-hide">
          <div className="text-[10px] font-black text-gray-300 uppercase px-4 mb-2 mt-2 tracking-widest">Main Menu</div>

          {/* 1. ADMIN MENU */}
          {profile.role === 'admin' && (
            <>
              <Link to="/admin/dashboard" className={navLinkClass("/admin/dashboard")} onClick={()=>setIsSidebarOpen(false)}>
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">Admin Tools</div>
              <Link to="/admin/manage-fees" className={navLinkClass("/admin/manage-fees")} onClick={()=>setIsSidebarOpen(false)}><CreditCard size={18}/> Manage Fees</Link>
              <Link to="/admin/upload-result" className={navLinkClass("/admin/upload-result")} onClick={()=>setIsSidebarOpen(false)}><ClipboardList size={18}/> Result Center</Link>
              <Link to="/admin/add-event" className={navLinkClass("/admin/add-event")} onClick={()=>setIsSidebarOpen(false)}><Calendar size={18}/> Events</Link>
              <Link to="/admin/add-student" className={navLinkClass("/admin/add-student")} onClick={()=>setIsSidebarOpen(false)}><UserPlus size={18}/> Add Student</Link>
              <Link to="/admin/add-teacher" className={navLinkClass("/admin/add-teacher")} onClick={()=>setIsSidebarOpen(false)}><Users size={18}/> Add Staff</Link>
              <Link to="/admin/create-admin" className={navLinkClass("/admin/create-admin")} onClick={()=>setIsSidebarOpen(false)}><ShieldCheck size={18}/> Create Admin</Link>
            </>
          )}

          {/* 2. TEACHER MENU */}
          {profile.role === 'teacher' && (
            <>
              <Link to="/teacher/dashboard" className={navLinkClass("/teacher/dashboard")} onClick={()=>setIsSidebarOpen(false)}>
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">Classroom</div>
              <Link to="/teacher/attendance" className={navLinkClass("/teacher/attendance")} onClick={()=>setIsSidebarOpen(false)}><Calendar size={18}/> Attendance</Link>
              <Link to="/teacher/upload-result" className={navLinkClass("/teacher/upload-result")} onClick={()=>setIsSidebarOpen(false)}><FileText size={18}/> Marks Entry</Link>
            </>
          )}

          {/* 3. STUDENT MENU */}
          {profile.role === 'student' && (
            <>
              <Link to="/student/dashboard" className={navLinkClass("/student/dashboard")} onClick={()=>setIsSidebarOpen(false)}>
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <div className="text-[10px] font-black text-gray-300 uppercase px-4 mt-6 mb-2 tracking-widest">Academics</div>
              <Link to="/student/fees" className={navLinkClass("/student/fees")} onClick={()=>setIsSidebarOpen(false)}><CreditCard size={18}/> My Fees</Link>
              <Link to="/student/result" className={navLinkClass("/student/result")} onClick={()=>setIsSidebarOpen(false)}><FileText size={18}/> My Results</Link>
              <Link to="/student/notices" className={navLinkClass("/student/notices")} onClick={()=>setIsSidebarOpen(false)}><Calendar size={18}/> Notice Board</Link>
            </>
          )}

        </nav>
      </div>

      <main className="flex-1 pt-20 p-4 md:p-8 overflow-x-hidden w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
