import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Menu, LogOut, User, ChevronDown } from 'lucide-react';

const DashboardHeader = ({ full_name, avatarUrl, userRole, onMenuClick }: any) => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // ASM Logo Click Logic - Sahi dashboard par bhejne ke liye
  const handleLogoClick = () => {
    if (userRole === 'admin') navigate('/admin/dashboard');
    else if (userRole === 'teacher') navigate('/teacher/dashboard');
    else navigate('/student/dashboard');
  };

  // ✅ Role dikhane ka logic: Agar DB se 'admin' hai to Administrator dikhao
  const roleLabel = userRole === 'admin' ? 'Administrator' : userRole === 'teacher' ? 'Teacher' : 'Student';

  return (
    <div className="fixed top-0 w-full bg-white shadow-sm z-40 px-4 py-3 flex justify-between items-center h-16 border-b border-gray-100">
      
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="p-2 hover:bg-gray-100 rounded-lg md:hidden">
          <Menu size={24} className="text-gray-700" />
        </button>
        {/* ✅ ASM Logo Click Fix */}
        <div onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer group">
          <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-white font-black group-hover:bg-black transition-colors">
            ASM
          </div>
          <div>
            <h1 className="text-sm font-black text-gray-800 leading-none">ADARSH</h1>
            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">SHISHU MANDIR</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-full transition">
          <div className="text-right hidden sm:block mr-1">
            <p className="text-[11px] font-black text-gray-800 leading-none">{full_name}</p>
            {/* ✅ Role Display Fix */}
            <p className="text-[9px] font-black text-blue-500 uppercase mt-0.5">{roleLabel}</p>
          </div>
          <img src={avatarUrl || `https://ui-avatars.com/api/?name=${full_name}&background=1e3a8a&color=fff`} className="w-9 h-9 rounded-full border-2 border-blue-50 shadow-sm" alt="Profile" />
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {/* Dropdown Menu (Logout/Profile link yahan aayenge)... */}
      </div>
    </div>
  );
};

export default DashboardHeader;
