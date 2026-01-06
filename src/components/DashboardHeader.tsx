import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Menu, X, LogOut, User, LayoutDashboard } from 'lucide-react';

// Props receive kar rahe hain (par hum andar dubara check karenge accuracy ke liye)
const DashboardHeader = ({ full_name, avatarUrl }: any) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // ✅ Local State for Accurate Role & Link
  const [displayRole, setDisplayRole] = useState('Loading...');
  const [dashboardLink, setDashboardLink] = useState('#'); // Default empty

  useEffect(() => {
    const fetchUserRole = async () => {
      // 1. Current User nikalo
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Pehle TEACHERS table check karo (ID se)
      const { data: teacher } = await supabase
        .from('teachers')
        .select('role')
        .eq('id', user.id) // ✅ Email ki jagah ID use kiya (Fail-proof)
        .maybeSingle();

      if (teacher) {
        // Agar teacher table me mil gya -> To wo Admin ya Teacher h
        const role = teacher.role === 'admin' ? 'admin' : 'teacher';
        setDisplayRole(role);
        setDashboardLink('/admin/dashboard'); // ✅ Admin Dashboard Link
      } else {
        // Agar teacher me nhi mila -> To wo Student h
        setDisplayRole('student');
        setDashboardLink('/student/dashboard'); // ✅ Student Dashboard Link
      }
    };

    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="fixed top-0 w-full bg-white shadow-sm z-50 px-6 py-4 flex justify-between items-center">
      
      {/* ✅ Brand Logo Click - Ab sahi jagah le jayega */}
      <div 
        className="text-xl font-black text-blue-900 tracking-tighter uppercase cursor-pointer" 
        onClick={() => navigate(dashboardLink)}
      >
        ASM <span className="text-blue-500">SYSTEM</span>
      </div>

      {/* Desktop Profile Section */}
      <div className="hidden md:flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-bold text-gray-800">{full_name || 'User'}</p>
          {/* ✅ Sahi Role Dikhega */}
          <span className="text-[10px] font-black text-blue-500 uppercase bg-blue-50 px-2 py-0.5 rounded-full inline-block">
            {displayRole}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-blue-50">
           <img src={avatarUrl || `https://ui-avatars.com/api/?name=${full_name}`} alt="Profile" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Mobile Hamburger */}
      <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-16 right-4 w-64 bg-white shadow-2xl rounded-2xl border border-gray-100 p-4 flex flex-col gap-2 animate-in fade-in slide-in-from-top-5">
            
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                <img src={avatarUrl || `https://ui-avatars.com/api/?name=${full_name}`} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{full_name}</p>
                <p className="text-[10px] font-black text-blue-500 uppercase">{displayRole}</p>
              </div>
            </div>

            {/* ✅ Dashboard Button with correct link */}
            <button 
              onClick={() => { setIsMenuOpen(false); navigate(dashboardLink); }} 
              className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl text-gray-700 font-bold text-sm transition"
            >
              <LayoutDashboard size={18} className="text-blue-600" />
              Go to Dashboard
            </button>

            <button 
              onClick={() => { setIsMenuOpen(false); navigate('/profile-setup'); }} 
              className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl text-gray-700 font-bold text-sm transition"
            >
              <User size={18} className="text-blue-600" />
              Edit Profile
            </button>

            <button 
              onClick={handleLogout} 
              className="flex items-center gap-3 p-3 hover:bg-red-50 text-red-600 rounded-xl font-bold text-sm transition mt-2 border-t border-gray-50"
            >
              <LogOut size={18} />
              Logout
            </button>
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;
