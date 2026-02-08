import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface AnalyticsData {
  totalStudents: number;
  attendanceRate: number;
  avgMarks: number;
  passPercentage: number;
  topPerformers: number;
  lowAttendance: number;
}

const TeacherAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalStudents: 120,
    attendanceRate: 94.5,
    avgMarks: 82.3,
    passPercentage: 89.2,
    topPerformers: 28,
    lowAttendance: 8
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'term'>('month');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-black uppercase tracking-[-0.05em] bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-6">
            Analytics Dashboard
          </h1>
          <p className="text-xl text-gray-600 font-semibold max-w-2xl mx-auto">Real-time insights into student performance and attendance</p>
        </motion.div>

        {/* Period Selector */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/70 backdrop-blur-xl p-4 rounded-3xl shadow-xl border border-white/50 flex gap-2">
            {['week', 'month', 'term'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period as any)}
                className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 ${
                  selectedPeriod === period
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/25'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-lg'
                }`}
              >
                {period.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-white/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/50 group hover:shadow-3xl hover:-translate-y-2 transition-all duration-500">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-4xl font-black text-gray-900 mb-2">{analytics.totalStudents}</h3>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Total Students</p>
          </motion.div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
            className="bg-white/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/50 group hover:shadow-3xl hover:-translate-y-2 transition-all duration-500">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-4xl font-black text-green-600 mb-2">{analytics.attendanceRate}%</h3>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Avg Attendance</p>
          </motion.div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}
            className="bg-white/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/50 group hover:shadow-3xl hover:-translate-y-2 transition-all duration-500">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-4xl font-black text-purple-600 mb-2">{analytics.passPercentage}%</h3>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Pass Rate</p>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Performance Chart */}
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="bg-white/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/50">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-8">Performance Distribution</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl">
                <span className="text-lg font-bold text-gray-700">A+ Grade (90+)</span>
                <div className="w-48 bg-green-400 h-4 rounded-xl animate-pulse"></div>
              </div>
              <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl">
                <span className="text-lg font-bold text-gray-700">A Grade (80-89)</span>
                <div className="w-40 bg-blue-400 h-4 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </motion.div>

          {/* Attendance Trend */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            className="bg-white/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/50">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-8">Attendance Trend</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-500 uppercase tracking-wide font-bold">Mon</div>
              <div className="h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
              <div className="flex justify-between text-sm text-gray-500 uppercase tracking-wide font-bold">Fri</div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <button className="group bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white p-8 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            📊 Detailed Report
          </button>
          <button className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-8 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            📈 Compare Classes
          </button>
          <button className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-8 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            🎯 Top Performers
          </button>
          <button className="group bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white p-8 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            ⚠️ Risk Students
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherAnalytics;
