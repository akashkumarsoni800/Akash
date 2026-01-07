import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Menu, X, LogOut, User, LayoutDashboard, ShieldCheck, GraduationCap } from 'lucide-react';

const DashboardHeader = ({ full_name, avatarUrl }: any) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // ✅ Role State
  const [realRole, setRealRole] = useState('Checking...');
  const [homeLink, setHomeLink] = useState('#');

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Teacher Table Check
      const { data: teacher } = await supabase
        .from('teachers')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (teacher) {
        if (teacher.role === 'admin') {
          setRealRole('Administrator');
          setHomeLink('/admin/dashboard');
        } else {
          setRealRole('Teacher');
          setHomeLink('/teacher/dashboard');
        }
      } else {
        setRealRole('Student');
        setHomeLink('/student/dashboard');
      }
    };
    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="fixed top-0 w-full bg-white/95 backdrop-blur-md shadow-sm z-50 px-4 md:px-6 py-3 border-b border-gray-100">
      <div className="flex justify-between items-center">
        
        {/* ✅ LEFT SECTION: Hamburger + Logo */}
        <div className="flex items-center gap-3 md:gap-4">
          
          {/* 1. MOBILE HAMBURGER (Left Side) */}
          <button 
            className="md:hidden p-2 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl active:scale-95 transition" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* 2. BRAND LOGO (Next to Hamburger) */}
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => navigate(homeLink)}
          >
            <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-blue-200 shadow-lg group-hover:scale-105 transition">
              ASM
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black text-gray-800 leading-none">ADARSH</h1>
              <p className="text-[9px] md:text-[10px] font-bold text-blue-500 tracking-wider">SHISHU MANDIR</p>
            </div>
          </div>
        </div>

        {/* ✅ RIGHT SECTION: Desktop Profile Only */}
        <div className="hidden md:flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800">{full_name || 'User'}</p>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              realRole === 'Administrator' ? 'bg-purple-100 text-purple-600' :
              realRole === 'Student' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {realRole}
            </span>
          </div>
          <div className="w-11 h-11 rounded-full bg-gray-100 p-0.5 border border-gray-200 overflow-hidden cursor-pointer hover:ring-2 ring-blue-100 transition">
             <img src={avatarUrl || `https://ui-avatars.com/api/?name=${full_name}`} className="w-full h-full object-cover rounded-full" />
          </div>
        </div>

      </div>

      {/* ✅ MOBILE MENU DROPDOWN (Left Side Alignment) */}
      {isMenuOpen && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsMenuOpen(false)} />
          
          {/* Menu Box - Now aligned to LEFT (left-4) */}
          <div className="absolute top-16 left-4 w-72 bg-white shadow-2xl rounded-2xl border border-gray-100 p-5 flex flex-col gap-2 z-50 animate-in fade-in slide-in-from-left-5">
              
              {/* Profile Info inside Menu */}
              <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                  <img src={avatarUrl || `https://ui-avatars.com/api/?name=${full_name}`} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-800">{full_name || 'User'}</p>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{realRole}</p>
                </div>
              </div>

              {/* Links */}
              <button 
                onClick={() => { setIsMenuOpen(false); navigate(homeLink); }} 
                className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl text-gray-700 font-bold text-sm transition"
              >
                <LayoutDashboard size={20} className="text-blue-600" />
                Dashboard
              </button>

              <button 
                onClick={() => { setIsMenuOpen(false); navigate('/profile-setup'); }} 
                className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl text-gray-700 font-bold text-sm transition"
              >
                <User size={20} className="text-blue-600" />
                Edit Profile
              </button>

              <button 
                onClick={handleLogout} 
                className="flex items-center gap-3 p-3 hover:bg-red-50 text-red-600 rounded-xl font-bold text-sm mt-2 border-t border-gray-50 transition"
              >
                <LogOut size={20} />
                Logout
              </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHeader;
