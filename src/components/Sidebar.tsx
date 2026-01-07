import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import { X, LayoutDashboard, CreditCard, Calendar, UserPlus, Users, ShieldCheck, FileText } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: 'User', role: '', avatar: '' });
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function getUserData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (isMounted) navigate('/', { replace: true }); 
          return;
        }

        const userEmail = session.user.email;

        // Fetch from teachers table
        const { data: staff, error: staffErr } = await supabase
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

        // Fetch from students table
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
          // 🛑 STOP THE LOOP: Don't navigate, just show error
          if (isMounted) {
            setError(true);
            setLoading(false);
          }
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    }

    getUserData();
    return () => { isMounted = false; };
  }, []); // Empty array to prevent re-running

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">ASM Loading...</div>;

  if (error) return (
    <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-xl font-bold text-red-600">User Profile Not Found</h1>
      <p className="text-gray-500 mb-4">Your email is in Auth but not in the Teachers/Students table.</p>
      <button onClick={async () => { await supabase.auth.signOut(); navigate('/'); }} className="bg-blue-900 text-white px-6 py-2 rounded-lg">Go Back to Login</button>
    </div>
  );

  const navLinkClass = (path) => `
    flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all mb-1
    ${location.pathname === path ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-blue-50'}
  `;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader full_name={profile.name} userRole={profile.role} onMenuClick={() => setIsSidebarOpen(true)} />
      {/* Sidebar Content */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-[60] transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 bg-blue-900 text-white flex justify-between items-center">
          <h2 className="font-black text-xl">ASM MENU</h2>
          <button onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
        </div>
        <nav className="p-4">
          {profile.role === 'admin' && <Link to="/admin/dashboard" className={navLinkClass("/admin/dashboard")} onClick={() => setIsSidebarOpen(false)}><LayoutDashboard size={18}/> Dashboard</Link>}
          {profile.role === 'teacher' && <Link to="/teacher/dashboard" className={navLinkClass("/teacher/dashboard")} onClick={() => setIsSidebarOpen(false)}><LayoutDashboard size={18}/> Dashboard</Link>}
          {profile.role === 'student' && <Link to="/student/dashboard" className={navLinkClass("/student/dashboard")} onClick={() => setIsSidebarOpen(false)}><LayoutDashboard size={18}/> Dashboard</Link>}
        </nav>
      </div>
      <main className="flex-1 pt-20 p-4"><Outlet /></main>
    </div>
  );
};

export default Sidebar;
