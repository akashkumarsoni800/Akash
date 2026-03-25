import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { Menu, LogOut, User, ChevronDown, Bell, Search, Globe } from 'lucide-react';

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

  return (
    <div className="fixed top-0 right-0 left-0 lg:left-64 bg-white/80 backdrop-blur-xl z-30 px-6 md:px-10 h-20 flex justify-between items-center border-b border-slate-100 no-print transition-all duration-300">
      
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Toggle */}
        <button 
          onClick={onMenuClick} 
          className="p-2.5 hover:bg-slate-100 rounded-xl lg:hidden transition-all active:scale-90"
        >
          <Menu size={24} className="text-slate-600" />
        </button>

        {/* Global Search Bar (Figma Style) */}
        <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 w-full max-w-md group focus-within:bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
          <Search size={18} className="text-slate-400 group-focus-within:text-blue-500" />
          <input 
            type="text" 
            placeholder="Search records, assets, or bulletins..." 
            className="bg-transparent border-none outline-none text-sm font-medium text-slate-900 w-full placeholder:text-slate-400"
          />
          <div className="flex items-center gap-1 bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-black text-slate-500 uppercase">
             ⌘ K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Action Icons */}
        <div className="hidden sm:flex items-center gap-2">
           <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all relative">
             <Bell size={20} />
             <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
           </button>
           <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
             <Globe size={20} />
           </button>
        </div>

        {/* Vertical Divider */}
        <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)} 
            className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 transition-all group"
          >
            <div className="relative">
              <img 
                src={avatarUrl || `https://ui-avatars.com/api/?name=${full_name}&background=1e293b&color=fff`} 
                className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm ring-1 ring-slate-100" 
                alt="Profile" 
              />
              <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${userRole === 'admin' ? 'bg-blue-500' : userRole === 'teacher' ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
            </div>
            <div className="text-left hidden xs:block">
              <p className="text-[11px] font-black text-slate-900 leading-none mb-1">{full_name || 'System User'}</p>
              <p className={`text-[9px] font-bold uppercase tracking-widest ${roleColor}`}>{roleLabel}</p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 mt-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-20"
              >
                <div className="px-4 py-3 border-b border-slate-50 mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized Session</p>
                </div>
                <button 
                  onClick={() => { navigate('/profile-setup'); setIsProfileOpen(false); }}
                  className="flex w-full items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-[11px] font-bold text-slate-700 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-white transition-colors">
                    <User size={16} />
                  </div>
                  System Profile
                </button>
                <button 
                  onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
                  className="flex w-full items-center gap-3 p-3 hover:bg-rose-50 rounded-xl text-[11px] font-bold text-rose-600 transition-all mt-1 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-white transition-colors">
                    <LogOut size={16} />
                  </div>
                  Terminate Session
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
