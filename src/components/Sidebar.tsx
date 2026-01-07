import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import { 
  X, LayoutDashboard, FileText, CreditCard, Calendar, 
  UserPlus, Users, ClipboardList, ShieldCheck 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: 'User', avatar: '', role: '' });

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) setLoading(false);
          return;
        }

        let fullName = user.email?.split('@')[0]; 
        let avatar = '';
        let detectedRole = 'student'; // Default

        // 1. Check Teachers/Admin Table
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('full_name, avatar_url, role')
          .eq('email', user.email)
          .maybeSingle();

        if (teacherData) { 
          fullName = teacherData.full_name; 
          avatar = teacherData.avatar_url;
          // ✅ DB se jo role mile wahi use karo
          detectedRole = teacherData.role; 
        } else {
          // 2. Check Students Table
          const { data: studentData } = await supabase
            .from('students')
            .select('full_name, avatar_url')
            .eq('email', user.email)
            .maybeSingle();
          if (studentData) { 
            fullName = studentData.full_name; 
            avatar = studentData.avatar_url; 
            detectedRole = 'student';
          }
        }

        if (isMounted) {
          setProfile({ name: fullName || 'User', avatar, role: detectedRole });
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, []); // ⚠️ Khali array matlab loop nahi chalega

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">ASM Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader 
        full_name={profile.name} 
        userRole={profile.role} // ✅ Ab ye 'admin' ya 'student' sahi jayega
        avatarUrl={profile.avatar}
        onMenuClick={() => setIsOpen(true)} 
      />

      {/* Sidebar Overlay and Drawer Code same rahega... */}
      {/* ... (Menu Links based on profile.role) ... */}
      
      <main className="flex-1 pt-20 p-4 w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
