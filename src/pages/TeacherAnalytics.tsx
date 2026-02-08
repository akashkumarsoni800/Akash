import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

interface AnalyticsData {
  totalStudents: number;
  attendanceRate: number;
  avgMarks: number;
  passPercentage: number;
  topPerformers: number;
  recentActivity: Array<{
    type: string;
    count: number;
    date: string;
  }>;
}

const TeacherAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalStudents: 0, attendanceRate: 0, avgMarks: 0, 
    passPercentage: 0, topPerformers: 0, recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Real-time analytics from Supabase
      const { count: studentCount } = await supabase
        .from('students').select('*', { count: 'exact', head: true });

      const { data: attendanceData } = await supabase
        .from('attendance').select('id', { count: 'exact', head: true });

      const { data: resultData } = await supabase
        .from('student_results').select('marks');

      const passCount = resultData?.filter((r: any) => r.marks >= 40)?.length || 0;
      
      setAnalytics({
        totalStudents: studentCount || 0,
        attendanceRate: Math.round((attendanceData?.length || 0) / 100 * 100) || 0,
        avgMarks: resultData?.length ? Math.round(resultData.reduce((sum: any, r: any) => sum + r.marks, 0) / resultData.length) : 0,
        passPercentage: resultData?.length ? Math.round((passCount / resultData.length) * 100) : 0,
        topPerformers: resultData?.filter((r: any) => r.marks >= 90)?.length || 0,
        recentActivity: []
      });
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-black uppercase tracking-[-0.05em] bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent text-center mb-16">
          📊 Real-time Analytics
        </h1>

        {/* Dynamic Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-white/90 p-10 rounded-3xl shadow-2xl">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-4xl font-black">{analytics.totalStudents}</h3>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold mt-2">Total Students</p>
          </motion.div>

          <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-white/90 p-10 rounded-3xl shadow-2xl" transition={{ delay: 0.1 }}>
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-4xl font-black text-green-600">{analytics.avgMarks}%</h3>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold mt-2">Avg Performance</p>
          </motion.div>

          {/* More dynamic charts... */}
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalytics;
