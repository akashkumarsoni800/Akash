import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import { toast } from 'sonner';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); 
  const [profile, setProfile] = useState({ name: 'User', avatar: '', role: '' });

  // 1. Role Detection Logic
  const isAdmin = location.pathname.startsWith('/admin');
  const isTeacher = location.pathname.startsWith('/teacher');
  const isStudent = location.pathname.startsWith('/student');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let fullName = user.email?.split('@')[0]; 
      let avatar = '';
      let role = isAdmin ? 'Admin' : (isTeacher ? 'Teacher' : 'Student');

      // 2. Database से नाम और फोटो उठाना (Supabase Integration)
      try {
        if (isStudent) {
          const { data } = await supabase.from('students').select('full_name, avatar_url').eq('email', user.email).maybeSingle();
          if (data) { fullName = data.full_name; avatar = data.avatar_url; }
        } else if (isTeacher || isAdmin) {
          const { data } = await supabase.from('teachers').select('full_name, avatar_url, role').eq('email', user.email).maybeSingle();
          if (data) { 
            fullName = data.full_name; 
            avatar = data.avatar_url;
            if (isAdmin) role = 'Admin';
          }
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }

      setProfile({ name: fullName || 'User', avatar: avatar, role: role });
    };

    fetchProfile();
    setIsOpen(false); // पेज बदलने पर साइडबार खुद बंद हो जाए
  }, [location.pathname, isAdmin, isTeacher, isStudent]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* 🟢 1. DashboardHeader: Hamburger Menu Button यहाँ से कनेक्टेड है */}
      <DashboardHeader 
        full_name={profile.name} 
        userRole={profile.role} 
        avatarUrl={profile.avatar}
        onMenuClick={() => setIsOpen(true)} 
      />

      {/* 🟢 2. Sidebar Drawer (Overlay) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* 🟢 3. Sliding Sidebar Drawer Area */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Top Header (Logo Section) */}
        <div className="h-44 bg-blue-900 flex flex-col items-center justify-center text-white relative">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-4xl mb-2 border-2 border-white/20 shadow-inner">
            {isStudent ? '🎓' : (isTeacher ? '👨‍🏫' : '🔑')}
          </div>
          <p className="font-black tracking-widest uppercase text-sm">ASM Portal</p>
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white text-2xl hover:scale-125 transition">✕</button>
        </div>

        {/* 🟢 4. Dynamic Links based on User Role */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-250px)] font-bold text-gray-600">
          
          <Link to={isAdmin ? "/admin/dashboard" : (isTeacher ? "/teacher/dashboard" : "/student/dashboard")} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname.includes('dashboard') ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50'}`}
          >
             🏠 Dashboard
          </Link>

          {/* Admin Features Section */}
          {isAdmin && (
            <>
              <div className="text-[10px] text-gray-400 uppercase px-4 mt-4 mb-1 tracking-widest">Management</div>
              <Link to="/admin/manage-fees" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl transition-all">💰 Manage Fees</Link>
              <Link to="/admin/create-exam" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl transition-all">📝 Create Exam</Link>
              <Link to="/admin/upload-result" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl transition-all">📤 Upload Result</Link>
              <Link to="/admin/add-student" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl transition-all">🎓 Add Student</Link>
              <Link to="/admin/add-teacher" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl transition-all">👨‍🏫 Add Teacher</Link>
            </>
          )}

          {/* Student Features Section */}
          {isStudent && (
            <>
              <Link to="/student/fees" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">💸 My Fees</Link>
              <Link to="/student/result" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📊 My Result</Link>
              <Link to="/student/notices" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📢 School Notices</Link>
            </>
          )}

          {/* Teacher Features Section */}
          {isTeacher && (
            <>
              <Link to="/teacher/attendance" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📅 Daily Attendance</Link>
              <Link to="/teacher/upload-result" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-xl">📤 Post Marks</Link>
            </>
          )}

          <div className="border-t my-4 opacity-30"></div>
          <Link to="/profile-setup" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">👤 Profile Settings</Link>
        </nav>

        {/* Footer Area with Logout */}
        <div className="absolute bottom-0 w-full p-4 border-t bg-gray-50">
           <button 
             onClick={async () => { 
                await supabase.auth.signOut(); 
                toast.success("Logged out successfully");
                navigate('/'); 
             }} 
             className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition"
           >
             🚪 Logout
           </button>
        </div>
      </div>

      {/* 🟢 5. Main Content Area: यहाँ सारे पेज (Outlet) रेंडर होंगे */}
      <main className="flex-1 pt-16 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
