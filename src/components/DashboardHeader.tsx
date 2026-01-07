import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Menu, LogOut, User, ChevronDown, ShieldCheck, GraduationCap } from 'lucide-react';

interface HeaderProps {
  full_name: string;
  avatarUrl: string;
  userRole: string;
  onMenuClick: () => void;
}

const DashboardHeader = ({ full_name, avatarUrl, userRole, onMenuClick }: HeaderProps) => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Logout Function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Role display logic
  const roleLabel = userRole === 'admin' ? 'Administrator' : userRole === 'teacher' ? 'Teacher' : 'Student';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-40 flex items-center justify-between px-4 md:px-6 shadow-sm">
      
      {/* 🟢 LEFT: HAMBURGER & LOGO */}
      <div className="flex items-center gap-4">
        {/* Hamburger Menu Button - Sirf Sidebar open karne ke liye */}
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-xl transition active:scale-90 md:hidden"
        >
          <Menu size={24} className="text-gray-700" />
        </button>

        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
          <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-100">
            ASM
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black text-gray-800 leading-none uppercase tracking-tighter">Adarsh</h1>
            <p className="text-[9px] font-bold text-blue-600 uppercase">Shishu Mandir</p>
          </div>
        </div>
      </div>

      {/* 🟢 RIGHT: PROFILE DROPDOWN */}
      <div className="relative">
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center gap-3 p-1 hover:bg-gray-50 rounded-full transition group"
        >
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-gray-800">{full_name || 'User'}</p>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{roleLabel}</p>
          </div>
          
          <div className="relative">
            <img 
              src={avatarUrl || `https://ui-avatars.com/api/?name=${full_name}&background=1e3a8a&color=fff`} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover ring-1 ring-gray-100"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* 🔻 PROFILE DROPDOWN MENU */}
        {isProfileOpen && (
          <>
            {/* Overlay to close dropdown when clicking outside */}
            <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
            
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-20 animate-in fade-in slide-in-from-top-2 origin-top-right">
              
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <p className="text-sm font-black text-gray-800 truncate">{full_name}</p>
                <p className="text-[10px] font-bold text-gray-400 truncate">{roleLabel}</p>
              </div>

              {/* Profile Link */}
              <button 
                onClick={() => { navigate('/profile-setup'); setIsProfileOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-3 text-xs font-bold text-gray-700 hover:bg-blue-50 rounded-xl transition"
              >
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <User size={16} />
                </div>
                Edit Profile
              </button>

              <div className="h-px bg-gray-50 my-1"></div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
              >
                <div className="p-2 bg-red-100 text-red-500 rounded-lg">
                  <LogOut size={16} />
                </div>
                Logout Session
              </button>
            </div>
          </>
        )}
      </div>

    </header>
  );
};

export default DashboardHeader;
