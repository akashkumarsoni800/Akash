import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import { 
  X, LayoutDashboard, FileText, CreditCard, Calendar, 
  UserPlus, Users, ClipboardList, ShieldCheck, LogIn, AlertTriangle 
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // States
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(false);
  const [profile, setProfile] = useState({ name: '', avatar: '', role: '' });

  // 🛑 1. Sirf ek baar Data Fetch karo (Loop Risk: 0%)
  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        setLoading(true);

        // A. Session Check
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (isMounted) {
             setSessionError(true); 
             setLoading(false);
          }
          return;
        }

        // B. Database Role Check
        const user = session.user;
        let role = 'student'; // Default
        let name = user.user_metadata?.full_name || 'User';
        let avatar = user.user_metadata?.avatar_url || '';

        // Check Teachers Table
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('role, full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (teacherData) {
          role = teacherData.role === 'admin' ? 'admin' : 'teacher';
          name = teacherData.full_name;
          avatar = teacherData.avatar_url;
        } else {
          // Check Student Table
          const { data: studentData } = await supabase
            .from('students')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle();
            
          if (studentData) {
            name = studentData.full_name;
            avatar = studentData.avatar_url;
          }
        }

        if (isMounted) {
          setProfile({ name, avatar, role });
          setSessionError(false);
        }

      } catch (error) {
        console.error("Auth Error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserData();

    // Cleanup function
    return () => { isMounted = false; };
  }, []); // ⚠️ Empty Array: Matlab ye zindgi me sirf 1 baar chalega (No Loop)


  // 🛑 2. Agar Loading hai to Shanti se wait karo
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-gray-500 font-bold">Verifying Access...</div>
      </div>
    );
  }

  // 🛑 3. Agar Session Expire ho gya
  if (sessionError) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm">
          <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Session Expired</h2>
          <button 
            onClick={() => { supabase.auth.signOut(); window.location.href = '/'; }} 
            className="bg-blue-900 text-white w-full py-3 rounded-xl font-bold mt-4 hover:bg-black transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // UI LOGIC (No Navigation Here)
  // ----------------------------------------
  
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
        userRole={profile.role === 'admin' ? 'Administrator' : profile.role === 'teacher' ? 'Teacher' : 'Student'} 
        avatarUrl={profile.avatar}
        onMenuClick={() => setIsSidebarOpen(true)} 
      />

      {/* SIDEBAR OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* SIDEBAR DRAWER */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="h-40 bg-blue-900 flex flex-col items-center justify-center text-white relative p-6 rounded-br-[3rem]">
          <div className="absolute top-4 right-4 cursor-pointer p-1 bg-blue-800 rounded-full hover:bg-blue-700" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </div>
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-900 font-black text-xl mb-2 shadow-lg">ASM</div>
          <h2 className="font-black text-sm tracking-widest uppercase opacity-90">Adarsh Shishu Mandir</h2>
        </div>

        {/* 🟢 MENU ITEMS (Database Role ke hisab se) */}
        <nav className="p-5 space-y-1 overflow-y-auto h-[calc(100vh-160px)] scrollbar-hide">
          <div className="text-[10px] font-black text-gray-300 uppercase px-4 mb-2 mt-2 tracking-widest">Main Menu</div>

          {/* ADMIN LINKS */}
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
              <Link to="/admin/create-admin" className={navLinkClass("/admin/create-admin")} onClick={()=>setIsSidebarOpen(false)}><ShieldCheck size={18}/> New Admin</Link>
            </>
          )}

          {/* TEACHER LINKS */}
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

          {/* STUDENT LINKS */}
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

          {/* Default/Fallback (Agar role load nahi hua) */}
          {!profile.role && (
             <div className="p-4 text-xs text-gray-400 text-center">Identifying Role...</div>
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
