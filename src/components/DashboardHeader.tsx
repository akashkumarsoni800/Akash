import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Menu, X, LogOut, User, LayoutDashboard, ShieldCheck, GraduationCap } from 'lucide-react';

const DashboardHeader = ({ full_name, avatarUrl }: any) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // ✅ State for Dynamic Role & Link
  const [realRole, setRealRole] = useState('loading...');
  const [homeLink, setHomeLink] = useState('#');

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Check TEACHERS Table (by ID)
      const { data: teacher } = await supabase
        .from('teachers')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (teacher) {
        // Agar Teacher table me hai
        if (teacher.role === 'admin') {
          setRealRole('Administrator');
          setHomeLink('/admin/dashboard');
        } else {
          setRealRole('Teacher');
          setHomeLink('/teacher/dashboard'); // ⚠️ Make sure ye route bana ho
        }
      } else {
        // Agar Teacher nhi h to Student h
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
    <div className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50 px-4 md:px-6 py-3 flex justify-between items-center border-b border-gray-100">
      
      {/* ✅ 1. BRAND LOGO (Fix: Correct Link) */}
      <div 
        className="flex items-center gap-2 cursor-pointer group" 
        onClick={() => navigate(homeLink)}
      >
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-blue-200 shadow-lg group-hover:scale-105 transition">
          ASM
        </div>
        <div className="hidden md:block">
          <h1 className="text-lg font-black text-gray-800 leading-none">ADARSH</h1>
          <p className="text-[10px] font-bold text-blue-500 tracking-wider">SHISHU MANDIR</p>
        </div>
      </div>

      {/* ✅ 2. DESKTOP PROFILE (Hidden on Mobile) */}
      <div className="hidden md:flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-bold text-gray-800">{full_name || 'User'}</p>
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
            realRole === 'Administrator' ? 'bg-purple-100 text-purple-600' :
            realRole === 'Teacher' ? 'bg-blue-100 text-blue-600' :
            'bg-green-100 text-green-600'
          }`}>
            {realRole}
          </span>
        </div>
        <div className="w-11 h-11 rounded-full bg-gray-100 p-0.5 border border-gray-200">
           <img 
             src={avatarUrl || `https://ui-avatars.com/api/?name=${full_name}`} 
             alt="Profile" 
             className="w-full h-full object-cover rounded-full" 
           />
        </div>
      </div>

      {/* ✅ 3. MOBILE HAMBURGER BUTTON */}
      <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg active:scale-95 transition" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* ✅ 4. MOBILE DROPDOWN MENU (Responsive Fix) */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsMenuOpen(false)} />
          
          {/* Menu Content */}
          <div className="absolute top-16 right-4 w-72 bg-white shadow-2xl rounded-2xl border border-gray-100 p-5 flex flex-col gap-2 animate-in fade-in slide-in-from-top-5 z-50">
              
              {/* Mobile Profile Info */}
              <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shadow-inner">
                  <img src={avatarUrl || `https://ui-avatars.com/api/?name=${full_name}`} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-800">{full_name}</p>
                  <p className="text-xs font-bold text-blue-500 uppercase">{realRole}</p>
                </div>
              </div>

              {/* Navigation Links */}
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

              {/* Role Specific Badge (Visual Only) */}
              <div className="px-3 py-2 mt-1 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-2">
                {realRole === 'Administrator' ? <ShieldCheck size={16} className="text-purple-500"/> : <GraduationCap size={16} className="text-green-500"/>}
                <span className="text-xs font-semibold text-gray-500">Logged in as {realRole}</span>
              </div>

              {/* Logout */}
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-3 p-3 hover:bg-red-50 text-red-600 rounded-xl font-bold text-sm transition mt-2 border-t border-gray-50"
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
