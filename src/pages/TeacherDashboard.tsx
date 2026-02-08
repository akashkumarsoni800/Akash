import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

interface Stats {
  totalStudents: number;
  todayAttendance: number;
  pendingHomework: number;
  classesToday: number;
  avgPerformance: number;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0, todayAttendance: 0, pendingHomework: 0, 
    classesToday: 0, avgPerformance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');

      // Teacher info
      const { data: teacherData } = await supabase
        .from('teachers').select('*').eq('email', user.email).single();
      setTeacher(teacherData);

      // DYNAMIC STATS - REAL SUPABASE DATA
      const today = new Date().toISOString().slice(0, 10);
      
      // Total students assigned to teacher
      const { count: studentCount } = await supabase
        .from('students').select('*', { count: 'exact', head: true })
        .eq('class_teacher_id', teacherData?.id);

      // Today's attendance
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherData?.id)
        .gte('date', today);

      // Pending homework submissions
      const { count: pendingHW } = await supabase
        .from('homework_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherData?.id)
        .eq('status', 'pending');

      // Classes today
      const { count: classesToday } = await supabase
        .from('timetable')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherData?.id)
        .eq('date', today);

      // Average performance
      const { data: performanceData } = await supabase
        .from('student_results')
        .select('marks')
        .eq('teacher_id', teacherData?.id);

      const avgPerformance = performanceData?.length 
        ? Math.round(performanceData.reduce((sum: any, r: any) => sum + r.marks, 0) / performanceData.length)
        : 0;

      setStats({
        totalStudents: studentCount || 0,
        todayAttendance: attendanceCount || 0,
        pendingHomework: pendingHW || 0,
        classesToday: classesToday || 0,
        avgPerformance: avgPerformance || 0
      });
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-12">
        {/* Welcome Banner */}
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-[3rem] p-10 md:p-16 text-white mb-12 shadow-2xl relative overflow-hidden">
            <h1 className="text-5xl md:text-7xl font-black mt-6 tracking-[-0.05em] uppercase bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Welcome, {teacher?.full_name?.split(' ')[0]}!
            </h1>
          </div>
        </motion.div>

        {/* ✅ DYNAMIC STATS - REAL DATA */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 hover:shadow-2xl">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-3xl font-black">{stats.totalStudents}</h3>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Total Students</p>
          </motion.div>

          <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-white p-8 rounded-3xl shadow-xl border border-green-100 hover:shadow-2xl" transition={{ delay: 0.1 }}>
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-3xl font-black text-green-600">
              {stats.todayAttendance > 0 ? Math.round((stats.todayAttendance / stats.totalStudents) * 100) : 0}%
            </h3>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Today's Attendance</p>
          </motion.div>

          <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-white p-8 rounded-3xl shadow-xl border border-orange-100 hover:shadow-2xl" transition={{ delay: 0.2 }}>
            <div className="text-3xl mb-4">✏️</div>
            <h3 className="text-3xl font-black text-orange-600">{stats.pendingHomework}</h3>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Pending HW</p>
          </motion.div>

          <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-white p-8 rounded-3xl shadow-xl border border-purple-100 hover:shadow-2xl" transition={{ delay: 0.3 }}>
            <div className="text-3xl mb-4">📚</div>
            <h3 className="text-3xl font-black text-purple-600">{stats.classesToday}</h3>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Classes Today</p>
          </motion.div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <motion.div whileHover={{ scale: 1.02 }} className="group bg-white p-10 rounded-3xl shadow-xl border-2 border-transparent hover:border-blue-200 cursor-pointer hover:shadow-2xl transition-all duration-500" onClick={() => navigate('/teacher/attendance')}>
            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">📅</div>
            <h3 className="text-2xl font-black mb-3 group-hover:text-blue-600">Mark Attendance</h3>
            <p className="text-gray-600 font-semibold">{stats.todayAttendance} students marked today</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="group bg-white p-10 rounded-3xl shadow-xl border-2 border-transparent hover:border-purple-200 cursor-pointer hover:shadow-2xl transition-all duration-500" onClick={() => navigate('/teacher/homework')}>
            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">📝</div>
            <h3 className="text-2xl font-black mb-3 group-hover:text-purple-600">{stats.pendingHomework} Pending</h3>
            <p className="text-gray-600 font-semibold">Homework assignments</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="group bg-white p-10 rounded-3xl shadow-xl border-2 border-transparent hover:border-green-200 cursor-pointer hover:shadow-2xl transition-all duration-500" onClick={() => navigate('/teacher/students')}>
            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">👥</div>
            <h3 className="text-2xl font-black mb-3 group-hover:text-green-600">{stats.totalStudents}</h3>
            <p className="text-gray-600 font-semibold">Manage students</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="group bg-white p-10 rounded-3xl shadow-xl border-2 border-transparent hover:border-indigo-200 cursor-pointer hover:shadow-2xl transition-all duration-500" onClick={() => navigate('/teacher/analytics')}>
            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">📈</div>
            <h3 className="text-2xl font-black mb-3 group-hover:text-indigo-600">{stats.avgPerformance}%</h3>
            <p className="text-gray-600 font-semibold">Class performance</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="group bg-white p-10 rounded-3xl shadow-xl border-2 border-transparent hover:border-orange-200 cursor-pointer hover:shadow-2xl transition-all duration-500" onClick={() => navigate('/teacher/upload-result')}>
            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="text-2xl font-black mb-3 group-hover:text-orange-600">Upload Results</h3>
            <p className="text-gray-600 font-semibold">Enter exam marks</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
