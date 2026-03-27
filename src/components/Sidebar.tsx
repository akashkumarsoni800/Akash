import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import GlobalGallerySlider from './shared/GlobalGallerySlider';
import { 
 X, LayoutDashboard, CreditCard, UserPlus, Users, 
 ShieldCheck, ClipboardList, Calendar, FileText,
 BookOpen, Package, Wallet, PieChart, Users2, Bell,
 LogOut, Shield, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
 const location = useLocation();
 const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [isReallyDesktop, setIsReallyDesktop] = useState(true);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [profile, setProfile] = useState({ name: 'User', avatar: '', role: '' as any });
  const [schoolLogo, setSchoolLogo] = useState(localStorage.getItem('current_school_logo'));
  const [schoolName, setSchoolName] = useState(localStorage.getItem('current_school_name') || 'Tekool');
  const schoolCode = localStorage.getItem('current_school_code');

  useEffect(() => {
    const fetchBranding = async () => {
      const schoolId = localStorage.getItem('current_school_id');
      if (!schoolId) return;

      try {
        const { data, error } = await supabase
          .from('schools')
          .select('name, logo_url')
          .eq('id', schoolId)
          .maybeSingle();

        if (data && !error) {
          if (data.logo_url) {
            setSchoolLogo(data.logo_url);
            localStorage.setItem('current_school_logo', data.logo_url);
          }
          if (data.name) {
            let finalName = data.name;
            if (finalName === 'ASMD' || finalName === 'Academic Luminary') finalName = 'Tekool';
            setSchoolName(finalName);
            localStorage.setItem('current_school_name', finalName);
          }
        }
      } catch (err) {
        console.error("Sidebar branding fetch failed:", err);
      }
    };

    const checkDevice = () => {
      // Force mobile view if UserAgent contains mobile indicators
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const wideEnough = window.innerWidth >= 1024;
      setIsReallyDesktop(wideEnough && !isMobileUA);
    };

    fetchBranding();
    checkDevice();
    window.addEventListener('resize', checkDevice);

    const handleStorageChange = () => {
      setSchoolLogo(localStorage.getItem('current_school_logo'));
      setSchoolName(localStorage.getItem('current_school_name') || 'Tekool');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

 useEffect(() => {
  let isMounted = true;
  const fetchProfile = async () => {
   try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isMounted) return;

    const { data: staffData } = await supabase
     .from('teachers')
     .select('full_name, avatar_url, role')
     .eq('email', user.email)
     .limit(1)
     .maybeSingle();

    if (staffData && isMounted) {
     setProfile({ name: staffData.full_name, avatar: staffData.avatar_url, role: staffData.role });
     setLoading(false);
     return;
    }

    const { data: studentData } = await supabase
     .from('students')
     .select('full_name, avatar_url, is_approved')
     .eq('email', user.email)
     .limit(1)
     .maybeSingle();

    if (studentData && studentData.is_approved === 'approved' && isMounted) {
     setProfile({ name: studentData.full_name, avatar: studentData.avatar_url, role: 'student' });
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

 const handleLogout = async () => {
  await supabase.auth.signOut();
  navigate('/login');
 };

 const activeClass = profile.role === 'admin' ? 'active-admin' : profile.role === 'teacher' ? 'active-teacher' : 'active-student';

 const NavItem = ({ to, icon, label }: { to: string, icon: any, label: string }) => {
  const isActive = location.pathname === to;
  return (
   <Link 
    to={to} 
    onClick={() => setIsMobileOpen(false)}
    className={`premium-nav-item ${isActive ? activeClass : ''}`}
   >
    <span className={`${isActive ? 'scale-110' : ''} transition-transform`}>{icon}</span>
    <span className="flex-1">{label}</span>
    {isActive && <ChevronRight size={14} className="opacity-50" />}
   </Link>
  );
 };

 if (loading) return (
  <div className="h-screen flex items-center justify-center bg-[#f9fafb]">
   <div className="flex flex-col items-center gap-4">
    <div className="w-12 h-12 border-4 border-slate-800 border-t-slate-300 rounded-full animate-spin"></div>
    <p className="text-[10px] font-black text-slate-400 tracking-widest">Encrypting Session...</p>
   </div>
  </div>
 );

 return (
  <div className="min-h-screen bg-[#F8FAFC] relative">
   <DashboardHeader 
    full_name={profile.name} 
    userRole={profile.role} 
    avatarUrl={profile.avatar}
    onMenuClick={() => setIsMobileOpen(true)} 
   />

   <AnimatePresence>
    {isMobileOpen && (
     <div 
      className="fixed inset-0 bg-black/40 z-[999] lg:hidden" 
      onClick={() => setIsMobileOpen(false)}
     />
    )}
   </AnimatePresence>

   <aside className={`premium-sidebar ${isReallyDesktop ? 'translate-x-0' : '-translate-x-full'} ${isMobileOpen ? 'translate-x-0 !z-[1000]' : ''} transition-all duration-300 ease-in-out flex flex-col pt-8 shadow-2xl ${isReallyDesktop ? 'shadow-none' : ''}`}>
    <div className="px-8 mb-10 flex items-center justify-between">
      <div className="flex items-center gap-4">
       <div className="w-14 h-14 rounded-[5px] flex items-center justify-center bg-white shadow-2xl active:scale-95 tracking-widest animate-float overflow-hidden border border-slate-100 relative">
        {schoolLogo && !logoLoadError ? (
          <img 
            src={schoolLogo} 
            className="w-full h-full object-contain p-1" 
            alt="logo" 
            crossOrigin="anonymous"
            onError={() => {
              console.warn("Sidebar logo load failed, falling back to logo.png");
              setLogoLoadError(true);
            }}
          />
        ) : (
          <img src="/logo.png" className="w-full h-full object-contain p-1.5" alt="logo" />
        )}
       </div>
       <div>
        <h2 className="text-[13px] font-black text-white leading-none uppercase tracking-tight">
          {schoolName || 'Tekool'}
        </h2>
        <p className="text-[9px] font-black text-slate-500 tracking-widest mt-1">Platform v5.0</p>
       </div>
      </div>
      <button onClick={() => setIsMobileOpen(false)} className={`${isReallyDesktop ? 'hidden' : 'block'} text-slate-500 hover:text-white transition-colors p-2`}>
       <X size={24}/>
      </button>
    </div>

    <nav className="flex-1 px-4 space-y-1 overflow-y-auto asm-hide-scrollbar">
     <p className="text-[10px] font-black text-slate-500 px-4 mb-4 tracking-widest">Navigation</p>
     
     {profile.role === 'admin' && (
      <>
       <NavItem to="/admin/dashboard" icon={<LayoutDashboard size={18}/>} label="Command Center" />
       <NavItem to="/admin/manage-fees" icon={<CreditCard size={18}/>} label="Financial Hub" />
       <NavItem to="/admin/add-student" icon={<UserPlus size={18}/>} label="Enrollment" />
       <NavItem to="/admin/teacher-salary" icon={<Wallet size={18}/>} label="Payroll" />
       <NavItem to="/admin/manage-salaries" icon={<PieChart size={18}/>} label="Accounting" />
       <NavItem to="/admin/inventory" icon={<Package size={18}/>} label="Logistics" />
       <NavItem to="/admin/upload-result" icon={<ClipboardList size={18}/>} label="Assessments" />
       <NavItem to="/admin/documents" icon={<FileText size={18}/>} label="Document Hub" />
       <NavItem to="/admin/add-event" icon={<Bell size={18}/>} label="Bulletins" />
       <NavItem to="/admin/create-admin" icon={<ShieldCheck size={18}/>} label=" Admins" />
      </>
     )}

     {profile.role === 'teacher' && (
      <>
       <NavItem to="/teacher/dashboard" icon={<LayoutDashboard size={18}/>} label="Faculty Desk" />
       <NavItem to="/teacher/students" icon={<Users2 size={18}/>} label="My Class" />
       <NavItem to="/teacher/attendance" icon={<Calendar size={18}/>} label="Attendance" />
       <NavItem to="/teacher/upload-result" icon={<FileText size={18}/>} label="Marking" />
       <NavItem to="/teacher/analytics" icon={<PieChart size={18}/>} label="Performance" />
      </>
     )}

     {profile.role === 'student' && (
      <>
       <NavItem to="/student/dashboard" icon={<LayoutDashboard size={18}/>} label="Overview" />
       <NavItem to="/student/homework" icon={<BookOpen size={18}/>} label="Academic Plan" />
       <NavItem to="/student/attendance" icon={<Calendar size={18}/>} label="Lifecycle" />
       <NavItem to="/student/fees" icon={<CreditCard size={18}/>} label="Bursary" />
       <NavItem to="/student/result" icon={<ClipboardList size={18}/>} label="Report Card" />
       <NavItem to="/student/id-card" icon={<ShieldCheck size={18}/>} label="Identity" />
       <NavItem to="/student/notices" icon={<FileText size={18}/>} label="Briefings" />
      </>
     )}
    </nav>

     <div className="p-4 mt-auto">
     <div className="p-4 rounded-[5px] bg-slate-800/40 border border-slate-700/50 mb-4">
       <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600 flex items-center justify-center">
         {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : <Users size={14} className="text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
         <p className="text-[10px] font-black text-white truncate">{profile.name}</p>
         <p className="text-[8px] font-black text-slate-500 tracking-widest mt-0.5">{profile.role}</p>
        </div>
       </div>
       <div className="flex flex-col gap-2">
         <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[5px] bg-slate-700/50 text-slate-400 hover:bg-rose-600/10 hover:text-rose-500 transition-all text-[10px] font-black tracking-widest border border-transparent hover:border-rose-500/20"
         >
          <LogOut size={12} /> Terminate session
         </button>
         <button 
          onClick={() => {
            localStorage.removeItem('current_school_logo');
            localStorage.removeItem('current_school_name');
            window.location.reload();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[5px] bg-slate-800/20 text-slate-500 hover:text-blue-400 transition-all text-[9px] font-black tracking-widest border border-dashed border-slate-700 hover:border-blue-500/30"
         >
          <PieChart size={10} /> Force Sync Branding
         </button>
       </div>
     </div>
     <p className="text-[8px] font-black text-slate-600 text-center ">Integrated Logic • v3.0</p>
    </div>
   </aside>

   <main className={`transition-all duration-500 pt-20 min-h-screen ${isReallyDesktop ? 'ml-64' : 'ml-0'}`}>
    <div className="pb-10 w-full animate__animated animate__fadeIn">
     <Outlet />
     <div className="mt-20 no-print opacity-80 hover:opacity-100 transition-opacity px-4 md:px-0">
      <GlobalGallerySlider />
     </div>
    </div>
   </main>
  </div>
 );
};

export default Sidebar;
