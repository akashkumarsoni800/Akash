import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'; // ✅ useNavigate added
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import { 
  X, LayoutDashboard, CreditCard, Calendar, 
  UserPlus, Users, ShieldCheck, FileText 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate(); // ✅ Ise initialize karna zaruri tha
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: 'User', role: '', avatar: '' });

  useEffect(() => {
    let isMounted = true;

    async function getUserData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (isMounted) navigate('/'); 
          return;
        }

        const userEmail = session.user.email;

        // 1. Staff/Admin check (teachers table)
        const { data: staff } = await supabase
          .from('teachers')
          .select('full_name, role')
          .eq('email', userEmail)
          .maybeSingle();

        if (staff) {
          if (isMounted) {
            setProfile({ name: staff.full_name, role: staff.role, avatar: '' });
            setLoading(false);
          }
          return;
        }

        // 2. Student check
        const { data: student } = await supabase
          .from('students')
          .select('full_name')
          .eq('email', userEmail)
          .maybeSingle();

        if (student) {
          if (isMounted) {
            setProfile({ name: student.full_name, role: 'student', avatar: '' });
            setLoading(false);
          }
        } else {
          // 🛑 User nahi mila: Loop rokne ke liye signout karein
          console.error("User not found in database tables.");
          await supabase.auth.signOut();
          if (isMounted) navigate('/');
        }
      } catch (err) {
        console.error("Sidebar Error:", err);
        if (isMounted) setLoading(false);
      }
    }

    getUserData();
    return () => { isMounted = false; };
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-blue-900 font-bold animate-pulse uppercase tracking-widest">ASM Loading...</div>
      </div>
    );
  }

  const roleDisplay = profile.role === 'admin' ? 'Administrator' : 
                      profile.role === 'teacher' ? 'Teacher' : 'Student';

  const navLinkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all mb-1
    ${location.pathname === path ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-blue-50'}
  `;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader 
        full_name={profile.name} 
        userRole={roleDisplay} 
        onMenuClick={() => setIsSidebarOpen(true)} 
      />

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Drawer */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-[60] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 bg-blue-900 text-white flex justify-between items-start">
          <div>
             <h2 className="font-black text-xl tracking-tighter">ASM SYSTEM</h2>
             <p className="text-[10px] opacity-70 font-bold uppercase">Adarsh Shishu Mandir</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="hover:rotate-90 transition-transform"><X size={20}/></button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-100px)]">
          {/* Menu Items (Same as your code) */}
          {profile.role === 'admin' && (
            <>
              <Link to="/admin/dashboard" className={navLinkClass("/admin/dashboard")} onClick={() => setIsSidebarOpen(false)}> <LayoutDashboard size={18}/> Dashboard </Link>
              <Link to="/admin/manage-fees" className={navLinkClass("/admin/manage-fees")} onClick={() => setIsSidebarOpen(false)}> <CreditCard size={18}/> Manage Fees </Link>
              <Link to="/admin/add-student" className={navLinkClass("/admin/add-student")} onClick={() => setIsSidebarOpen(false)}> <UserPlus size={18}/> Admissions </Link>
              <Link to="/admin/add-teacher" className={navLinkClass("/admin/add-teacher")} onClick={() => setIsSidebarOpen(false)}> <Users size={18}/> Staff Mgmt </Link>
              <Link to="/admin/create-admin" className={navLinkClass("/admin/create-admin")} onClick={() => setIsSidebarOpen(false)}> <ShieldCheck size={18}/> Security </Link>
            </>
          )}
          {profile.role === 'teacher' && (
            <>
              <Link to="/teacher/dashboard" className={navLinkClass("/teacher/dashboard")} onClick={() => setIsSidebarOpen(false)}> <LayoutDashboard size={18}/> Dashboard </Link>
              <Link to="/teacher/attendance" className={navLinkClass("/teacher/attendance")} onClick={() => setIsSidebarOpen(false)}> <Calendar size={18}/> Attendance </Link>
              <Link to="/teacher/upload-result" className={navLinkClass("/teacher/upload-result")} onClick={() => setIsSidebarOpen(false)}> <FileText size={18}/> Results </Link>
            </>
          )}
          {profile.role === 'student' && (
            <>
              <Link to="/student/dashboard" className={navLinkClass("/student/dashboard")} onClick={() => setIsSidebarOpen(false)}> <LayoutDashboard size={18}/> Dashboard </Link>
              <Link to="/student/fees" className={navLinkClass("/student/fees")} onClick={() => setIsSidebarOpen(false)}> <CreditCard size={18}/> My Fees </Link>
            </>
          )}
        </nav>
      </div>

      <main className="flex-1 pt-20 p-4 w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
