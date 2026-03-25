import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, LogOut, User, ChevronDown, Bell, Search, Globe, ShieldCheck, Settings } from 'lucide-react';

const DashboardHeader = ({ full_name, avatarUrl, userRole, onMenuClick }: any) => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogoClick = () => {
    if (userRole === 'admin') navigate('/admin/dashboard');
    else if (userRole === 'teacher') navigate('/teacher/dashboard');
    else navigate('/student/dashboard');
  };

  const roleLabel = userRole === 'admin' ? 'Administrator' : userRole === 'teacher' ? 'Faculty Member' : 'Student Scholar';
  const roleColor = userRole === 'admin' ? 'text-blue-600' : userRole === 'teacher' ? 'text-emerald-600' : 'text-purple-600';
  const roleBg = userRole === 'admin' ? 'bg-blue-50' : userRole === 'teacher' ? 'bg-emerald-50' : 'bg-purple-50';

  return (
    <div className="fixed top-0 right-0 left-0 lg:left-64 bg-white/70 backdrop-blur-3xl z-30 px-6 md:px-12 h-20 flex justify-between items-center border-b border-slate-100/50 no-print transition-all duration-300 font-inter">
      
      <div className="flex items-center gap-6 flex-1">
        {/* Mobile Toggle */}
        <button 
          onClick={onMenuClick} 
          className="p-3 hover:bg-slate-100 rounded-2xl lg:hidden transition-all active:scale-90"
        >
          <Menu size={24} className="text-slate-600" />
        </button>

        {/* Global Search Bar (Figma Style) */}
        <div className="hidden md:flex items-center gap-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl px-5 py-3 w-full max-w-lg group focus-within:bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/30 transition-all shadow-sm">
          <Search size={18} className="text-slate-300 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search records, assets, or bulletins..." 
            className="bg-transparent border-none outline-none text-[13px] font-black text-slate-800 w-full placeholder:text-slate-300"
          />
          <div className="flex items-center gap-1 bg-slate-200/50 px-2 py-1 rounded-lg text-[10px] font-black text-slate-400  ">
             ⌘ K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        {/* Action Icons */}
        <div className="hidden sm:flex items-center gap-3">
           <button className="p-3.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all relative group">
             <Bell size={20} className="group-hover:rotate-12 transition-transform" />
             <span className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>
           </button>
           <button className="p-3.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
             <Globe size={20} />
           </button>
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
              <p className="text-sm font-black text-slate-900   tracking-tight leading-none mb-1.5">{full_name || 'System User'}</p>
              <div className="flex items-center gap-1.5">
                 <ShieldCheck size={10} className={roleColor} />
                 <p className={`text-[9px] font-black   ${roleColor}`}>{roleLabel}</p>
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
                    <p className="text-[10px] font-black text-slate-300  tracking-widest leading-none">Global Control</p>
                    <div className={`${roleBg} ${roleColor} px-2 py-1 rounded text-[8px] font-black  `}>{userRole}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <HeaderMenuItem 
                      icon={User} 
                      label="Institutional Profile" 
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
    className={`flex w-full items-center gap-4 p-4 rounded-xl text-[11px] font-black  tracking-widest transition-all group  ${
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
