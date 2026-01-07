import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Menu, LogOut, User, ChevronDown } from 'lucide-react';

const DashboardHeader = ({ full_name, avatarUrl, userRole, onMenuClick }: any) => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogoClick = () => {
    if (userRole === 'admin') navigate('/admin/dashboard');
    else if (userRole === 'teacher') navigate('/teacher/dashboard');
    else navigate('/student/dashboard');
  };

  const roleLabel = userRole === 'admin' ? 'Administrator' : userRole === 'teacher' ? 'Teacher' : 'Student';

  return (
    <div className="fixed top-0 w-full bg-white shadow-sm z-40 px-4 py-3 flex justify-between items-center h-16 border-b border-gray-100">
      
      <div className="flex items-center gap-3">
        {/* 📱 Mobile Hamburger - Hidden on Desktop (lg:hidden) */}
        <button 
          onClick={onMenuClick} 
          className="p-2 hover:bg-gray-100 rounded-lg lg:hidden transition active:scale-95"
        >
          <Menu size={24} className="text-gray-700" />
        </button>

        {/* Brand Logo */}
        <div onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer group">
          <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-white font-black group-hover:bg-black transition-colors shadow-lg shadow-blue-100">
            ASM
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black text-gray-800 leading-none">ADARSH</h1>
            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">SHISHU MANDIR</p>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="relative">
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)} 
          className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-full transition group"
        >
          <div className="text-right hidden sm:block mr-1">
            <p className="text-[11px] font-black text-gray-800 leading-none">{full_name || 'User'}</p>
            <p className="text-[9px] font-black text-blue-500 uppercase mt-0.5">{roleLabel}</p>
          </div>
          <img 
            src={avatarUrl || `https://ui-avatars.com/api/?name=${full_name}&background=1e3a8a&color=fff`} 
            className="w-9 h-9 rounded-full border-2 border-blue-50 shadow-sm" 
            alt="Profile" 
          />
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
        </button>

        {isProfileOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-20 animate-in fade-in slide-in-from-top-2">
              <button 
                onClick={() => { navigate('/profile-setup'); setIsProfileOpen(false); }}
                className="flex w-full items-center gap-2 p-3 hover:bg-blue-50 rounded-xl text-xs font-bold text-gray-700 transition"
              >
                <User size={16} className="text-blue-600" /> My Profile
              </button>
              <button 
                onClick={async () => { await supabase.auth.signOut(); navigate('/'); }}
                className="flex w-full items-center gap-2 p-3 hover:bg-red-50 rounded-xl text-xs font-bold text-red-600 transition mt-1"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
