0import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Menu, LogOut, User, ChevronDown, ShieldCheck, GraduationCap } from 'lucide-react';

// Props:
// 1. full_name, role, avatarUrl -> Data dikhane ke liye
// 2. onMenuClick -> Sidebar kholne ka signal dene ke liye
const DashboardHeader = ({ full_name, userRole, avatarUrl, onMenuClick }: any) => {
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="fixed top-0 w-full bg-white/95 backdrop-blur-md shadow-sm z-40 px-4 md:px-6 py-3 border-b border-gray-100 flex justify-between items-center h-16">
      
      {/* 🟢 LEFT SIDE: HAMBURGER & LOGO */}
      <div className="flex items-center gap-3">
        
        {/* HAMBURGER BUTTON (Mobile Only) */}
        {/* Is par click karne se Sidebar.tsx ka function chalega */}
        <button 
          className="md:hidden p-2 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl active:scale-95 transition border border-gray-200" 
          onClick={onMenuClick} 
        >
          <Menu size={24} />
        </button>

        {/* LOGO */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(0)}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-blue-200 shadow-lg">
            ASM
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-800 leading-none">ADARSH</h1>
            <p className="text-[10px] font-bold text-blue-500 tracking-wider">SHISHU MANDIR</p>
          </div>
        </div>
      </div>

      {/* 🟢 RIGHT SIDE: PROFILE DROPDOWN ONLY */}
      <div className="relative">
        
        {/* Profile Trigger Button */}
        <button 
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className="flex items-center gap-2 md:gap-3 p-1.5 pr-3 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-100 transition cursor-pointer"
        >
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-gray-800">{full_name || 'User'}</p>
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-wide bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full inline-block">
              {userRole}
            </button>
          </div>
          
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100">
             <img 
               src={avatarUrl || `https://ui-avatars.com/api/?name=${full_name}&background=random`} 
               className="w-full h-full object-cover" 
               alt="Profile"
             />
          </div>
          <ChevronDown size={16} className="text-gray-400 hidden md:block" />
        </button>

        {/* 🔻 ACTUAL DROPDOWN (Logout & Edit Profile) */}
        {isProfileDropdownOpen && (
          <>
            {/* Backdrop to close when clicking outside */}
            <div className="fixed inset-0 z-30 cursor-default" onClick={() => setIsProfileDropdownOpen(false)} />
            
            {/* The Menu Box */}
            <div className="absolute right-0 top-14 w-56 bg-white shadow-2xl rounded-2xl border border-gray-100 p-2 z-40 animate-in fade-in slide-in-from-top-2 origin-top-right">
              
              {/* Mobile Info (Only visible on mobile inside dropdown) */}
              <div className="px-3 py-3 border-b border-gray-50 mb-1 md:hidden bg-gray-50 rounded-xl">
                <p className="text-sm font-bold text-gray-800">{full_name}</p>
                <div className="flex items-center gap-1 mt-1">
                   {userRole === 'Administrator' ? <ShieldCheck size={12} className="text-purple-500"/> : <GraduationCap size={12} className="text-green-500"/>}
                   <p className="text-[10px] font-black text-gray-500 uppercase">{userRole}</p>
                </div>
              </div>
              
              <button 
                onClick={() => { setIsProfileDropdownOpen(false); navigate('/profile-setup'); }} 
                className="flex w-full items-center gap-3 p-3 hover:bg-blue-50 rounded-xl text-xs font-bold text-gray-700 transition"
              >
                <User size={18} className="text-blue-600" /> Edit Profile
              </button>
              
              <div className="h-px bg-gray-100 my-1"></div>

              <button 
                onClick={handleLogout} 
                className="flex w-full items-center gap-3 p-3 hover:bg-red-50 rounded-xl text-xs font-bold text-red-600 transition"
              >
                <LogOut size={18} /> Logout Session
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default DashboardHeader;
