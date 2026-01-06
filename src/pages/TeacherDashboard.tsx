import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// --- UI Stat Card Component ---
const ActionCard = ({ icon, title, desc, onClick, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 hover:border-blue-500',
    green: 'bg-green-50 text-green-600 hover:border-green-500',
    purple: 'bg-purple-50 text-purple-600 hover:border-purple-500',
  };
  return (
    <div 
      onClick={onClick}
      className={`bg-white p-8 rounded-[2rem] shadow-sm border-2 border-transparent cursor-pointer transition-all group ${colors[color]}`}
    >
      <div className={`${colors[color].split(' ')[0]} w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition`}>
        {icon}
      </div>
      <h3 className="font-black text-xl text-gray-800 uppercase tracking-tight">{title}</h3>
      <p className="text-sm text-gray-400 mt-2 font-medium">{desc}</p>
    </div>
  );
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacher = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');

      const { data } = await supabase.from('teachers')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      setTeacher(data);
      setLoading(false);
    };
    fetchTeacher();
  }, [navigate]);

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-blue-900 animate-pulse uppercase tracking-widest">ASM Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-blue-900 rounded-[2.5rem] p-8 md:p-12 text-white mb-10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-blue-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-400/30">Teacher Panel</span>
          <h1 className="text-4xl md:text-5xl font-black mt-4 tracking-tighter uppercase">
            Hello, {teacher?.full_name?.split(' ')[0] || 'Teacher'}!
          </h1>
          <p className="text-blue-100/70 mt-2 font-bold italic">"Teaching is the one profession that creates all other professions."</p>
        </div>
        {/* Abstract Background Decoration */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute right-10 bottom-0 text-9xl opacity-10 font-black select-none">🏫</div>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        <ActionCard 
          icon="📅" 
          title="Attendance" 
          desc="Mark daily presence for your assigned classes."
          onClick={() => navigate('/teacher/attendance')}
          color="blue"
        />

        <ActionCard 
          icon="📊" 
          title="Upload Result" 
          desc="Enter exam marks and generate student reports."
          onClick={() => navigate('/teacher/upload-result')}
          color="green"
        />

        {/* Teacher Info Card */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl">👤</div>
            <span className="bg-purple-100 text-purple-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase">Profile info</span>
          </div>
          <div className="mt-6">
            <h3 className="font-black text-2xl text-gray-800 uppercase tracking-tighter leading-none">{teacher?.full_name}</h3>
            <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-widest">{teacher?.subject || 'Class Teacher'}</p>
          </div>
          <button 
            onClick={() => navigate('/profile-setup')}
            className="mt-6 w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl font-black text-xs uppercase tracking-widest transition"
          >
            Edit Profile
          </button>
        </div>

      </div>

      {/* Notice Board Preview (Optional) */}
      <div className="mt-10 bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
        <h3 className="font-black text-gray-800 uppercase text-sm mb-4 flex items-center gap-2">
           <span className="text-xl">📢</span> Latest School Notices
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-2xl border-l-4 border-blue-900">
             <p className="text-sm font-bold text-gray-800">Final Exam Schedule is out!</p>
             <p className="text-[10px] text-gray-400 uppercase mt-1">Posted by Admin • 2 hours ago</p>
          </div>
        </div>
      </div>

    </div>
  );
}
