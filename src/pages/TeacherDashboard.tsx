import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from '../components/DashboardHeader';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('teachers').select('*').eq('email', user.email).maybeSingle();
        setTeacher(data);
      }
    };
    getProfile();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-blue-900 text-white hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-blue-800 flex items-center gap-3">
          <span className="text-3xl">🏫</span>
          <h1 className="font-black tracking-tighter text-xl">ASM PORTAL</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <Link to="/teacher/dashboard" className="block p-3 bg-blue-800 rounded-xl font-bold">🏠 Dashboard</Link>
          <Link to="/teacher/attendance" className="block p-3 hover:bg-blue-800 rounded-xl transition">📅 Daily Attendance</Link>
          <Link to="/teacher/upload-result" className="block p-3 hover:bg-blue-800 rounded-xl transition">📊 Upload Marks</Link>
          <Link to="/student/profile-setup" className="block p-3 hover:bg-blue-800 rounded-xl transition">👤 My Profile</Link>
        </nav>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1">
        <DashboardHeader userName={teacher?.full_name} userRole="Teacher" avatarUrl={teacher?.avatar_url} />
        
        <div className="pt-24 p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-800 uppercase">Teacher Panel</h2>
            <p className="text-gray-500">Welcome, {teacher?.full_name || 'Teacher'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div onClick={() => navigate('/teacher/attendance')} className="bg-white p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all">
              <span className="text-4xl block mb-4">📝</span>
              <h3 className="font-black text-xl text-blue-900">Take Attendance</h3>
              <p className="text-sm text-gray-400 mt-2 font-bold">Mark daily P/A status</p>
            </div>

            <div onClick={() => navigate('/teacher/upload-result')} className="bg-white p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-green-500 cursor-pointer transition-all">
              <span className="text-4xl block mb-4">📤</span>
              <h3 className="font-black text-xl text-green-700">Upload Marks</h3>
              <p className="text-sm text-gray-400 mt-2 font-bold">Submit student results</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
