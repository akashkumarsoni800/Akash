import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

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

  if (loading) return <div className="p-10 text-center font-bold">Loading Teacher Panel...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase">Teacher Dashboard</h1>
          <p className="text-sm text-gray-500 font-bold">Manage your class and students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attendance Action */}
        <div 
          onClick={() => navigate('/teacher/attendance')}
          className="bg-white p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all group"
        >
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:bg-blue-100 transition">📅</div>
          <h3 className="font-black text-xl text-gray-800">Daily Attendance</h3>
          <p className="text-sm text-gray-400 mt-2">Mark student presence for today</p>
        </div>

        {/* Marks Upload Action */}
        <div 
          onClick={() => navigate('/teacher/upload-result')}
          className="bg-white p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-green-500 cursor-pointer transition-all group"
        >
          <div className="bg-green-50 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:bg-green-100 transition">📊</div>
          <h3 className="font-black text-xl text-gray-800">Upload Marks</h3>
          <p className="text-sm text-gray-400 mt-2">Enter exam scores for your subjects</p>
        </div>

        {/* Profile Info */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4">👤</div>
          <h3 className="font-black text-xl text-gray-800">{teacher?.full_name || 'Teacher'}</h3>
          <p className="text-sm text-gray-400 mt-2 uppercase font-bold tracking-tighter">Subject: {teacher?.subject || 'General'}</p>
        </div>
      </div>
    </div>
  );
}
