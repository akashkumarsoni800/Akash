import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import GallerySlider from './GallerySlider'; // ✅ 1. GallerySlider इम्पोर्ट किया गया
import { 
  X, LayoutDashboard, CreditCard, UserPlus, Users, 
  ShieldCheck, ClipboardList, Calendar, FileText,
  BookOpen, Package, Wallet, PieChart, Users2, Bell
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
      if (!user || !isMounted) return;

      // 1. Try Staff table first (Teacher/Admin)
      const { data: staffData } = await supabase
        .from('teachers')
        .select('full_name, avatar_url, role')
        .eq('email', user.email)
        .maybeSingle();

      if (staffData && isMounted) {
        setProfile({ 
          name: staffData.full_name, 
          avatar: staffData.avatar_url, 
          role: staffData.role 
        });
        setLoading(false);
        return;
      }

      // 2. Fallback to Students table
      const { data: studentData } = await supabase
        .from('students')
        .select('full_name, avatar_url, is_approved')
        .eq('email', user.email)
        .maybeSingle();

      if (studentData && studentData.is_approved === 'approved' && isMounted) {
        setProfile({ 
          name: studentData.full_name, 
          avatar: studentData.avatar_url, 
          role: 'student' 
        });
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
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
      <aside className={`fixed top-0 left-0 h-full w-64 md:w-72 bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out 
        lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} no-print`}>
        
        <div className="h-32 md:h-40 bg-blue-900 flex flex-col items-center justify-center text-white relative p-4 md:p-6 rounded-br-[2rem] md:rounded-br-[3rem]">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-blue-900 font-black text-xl md:text-2xl mb-1 md:mb-2 shadow-xl">ASM</div>
          <h2 className="font-black text-[9px] md:text-[10px] tracking-widest uppercase opacity-80 text-center px-2">Adarsh Shishu Mandir</h2>
          <button onClick={() => setIsMobileOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white lg:hidden"><X size={20}/></button>
        </div>

        <nav className="p-3 md:p-4 space-y-1 overflow-y-auto h-[calc(100vh-128px)] md:h-[calc(100vh-160px)] asm-hide-scrollbar">
          <p className="text-[10px] font-black text-gray-300 uppercase px-4 mb-2 tracking-widest">Navigation</p>
          
          {profile.role === 'admin' && (
            <>
              <Link to="/admin/dashboard" className={navLinkClass("/admin/dashboard")} onClick={() => setIsMobileOpen(false)}> <LayoutDashboard size={18}/> Overview </Link>
              <Link to="/admin/manage-fees" className={navLinkClass("/admin/manage-fees")} onClick={() => setIsMobileOpen(false)}> <CreditCard size={18}/> Fees Management </Link>
              <Link to="/admin/add-student" className={navLinkClass("/admin/add-student")} onClick={() => setIsMobileOpen(false)}> <UserPlus size={18}/> New Student </Link>
              <Link to="/admin/dashboard?tab=teachers" className={navLinkClass("/admin/dashboard")} onClick={() => setIsMobileOpen(false)}> <Users size={18}/> Staff Directory </Link>
              <Link to="/admin/teacher-salary" className={navLinkClass("/admin/teacher-salary")} onClick={() => setIsMobileOpen(false)}> <Wallet size={18}/> Teacher Salaries </Link>
              <Link to="/admin/manage-salaries" className={navLinkClass("/admin/manage-salaries")} onClick={() => setIsMobileOpen(false)}> <PieChart size={18}/> Accounting </Link>
              <Link to="/admin/inventory" className={navLinkClass("/admin/inventory")} onClick={() => setIsMobileOpen(false)}> <Package size={18}/> Inventory Mgmt </Link>
              <Link to="/admin/upload-result" className={navLinkClass("/admin/upload-result")} onClick={() => setIsMobileOpen(false)}> <ClipboardList size={18}/> Results </Link>
              <Link to="/admin/documents" className={navLinkClass("/admin/documents")} onClick={() => setIsMobileOpen(false)}> <FileText size={18}/> Document Hub </Link>
              <Link to="/admin/add-event" className={navLinkClass("/admin/add-event")} onClick={() => setIsMobileOpen(false)}> <Bell size={18}/> Notice Board </Link>
              <Link to="/admin/create-admin" className={navLinkClass("/admin/create-admin")} onClick={() => setIsMobileOpen(false)}> <ShieldCheck size={18}/> System Admins </Link>
            </>
          )}

          {profile.role === 'teacher' && (
            <>
              <Link to="/teacher/dashboard" className={navLinkClass("/teacher/dashboard")} onClick={() => setIsMobileOpen(false)}> <LayoutDashboard size={18}/> Dashboard </Link>
              <Link to="/teacher/students" className={navLinkClass("/teacher/students")} onClick={() => setIsMobileOpen(false)}> <Users2 size={18}/> My Students </Link>
              <Link to="/teacher/attendance" className={navLinkClass("/teacher/attendance")} onClick={() => setIsMobileOpen(false)}> <Calendar size={18}/> Attendance </Link>
              <Link to="/teacher/upload-result" className={navLinkClass("/teacher/upload-result")} onClick={() => setIsMobileOpen(false)}> <FileText size={18}/> Mark Entry </Link>
              <Link to="/teacher/analytics" className={navLinkClass("/teacher/analytics")} onClick={() => setIsMobileOpen(false)}> <PieChart size={18}/> Class Analytics </Link>
            </>
          )}

          {profile.role === 'student' && (
            <>
              <Link to="/student/dashboard" className={navLinkClass("/student/dashboard")} onClick={() => setIsMobileOpen(false)}> <LayoutDashboard size={18}/> My Dashboard </Link>
              <Link to="/student/homework" className={navLinkClass("/student/homework")} onClick={() => setIsMobileOpen(false)}> <BookOpen size={18}/> Homework </Link>
              <Link to="/student/attendance" className={navLinkClass("/student/attendance")} onClick={() => setIsMobileOpen(false)}> <Calendar size={18}/> Attendance </Link>
              <Link to="/student/fees" className={navLinkClass("/student/fees")} onClick={() => setIsMobileOpen(false)}> <CreditCard size={18}/> Fee Records </Link>
              <Link to="/student/result" className={navLinkClass("/student/result")} onClick={() => setIsMobileOpen(false)}> <ClipboardList size={18}/> Examination </Link>
              <Link to="/student/id-card" className={navLinkClass("/student/id-card")} onClick={() => setIsMobileOpen(false)}> <ShieldCheck size={18}/> My ID Card </Link>
              <Link to="/student/notices" className={navLinkClass("/student/notices")} onClick={() => setIsMobileOpen(false)}> <FileText size={18}/> Notice Board </Link>
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
    <div className="mt-10 no-print">
      <GallerySlider />
    </div>
      </main>
    </div>
  );
};

export default Sidebar;
