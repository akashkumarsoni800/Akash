import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface HeaderProps {
  userName: string;
  userRole: string;
}


          
             const DashboardHeader = ({ userName, userRole, avatarUrl }: { userName: string; userRole: string; avatarUrl?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0 shadow-sm">
      <div className="px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
             <span className="text-xl font-bold text-blue-900">🏫 ASM</span>
          </div>

          <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 focus:outline-none group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800 leading-none">{userName}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>

              {/* 🖼️ Profile Image Logic */}
              <div className="w-10 h-10 bg-blue-600 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm group-hover:border-blue-500 transition-all">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-20 py-1">
                  <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-bold text-gray-800">{userName}</p>
                    <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                  </div>
                  
                  <button
                    onClick={() => { navigate('/profile-setup'); setIsOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    👤 My Profile
                  </button>

                  <button
                    onClick={() => { navigate('/reset-password'); setIsOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium flex items-center gap-2"
                  >
                    🔑 Change Password
                  </button>

                  <hr className="my-1 border-gray-100" />

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold flex items-center gap-2"
                  >
                    🚪 Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardHeader;
