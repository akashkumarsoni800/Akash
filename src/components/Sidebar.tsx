import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import { 
  X, LayoutDashboard, FileText, CreditCard, Calendar, 
  UserPlus, Users, ClipboardList, ShieldCheck, AlertCircle 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // States for Data
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: 'User', role: 'student', avatar: '' });

  // 🛑 FIX: Yahan 'navigate' use nahi kiya hai, isliye Loop nahi banega
  useEffect(() => {
    let isMounted = true;

    async function getUserData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (isMounted) setLoading(false);
          return; 
        }

        const user = session.user;
        
        // Default Data
        let userRole = 'student';
        let userName = user.user_metadata?.full_name || 'User';
        let userAvatar = user.user_metadata?.avatar_url || '';

        // 1. Check Teachers Table (Admin/Teacher)
        const { data: teacher } = await supabase
          .from('teachers')
          .select('full_name, role, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (teacher) {
          userRole = teacher.role === 'admin' ? 'admin' : 'teacher';
          userName = teacher.full_name;
          userAvatar = teacher.avatar_url;
        } else {
          // 2. Check Student Table
          const { data: student } = await supabase
            .from('students')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          if (student) {
            userRole = 'student';
            userName = student.full_name;
            userAvatar = student.avatar_url;
          }
        }

        if (isMounted) {
          setProfile({ name: userName, role: userRole, avatar: userAvatar });
          setLoading(false);
        }

      } catch (error) {
        console.error("Sidebar Error:", error);
        if (isMounted) setLoading(false);
      }
    }

    getUserData();

    return () => { isMounted = false; };
  }, []); // ⚠️ Empty Array = Ye code sirf 1 baar chalega

  // ---------------- UI RENDERING ----------------

  // Loading Screen (Crash Rokne ke liye)
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-blue-900 font-bold animate-pulse">Loading Menu...</div>
      </div>
    );
  }

  // Display Name for Role
  const roleDisplay = profile.role === 'admin' ? 'Administrator' : 
                      profile.role === 'teacher' ? 'Teacher' : 'Student';

  // Helper Class for Links
  const navLinkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all mb-1
    ${location.pathname === path ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-blue-50'}
  `;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* 1. Header */}
      <DashboardHeader 
        full_name={profile.name} 
        userRole={roleDisplay} 
        avatarUrl={profile.avatar}
        onMenuClick={() => setIsSidebarOpen(true)} 
      />

      {/* 2. Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* 3. Sidebar Drawer */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-[60] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-6 bg-blue-900 text-white flex justify-between items-start">
          <div>
             <h2 className="font-black text-xl">ASM SYSTEM</h2>
             <p className="text-xs opacity-70">School Management</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-100px)]">
          <p className="text-[10px] font-bold text-gray-400 uppercase px-4 mb-2">Menu</p>

          {/* ADMIN MENU */}
          {profile.role === 'admin' && (
            <>
              <Link to="/admin/dashboard" className={navLinkClass("/admin/dashboard")} onClick={() => setIsSidebarOpen(false)}> <LayoutDashboard size={18}/> Dashboard </Link>
              <Link to="/admin/manage-fees" className={navLinkClass("/admin/manage-fees")} onClick={() => setIsSidebarOpen(false)}> <CreditCard size={18}/> Fees </Link>
              <Link to="/admin/add-student" className={navLinkClass("/admin/add-student")} onClick={() => setIsSidebarOpen(false)}> <UserPlus size={18}/> Students </Link>
              <Link to="/admin/add-teacher" className={navLinkClass("/admin/add-teacher")} onClick={() => setIsSidebarOpen(false)}> <Users size={18}/> Teachers </Link>
              <Link to="/admin/create-admin" className={navLinkClass("/admin/create-admin")} onClick={() => setIsSidebarOpen(false)}> <ShieldCheck size={18}/> Create Admin </Link>
            </>
          )}

          {/* TEACHER MENU */}
          {profile.role === 'teacher' && (
            <>
              <Link to="/teacher/dashboard" className={navLinkClass("/teacher/dashboard")} onClick={() => setIsSidebarOpen(false)}> <LayoutDashboard size={18}/> Dashboard </Link>
              <Link to="/teacher/attendance" className={navLinkClass("/teacher/attendance")} onClick={() => setIsSidebarOpen(false)}> <Calendar size={18}/> Attendance </Link>
            </>
          )}

          {/* STUDENT MENU */}
          {profile.role === 'student' && (
            <>
              <Link to="/student/dashboard" className={navLinkClass("/student/dashboard")} onClick={() => setIsSidebarOpen(false)}> <LayoutDashboard size={18}/> Dashboard </Link>
              <Link to="/student/fees" className={navLinkClass("/student/fees")} onClick={() => setIsSidebarOpen(false)}> <CreditCard size={18}/> My Fees </Link>
            </>
          )}

        </nav>
      </div>

      {/* 4. CONTENT AREA */}
      <main className="flex-1 pt-20 p-4 w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
