import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

// props में अब हमने full_name ही इस्तेमाल किया है
const DashboardHeader = ({ full_name, userRole, avatarUrl, onMenuClick }: { full_name: string; userRole: string; avatarUrl?: string; onMenuClick?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { 
      toast.error("Logout failed"); 
    } else { 
      toast.success("Logged out successfully"); 
      navigate('/'); 
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0 shadow-sm h-16">
      <div className="px-4 h-full flex items-center justify-between">

        <div className="flex items-center gap-3">
          {/* ☰ Hamburger Button: ये Sidebar खोलेगा */}
          <button 
            onClick={onMenuClick} 
            className="p-2 hover:bg-gray-100 rounded-lg text-2xl text-gray-600 focus:outline-none"
          >
            ☰
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(-1)}>
             <span className="text-xl font-bold text-blue-900">🏫 ASM</span>
          </div>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 focus:outline-none group">
            <div className="text-right hidden sm:block">
              {/* ✅ यहाँ full_name का इस्तेमाल किया है */}
              <p className="text-sm font-bold text-gray-800 leading-none">{full_name || "User"}</p>
              <p className="text-[10px] text-gray-500 uppercase mt-1">{userRole}</p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold bg-blue-900">
                  {/* ✅ यहाँ भी full_name से पहला अक्षर लिया है */}
                  {full_name ? full_name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>
          </button>

          {isOpen && (
            <>
              {/* बाहर क्लिक करने पर मेनू बंद करने के लिए */}
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-20 py-1">
                <button 
                  onClick={() => { navigate('/profile-setup'); setIsOpen(false); }} 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  👤 My Profile
                </button>
                <button 
                  onClick={() => { navigate('/reset-password'); setIsOpen(false); }} 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  🔑 Change Password
                </button>
                <hr className="my-1 border-gray-100" />
                <button 
                  onClick={handleLogout} 
                  className="w-full text-left px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-50"
                >
                  🚪 Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DashboardHeader;
