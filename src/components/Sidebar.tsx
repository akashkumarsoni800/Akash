import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import GallerySlider from './GallerySlider';
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
  const [profile, setProfile] = useState({ name: 'User', avatar: '', role: '' as any });
  const schoolName = localStorage.getItem('current_school_name') || 'ASMD';
  const schoolLogo = localStorage.getItem('current_school_logo');
  const schoolCode = localStorage.getItem('current_school_code');

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
  <div className="min-h-screen bg-[#F8FAFC]">
   <DashboardHeader 
    full_name={profile.name} 
    userRole={profile.role} 
    avatarUrl={profile.avatar}
    onMenuClick={() => setIsMobileOpen(true)} 
   />

   <AnimatePresence>
    {isMobileOpen && (
     <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 z-[90] lg:hidden" 
      onClick={() => setIsMobileOpen(false)}
     />
    )}
   </AnimatePresence>

   <aside className={`premium-sidebar lg:translate-x-0 ${isMobileOpen ? 'translate-x-0 z-[100]' : '-translate-x-full'} transition-all duration-300 ease-in-out flex flex-col pt-8 shadow-2xl lg:shadow-none`}>
    <div className="px-8 mb-10 flex items-center justify-between">
     <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl animate-float overflow-hidden ${
       profile.role === 'admin' ? 'bg-blue-600' : profile.role === 'teacher' ? 'bg-emerald-600' : 'bg-purple-600'
      }`}>
       {schoolLogo ? (
         <img src={schoolLogo} className="w-full h-full object-cover" alt="logo" />
       ) : schoolCode === 'ASM01' ? (
         <img src="/logo.png" className="w-full h-full object-contain p-1.5" alt="logo" />
       ) : (
         <div className="w-full h-full flex items-center justify-center bg-white/20 text-white font-black text-xl">
           {schoolName.charAt(0).toUpperCase()}
         </div>
       )}
      </div>
      <div>
       <h2 className="text-sm font-black text-white  leading-none uppercase">{schoolName}</h2>
       <p className="text-[9px] font-black text-slate-500 tracking-widest mt-1">Platform v4.0</p>
      </div>
     </div>
     <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-slate-500 hover:text-white transition-colors">
      <X size={20}/>
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
     <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 mb-4">
       <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600 flex items-center justify-center">
         {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : <Users size={14} className="text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
         <p className="text-[10px] font-black text-white truncate">{profile.name}</p>
         <p className="text-[8px] font-black text-slate-500 tracking-widest mt-0.5">{profile.role}</p>
        </div>
       </div>
       <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-rose-600/10 hover:text-rose-500 transition-all text-[10px] font-black tracking-widest border border-transparent hover:border-rose-500/20"
       >
        <LogOut size={12} /> Terminate session
       </button>
     </div>
     <p className="text-[8px] font-black text-slate-600 text-center ">Integrated Logic</p>
    </div>
   </aside>

   <main className={`transition-all duration-500 pt-20 min-h-screen lg:ml-64`}>
    <div className="px-1 md:px-2 pb-10 w-full max-w-full mx-auto">
     <Outlet />
     <div className="mt-16 no-print opacity-80 hover:opacity-100 transition-opacity">
      <GallerySlider />
     </div>
    </div>
   </main>
  </div>
 );
};

export default Sidebar;
