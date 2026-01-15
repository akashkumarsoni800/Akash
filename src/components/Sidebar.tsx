import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import GallerySlider from './GallerySlider'; // ✅ 1. GallerySlider इम्पोर्ट किया गया
import { 
  X, LayoutDashboard, CreditCard, UserPlus, Users, 
  ShieldCheck, ClipboardList, Calendar, FileText 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: 'User', avatar: '', role: '' });

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: teacherData } = await supabase
          .from('teachers')
          .select('full_name, avatar_url, role')
          .eq('email', user.email)
          .maybeSingle();

        if (teacherData) { 
          setProfile({ name: teacherData.full_name, avatar: teacherData.avatar_url, role: teacherData.role });
        } else {
          const { data: studentData } = await supabase
            .from('students')
            .select('full_name, avatar_url')
            .eq('email', user.email)
            .maybeSingle();
          if (studentData) {
            setProfile({ name: studentData.full_name, avatar: studentData.avatar_url, role: 'student' });
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  const navLinkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all
    ${location.pathname === path ? 'bg-blue-900 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-blue-50'}
  `;

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-blue-900">ASM Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      
      <DashboardHeader 
        full_name={profile.name} 
        userRole={profile.role} 
        avatarUrl={profile.avatar}
        onMenuClick={() => setIsMobileOpen(true)} 
      />

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] lg:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}></div>
      )}

      {/* SIDEBAR DRAWER */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out 
        lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="h-40 bg-blue-900 flex flex-col items-center justify-center text-white relative p-6 rounded-br-[3rem]">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-900 font-black text-2xl mb-2 shadow-xl">ASM</div>
          <h2 className="font-black text-[10px] tracking-widest uppercase opacity-80">Adarsh Shishu Mandir</h2>
          <button onClick={() => setIsMobileOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white lg:hidden"><X size={24}/></button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-160px)] scrollbar-hide">
          <p className="text-[10px] font-black text-gray-300 uppercase px-4 mb-2 tracking-widest">Navigation</p>
          
          {profile.role === 'admin' && (
            <>
              <Link to="/admin/dashboard" className={navLinkClass("/admin/dashboard")} onClick={() => setIsMobileOpen(false)}> <LayoutDashboard size={18}/> Overview </Link>
              <Link to="/admin/manage-fees" className={navLinkClass("/admin/manage-fees")} onClick={() => setIsMobileOpen(false)}> <CreditCard size={18}/> Fees Management </Link>
              <Link to="/admin/add-student" className={navLinkClass("/admin/add-student")} onClick={() => setIsMobileOpen(false)}> <UserPlus size={18}/> New Student </Link>
              <Link to="/admin/add-teacher" className={navLinkClass("/admin/add-teacher")} onClick={() => setIsMobileOpen(false)}> <Users size={18}/> Staff Directory </Link>
              <Link to="/admin/upload-result" className={navLinkClass("/admin/upload-result")} onClick={() => setIsMobileOpen(false)}> <ClipboardList size={18}/> Results </Link>
              <Link to="/admin/create-admin" className={navLinkClass("/admin/create-admin")} onClick={() => setIsMobileOpen(false)}> <ShieldCheck size={18}/> New Admin Account </Link>
            </>
          )}

          {profile.role === 'teacher' && (
            <>
              <Link to="/teacher/dashboard" className={navLinkClass("/teacher/dashboard")} onClick={() => setIsMobileOpen(false)}> <LayoutDashboard size={18}/> Dashboard </Link>
              <Link to="/teacher/attendance" className={navLinkClass("/teacher/attendance")} onClick={() => setIsMobileOpen(false)}> <Calendar size={18}/> Attendance </Link>
              <Link to="/teacher/upload-result" className={navLinkClass("/teacher/upload-result")} onClick={() => setIsMobileOpen(false)}> <FileText size={18}/> Mark Entry </Link>
            </>
          )}

          {profile.role === 'student' && (
            <>
              <Link to="/student/dashboard" className={navLinkClass("/student/dashboard")} onClick={() => setIsMobileOpen(false)}> <LayoutDashboard size={18}/> My Dashboard </Link>
              <Link to="/student/fees" className={navLinkClass("/student/fees")} onClick={() => setIsMobileOpen(false)}> <CreditCard size={18}/> Fee Records </Link>
              <Link to="/student/result" className={navLinkClass("/student/result")} onClick={() => setIsMobileOpen(false)}> <ClipboardList size={18}/> Examination </Link>
            </>
          )}
        </nav>
      </aside>

      {/* CONTENT AREA */}
      <main className={`transition-all duration-300 pt-16 min-h-screen lg:ml-72`}>
        <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
          
        

          <Outlet />
        </div>
        {/* 🖼️ स्लाइडर अब कंटेंट के नीचे "बीच" में दिखेगा */}
    <div className="mt-10">
      <GallerySlider />
    </div>
      </main>
    </div>
  );
};

export default Sidebar;
