import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import { 
  X, LayoutDashboard, FileText, CreditCard, Calendar, 
  UserPlus, Users, ClipboardList, ShieldCheck 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: 'User', avatar: '', role: '' });

  // ✅ FIX: Isme se 'navigate' aur 'location.pathname' dependency hata di hai
  // Isse Loop 100% khatam ho jayega
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) setLoading(false);
          return;
        }

        // Database se data lao
        let fullName = user.email?.split('@')[0]; 
        let avatar = '';
        let detectedRole = 'student';

        // 1. Check Teachers/Admin
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
          // 2. Check Students
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
          setProfile({ name: fullName || 'User', avatar, role: detectedRole });
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, []); // ⚠️ Empty dependency array: Sirf ek baar chalega

  // Jab bhi link click ho, Sidebar close ho jaye (Mobile ke liye)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center font-bold text-blue-900">
      Verifying Access...
    </div>
  );

  const navLinkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all
    ${location.pathname === path ? 'bg-blue-900 text-white shadow-lg' : 'text-gray-500 hover:bg-blue-50'}
  `;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader 
        full_name={profile.name} 
        userRole={profile.role === 'admin' ? 'Administrator' : profile.role === 'teacher' ? 'Teacher' : 'Student'} 
        avatarUrl={profile.avatar}
        onMenuClick={() => setIsOpen(true)} 
      />

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
      )}

      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-40 bg-blue-900 flex flex-col items-center justify-center text-white relative p-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-2 shadow-xl">
             <span className="text-blue-900 font-black text-2xl">ASM</span>
          </div>
          <h2 className="font-black text-xs tracking-widest uppercase opacity-90 text-center">Adarsh Shishu Mandir</h2>
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20}/></button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-160px)]">
          <div className="text-[10px] font-black text-gray-300 uppercase px-4 mb-2">Main Menu</div>

          {/* Role Based Logic */}
          {profile.role === 'admin' && (
            <>
              <Link to="/admin/dashboard" className={navLinkClass("/admin/dashboard")}> <LayoutDashboard size={18}/> Dashboard </Link>
              <Link to="/admin/manage-fees" className={navLinkClass("/admin/manage-fees")}> <CreditCard size={18}/> Fees Management </Link>
              <Link to="/admin/upload-result" className={navLinkClass("/admin/upload-result")}> <ClipboardList size={18}/> Results </Link>
              <Link to="/admin/add-student" className={navLinkClass("/admin/add-student")}> <UserPlus size={18}/> Add Student </Link>
              <Link to="/admin/add-teacher" className={navLinkClass("/admin/add-teacher")}> <Users size={18}/> Add Staff </Link>
              <Link to="/admin/create-admin" className={navLinkClass("/admin/create-admin")}> <ShieldCheck size={18}/> New Admin </Link>
            </>
          )}

          {profile.role === 'teacher' && (
            <>
              <Link to="/teacher/dashboard" className={navLinkClass("/teacher/dashboard")}> <LayoutDashboard size={18}/> Dashboard </Link>
              <Link to="/teacher/attendance" className={navLinkClass("/teacher/attendance")}> <Calendar size={18}/> Attendance </Link>
              <Link to="/teacher/upload-result" className={navLinkClass("/teacher/upload-result")}> <FileText size={18}/> Marks Entry </Link>
            </>
          )}

          {profile.role === 'student' && (
            <>
              <Link to="/student/dashboard" className={navLinkClass("/student/dashboard")}> <LayoutDashboard size={18}/> Dashboard </Link>
              <Link to="/student/fees" className={navLinkClass("/student/fees")}> <CreditCard size={18}/> My Fees </Link>
              <Link to="/student/result" className={navLinkClass("/student/result")}> <FileText size={18}/> My Results </Link>
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
