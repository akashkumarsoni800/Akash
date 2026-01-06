import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate('/');

        const { data } = await supabase.from('students')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (data) {
          setStudent(data);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [navigate]);

  if (loading) return <div className="p-10 text-center font-bold animate-pulse">Loading Student Panel...</div>;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-8 rounded-3xl text-white shadow-xl">
        <h1 className="text-3xl font-black uppercase tracking-tight">Welcome, {student?.full_name || 'Student'}!</h1>
        <p className="opacity-80 font-medium mt-1">Class: {student?.class_name || 'N/A'} | Roll No: {student?.roll_no || 'Pending'}</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fees Card */}
        <div 
          onClick={() => navigate('/student/fees')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition">💸</div>
          <h3 className="font-black text-gray-800 text-lg">My Fees</h3>
          <p className="text-xs text-gray-400 font-bold uppercase mt-1">Check dues & history</p>
        </div>

        {/* Result Card */}
        <div 
          onClick={() => navigate('/student/result')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition">📊</div>
          <h3 className="font-black text-gray-800 text-lg">Exam Results</h3>
          <p className="text-xs text-gray-400 font-bold uppercase mt-1">View your performance</p>
        </div>

        {/* Notice Card */}
        <div 
          onClick={() => navigate('/student/notices')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition">📢</div>
          <h3 className="font-black text-gray-800 text-lg">Notices</h3>
          <p className="text-xs text-gray-400 font-bold uppercase mt-1">Latest school updates</p>
        </div>
      </div>
    </div>
  );
}
