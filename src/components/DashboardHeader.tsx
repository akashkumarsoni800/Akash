import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, LogOut, User, ChevronDown, Bell, Search, Globe, ShieldCheck, Settings } from 'lucide-react';

const DashboardHeader = ({ full_name, avatarUrl, userRole, onMenuClick }: any) => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isGlobeOpen, setIsGlobeOpen] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);

  // Fetch notices for the Bell icon
  const fetchNotices = async () => {
    const schoolId = localStorage.getItem('current_school_id');
    const { data } = await supabase
      .from('notices')
      .select('id, title, created_at, category')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setNotices(data);
  };

  React.useEffect(() => {
    fetchNotices();
  }, []);

  // Define searchable modules based on roles
  const modules = [
    { label: 'Command Center', path: '/admin/dashboard', icon: 'LayoutDashboard', role: 'admin' },
    { label: 'Financial Hub', path: '/admin/manage-fees', icon: 'CreditCard', role: 'admin' },
    { label: 'Enrollment', path: '/admin/add-student', icon: 'UserPlus', role: 'admin' },
    { label: 'Payroll', path: '/admin/teacher-salary', icon: 'Wallet', role: 'admin' },
    { label: 'Accounting', path: '/admin/manage-salaries', icon: 'PieChart', role: 'admin' },
    { label: 'Assessments', path: '/admin/upload-result', icon: 'ClipboardList', role: 'admin' },
    { label: 'Document Hub', path: '/admin/documents', icon: 'FileText', role: 'admin' },
    { label: 'Bulletins', path: '/admin/add-event', icon: 'Bell', role: 'admin' },
    { label: 'Student Dashboard', path: '/student/dashboard', icon: 'LayoutDashboard', role: 'student' },
    { label: 'Academic Plan', path: '/student/homework', icon: 'BookOpen', role: 'student' },
    { label: 'Report Card', path: '/student/result', icon: 'ClipboardList', role: 'student' },
    { label: 'Profile Settings', path: '/profile-setup', icon: 'User', role: 'any' },
  ].filter(m => m.role === 'any' || m.role === userRole);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const filteredModules = modules.filter(m => 
      m.label.toLowerCase().includes(query.toLowerCase())
    ).map(m => ({ ...m, type: 'Module' }));

    let dbResults: any[] = [];
    if (query.length > 2) {
      const schoolId = localStorage.getItem('current_school_id');
      
      // Search Students
      const { data: students } = await supabase
        .from('students')
        .select('full_name, student_id, class_name')
        .eq('school_id', schoolId)
        .ilike('full_name', `%${query}%`)
        .limit(3);

      if (students) {
        dbResults = [...dbResults, ...students.map(s => ({
          label: s.full_name,
          path: `/admin/documents?search=${s.student_id}`,
          type: 'Student',
          sub: `Class ${s.class_name}`
        }))];
      }

      // Search Teachers
      const { data: teachers } = await supabase
        .from('teachers')
        .select('full_name, id')
        .eq('school_id', schoolId)
        .ilike('full_name', `%${query}%`)
        .limit(2);

      if (teachers) {
        dbResults = [...dbResults, ...teachers.map(t => ({
          label: t.full_name,
          path: `/edit-teacher/${t.id}`,
          type: 'Staff',
          sub: 'Faculty Member'
        }))];
      }
    }

    setSearchResults([...filteredModules, ...dbResults]);
    setIsSearchOpen(true);
  };

 const handleLogoClick = () => {
  if (userRole === 'admin') navigate('/admin/dashboard');
  else if (userRole === 'teacher') navigate('/teacher/dashboard');
  else navigate('/student/dashboard');
 };

 const roleLabel = userRole === 'admin' ? 'Administrator' : userRole === 'teacher' ? 'Faculty Member' : 'Student Scholar';
 const roleColor = userRole === 'admin' ? 'text-blue-600' : userRole === 'teacher' ? 'text-emerald-600' : 'text-purple-600';
 const roleBg = userRole === 'admin' ? 'bg-blue-50' : userRole === 'teacher' ? 'bg-emerald-50' : 'bg-purple-50';

 return (
  <div className="fixed top-0 right-0 left-0 lg:left-64 bg-white/70 backdrop-blur-3xl z-30 px-2 md:px-4 h-20 flex justify-between items-center border-b border-slate-100/50 no-print transition-all duration-300 font-inter">
   
   <div className="flex items-center gap-6 flex-1">
    {/* Mobile Toggle */}
    <button 
     onClick={onMenuClick} 
     className="p-3 hover:bg-slate-100 rounded-2xl lg:hidden transition-all active:scale-90"
    >
     <Menu size={24} className="text-slate-600" />
    </button>

     {/* Global Search Bar (Figma Style) */}
     <div className="relative hidden md:block w-full max-w-lg">
       <div className="flex items-center gap-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl px-5 py-3 group focus-within:bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/30 transition-all shadow-sm">
        <Search size={18} className="text-slate-300 group-focus-within:text-blue-500 transition-colors" />
        <input 
         type="text" 
         placeholder="Search records, assets, or bulletins..." 
         className="bg-transparent border-none outline-none text-[13px] font-black text-slate-800 w-full placeholder:text-slate-300"
         value={searchQuery}
         onChange={(e) => handleSearch(e.target.value)}
         onFocus={() => searchQuery && setIsSearchOpen(true)}
        />
        <div className="flex items-center gap-1 bg-slate-200/50 px-2 py-1 rounded-lg text-[10px] font-black text-slate-400 ">
          ⌘ K
        </div>
       </div>

       {/* Search Results Dropdown */}
       <AnimatePresence>
        {isSearchOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)}></div>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[2rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-50 p-2"
            >
              {searchResults.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto asm-hide-scrollbar">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        navigate(result.path);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all group text-left"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        result.type === 'Module' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                      }`}>
                        {result.type === 'Module' ? <Settings size={18} /> : <User size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black text-slate-900 truncate">{result.label}</p>
                        <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mt-0.5">
                          {result.type} {result.sub ? `• ${result.sub}` : ''}
                        </p>
                      </div>
                      <ChevronDown size={14} className="text-slate-200 -rotate-90" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Intelligence Matches</p>
                </div>
              )}
            </motion.div>
          </>
        )}
       </AnimatePresence>
     </div>
   </div>

    <div className="flex items-center gap-4 md:gap-8">
     {/* Action Icons */}
     <div className="hidden sm:flex items-center gap-3">
       {/* Notification UI */}
       <div className="relative">
         <button 
           onClick={() => { setIsNotifOpen(!isNotifOpen); setIsGlobeOpen(false); setIsProfileOpen(false); }}
           className="p-3.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all relative group"
         >
          <Bell size={20} className={notices.length > 0 ? 'text-blue-500' : ''} />
          {notices.length > 0 && (
            <span className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
          )}
         </button>

         <AnimatePresence>
           {isNotifOpen && (
             <>
               <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
               <motion.div 
                 initial={{ opacity: 0, y: 15, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 15, scale: 0.95 }}
                 className="absolute right-0 mt-4 w-80 bg-white rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] border border-slate-100 p-6 z-50"
               >
                 <div className="flex items-center justify-between mb-6">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">School Bulletins</p>
                   <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[8px] font-black uppercase">Recent</span>
                 </div>
                 <div className="space-y-4">
                   {notices.length > 0 ? notices.map((n) => (
                     <div key={n.id} className="group cursor-pointer">
                       <p className="text-[11px] font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{n.title}</p>
                       <p className="text-[8px] font-black text-slate-400 uppercase mt-1">
                         {n.category || 'General'} • {new Date(n.created_at).toLocaleDateString()}
                       </p>
                     </div>
                   )) : (
                     <p className="text-[10px] text-slate-400 py-4 italic text-center uppercase tracking-widest">No active bulletins</p>
                   )}
                 </div>
                 <button 
                  onClick={() => { navigate(userRole === 'admin' ? '/admin/add-event' : '/student/dashboard'); setIsNotifOpen(false); }}
                  className="w-full mt-6 py-3 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                 >
                   View All Notices
                 </button>
               </motion.div>
             </>
           )}
         </AnimatePresence>
       </div>

       {/* Global/Globe UI */}
       <div className="relative">
         <button 
           onClick={() => { setIsGlobeOpen(!isGlobeOpen); setIsNotifOpen(false); setIsProfileOpen(false); }}
           className="p-3.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
         >
          <Globe size={20} />
         </button>

         <AnimatePresence>
           {isGlobeOpen && (
             <>
               <div className="fixed inset-0 z-40" onClick={() => setIsGlobeOpen(false)}></div>
               <motion.div 
                 initial={{ opacity: 0, y: 15, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 15, scale: 0.95 }}
                 className="absolute right-0 mt-4 w-64 bg-white rounded-[2rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] border border-slate-100 p-4 z-50"
               >
                 <div className="px-2 py-2 mb-2 border-b border-slate-50">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Environment Config</p>
                 </div>
                 <div className="space-y-1">
                   <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all group">
                     <span className="text-[11px] font-black text-slate-600 group-hover:text-blue-600 uppercase">System Language</span>
                     <span className="bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">Hindi</span>
                   </button>
                   <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all group text-left">
                     <span className="text-[11px] font-black text-slate-600 group-hover:text-blue-600 uppercase">Current Region</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase">Bihar, IN</span>
                   </button>
                   <button 
                    onClick={() => { window.open('https://wa.me/917323891040', '_blank'); setIsGlobeOpen(false); }}
                    className="w-full flex items-center justify-between p-3 hover:bg-blue-50 rounded-xl transition-all group"
                   >
                     <span className="text-[11px] font-black text-slate-600 group-hover:text-blue-600 uppercase">Tech Support</span>
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                   </button>
                 </div>
               </motion.div>
             </>
           )}
         </AnimatePresence>
       </div>
     </div>

    {/* Vertical Divider */}
    <div className="h-10 w-px bg-slate-100 hidden sm:block"></div>

    {/* Profile Dropdown */}
    <div className="relative">
     <button 
      onClick={() => setIsProfileOpen(!isProfileOpen)} 
      className="flex items-center gap-4 p-1 rounded-2xl hover:bg-slate-50 transition-all group"
     >
      <div className="relative">
       <img 
        src={avatarUrl || `https://ui-avatars.com/api/?name=${full_name}&background=0f172a&color=fff`} 
        className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-md ring-1 ring-slate-100/50 transition-transform group-hover:scale-105" 
        alt="Profile" 
       />
       <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full shadow-sm ${userRole === 'admin' ? 'bg-blue-500' : userRole === 'teacher' ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
      </div>
      <div className="text-left hidden xs:block">
       <p className="text-sm font-black text-slate-900  tracking-tight leading-none mb-1.5">{full_name || ' User'}</p>
       <div className="flex items-center gap-1.5">
         <ShieldCheck size={10} className={roleColor} />
         <p className={`text-[9px] font-black  ${roleColor}`}>{roleLabel}</p>
       </div>
      </div>
      <ChevronDown size={14} className={`text-slate-300 transition-transform duration-500 hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
     </button>

     <AnimatePresence>
      {isProfileOpen && (
       <>
        <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
        <motion.div 
         initial={{ opacity: 0, y: 15, scale: 0.95 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         exit={{ opacity: 0, y: 15, scale: 0.95 }}
         className="absolute right-0 mt-4 w-72 bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 p-3 z-20"
        >
         <div className="px-5 py-4 border-b border-slate-50 mb-3 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-300 tracking-widest leading-none">Global Control</p>
          <div className={`${roleBg} ${roleColor} px-2 py-1 rounded text-[8px] font-black `}>{userRole}</div>
         </div>
         
         <div className="space-y-1">
          <HeaderMenuItem 
           icon={User} 
           label="Profile" 
           onClick={() => { navigate('/profile-setup'); setIsProfileOpen(false); }} 
          />
          <HeaderMenuItem 
           icon={Settings} 
           label="Environment Config" 
           onClick={() => setIsProfileOpen(false)} 
          />
          <div className="pt-2 mt-2 border-t border-slate-50">
            <HeaderMenuItem 
             icon={LogOut} 
             label="Terminate Session" 
             variant="danger"
             onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} 
            />
          </div>
         </div>
        </motion.div>
       </>
      )}
     </AnimatePresence>
    </div>
   </div>
  </div>
 );
};

const HeaderMenuItem = ({ icon: Icon, label, onClick, variant = 'default' }: any) => (
 <button 
  onClick={onClick}
  className={`flex w-full items-center gap-4 p-4 rounded-xl text-[11px] font-black tracking-widest transition-all group ${
   variant === 'danger' 
   ? 'text-rose-400 hover:bg-rose-50 hover:text-rose-600' 
   : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
  }`}
 >
   <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
    variant === 'danger'
    ? 'bg-rose-50 text-rose-400 group-hover:bg-white'
    : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:shadow-sm'
   }`}>
    <Icon size={18} />
   </div>
   <span>{label}</span>
 </button>
);

export default DashboardHeader;
