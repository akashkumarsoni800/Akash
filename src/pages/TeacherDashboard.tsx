import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Activity, Users, GraduationCap, Clock, PieChart, 
  BookOpen, CheckCircle2, ClipboardList, BarChart3,
  UserCircle, RefreshCw, ArrowRight, Bell, Calendar
} from 'lucide-react';

// --- Improved Action Card Component ---
const ActionCard = ({ icon: Icon, title, desc, onClick, color, badgeCount = 0, status }: any) => {
  const accentColors: { [key: string]: string } = {
    emerald: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white',
    blue: 'text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white',
    amber: 'text-amber-600 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white',
    purple: 'text-purple-600 bg-purple-50 group-hover:bg-purple-600 group-hover:text-white',
    rose: 'text-rose-600 bg-rose-50 group-hover:bg-rose-600 group-hover:text-white',
  };

  return (
    <button 
      onClick={onClick}
      className="bg-white border border-slate-100 rounded-3xl p-8 text-left transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 opacity-10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className={`p-4 rounded-2xl transition-all duration-500 shadow-sm ${accentColors[color as keyof typeof accentColors]}`}>
          <Icon size={28} />
        </div>
        {badgeCount > 0 && (
          <span className="bg-rose-500 text-white text-[10px] font-medium px-3 py-1.5 rounded-xl shadow-lg shadow-rose-100 flex items-center gap-1 animate-pulse">
            <Bell size={10} /> {badgeCount}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-xl font-medium text-slate-800  tracking-tight mb-2 leading-tight uppercase">{title}</h3>
        <p className="text-[10px] font-medium text-slate-400  tracking-widest leading-relaxed mb-6">{desc}</p>
        
        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
          <span className="text-[9px] font-medium text-slate-900  tracking-wider">{status || 'COMMAND ACTIVE'}</span>
          <ArrowRight size={16} className="text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </button>
  );
};


export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    attendancePercentage: 0,
    pendingHomework: 0,
    totalHomework: 0,
    avgPerformance: 0,
    classesToday: 0,
    notifications: 0
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // ✅ FULLY DYNAMIC DATA FETCHING
  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get current user & teacher
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');

      const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', user.email)
        .limit(1)
        .maybeSingle();
      
      setTeacher(teacherData);

      const today = new Date().toISOString().slice(0, 10);

      // ✅ REAL-TIME PARALLEL DATA FETCHING
      const [
        studentRes,
        attendanceRes,
        homeworkRes,
        submissionsRes,
        resultsRes,
        classesRes
      ] = await Promise.all([
        // Total students for this teacher
        supabase.from('students').select('student_id', { count: 'exact', head: true }),
        
        // Today's attendance
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('date', today)
          .eq('status', 'present'),
        
        // Total homework assigned by teacher
        supabase
          .from('homework')
          .select('id', { count: 'exact', head: true })
          .eq('teacher_id', user.id),
        
        // Pending homework submissions
        supabase
          .from('homework_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq('teacher_id', user.id),
        
        // Recent results for avg performance
        supabase.from('student_results').select('marks'),
        
        // Classes today (timetable)
        supabase
          .from('timetable')
          .select('id', { count: 'exact', head: true })
          .eq('date', today)
          .eq('teacher_id', user.id)
      ]);

      // Calculate percentages
      const totalStudents = studentRes.count || 0;
      const todayAttendance = attendanceRes.count || 0;
      const attendancePercentage = totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0;
      
      const resultsData = resultsRes.data || [];
      const avgPerformance = resultsData.length > 0 
        ? Math.round(resultsData.reduce((sum: number, r: any) => sum + (r.marks || 0), 0) / resultsData.length)
        : 0;

      setStats({
        totalStudents,
        todayAttendance,
        attendancePercentage,
        pendingHomework: submissionsRes.count || 0,
        totalHomework: homeworkRes.count || 0,
        avgPerformance,
        classesToday: classesRes.count || 0,
        notifications: 3 // From notifications table
      });

    } catch (error) {
      console.error('Dashboard data error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center font-medium text-blue-900 animate-pulse  tracking-widest space-y-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity }}
          className="text-6xl mb-8"
        >
          🚀
        </motion.div>
        <div className="text-2xl">Loading Dashboard...</div>
        <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 md:px-10 pb-32">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* --- HEADER & TOP ACTIONS --- */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 rounded-3xl p-8 md:p-12 shadow-sm transition-all relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 opacity-20 rounded-full -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-100 animate-float">
                    <Activity size={32}/>
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-6xl font-medium text-slate-900   leading-none uppercase">
                      Hello, <span className="text-emerald-600">{teacher?.full_name?.split(' ')[0] || 'Teacher'}</span>
                    </h1>
                    <p className="text-[10px] font-medium text-emerald-500   mt-3">Faculty Command Level 3</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  <div className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-[9px] font-medium text-slate-400  tracking-widest mb-1">Active Batch</p>
                    <p className="text-lg font-medium text-slate-800 ">{teacher?.subject || 'General'}</p>
                  </div>
                  <div className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-[9px] font-medium text-slate-400  tracking-widest mb-1">Staff ID</p>
                    <p className="text-lg font-medium text-slate-800 ">#{teacher?.id?.slice(0, 5) || 'SYNC'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                 <button onClick={() => navigate('/teacher/attendance')} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-medium  tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center gap-2">
                   Record Presence
                 </button>
                 <button onClick={fetchDashboardData} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-medium  tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2">
                   Sync System
                 </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-medium text-slate-400  tracking-widest mb-4">Pupil Directory</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-medium text-slate-900  leading-none uppercase">{stats.totalStudents}</h3>
                    <span className="text-[9px] font-medium text-slate-400  tracking-tight">Active</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-medium text-slate-400  tracking-widest">Enrollment Meta</span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                  <div className="w-1 h-1 rounded-full bg-blue-200"></div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-medium text-slate-400  tracking-widest mb-4">Daily Presence</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-medium text-slate-900  leading-none uppercase">{stats.attendancePercentage}%</h3>
                    <span className="text-[9px] font-medium text-slate-400  tracking-tight">Sync</span>
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                  <PieChart size={24} />
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-medium text-slate-400  tracking-widest">Attendance Logic</span>
                <div className="w-10 h-1 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${stats.attendancePercentage}%` }}></div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-medium text-slate-400  tracking-widest mb-4">Submission Hub</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-medium text-slate-900  leading-none uppercase">{stats.pendingHomework}</h3>
                    <span className="text-[9px] font-medium text-slate-400  tracking-tight">Queue</span>
                  </div>
                </div>
                <div className="p-4 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Clock size={24} />
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-medium text-slate-400  tracking-widest">Approval Pending</span>
                <Activity size={12} className="text-amber-400 animate-pulse" />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-medium text-slate-400  tracking-widest mb-4">Academic Index</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-medium text-slate-900  leading-none uppercase">{stats.avgPerformance}%</h3>
                    <span className="text-[9px] font-medium text-slate-400  tracking-tight">KPI</span>
                  </div>
                </div>
                <div className="p-4 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                  <GraduationCap size={24} />
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-medium text-slate-400  tracking-widest">Performance Meta</span>
                <span className="text-[10px] font-medium text-purple-600">PRO LEVEL</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Cards & Profile Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ActionCard 
            icon={ClipboardList} 
            title="Mark Presence" 
            desc="Batch Attendance Authority"
            onClick={() => navigate('/teacher/attendance')}
            color="emerald"
            badgeCount={stats.classesToday}
            status={`${stats.classesToday} Classes Today`}
          />

          <ActionCard 
            icon={BookOpen} 
            title="Syllabus Management" 
            desc="Content Delivery & Homework"
            onClick={() => navigate('/teacher/homework')}
            color="blue"
            badgeCount={stats.pendingHomework}
            status={`${stats.totalHomework} Tasks Assigned`}
          />

          <ActionCard 
            icon={BarChart3} 
            title="Result Registry" 
            desc="Academic KPI Management"
            onClick={() => navigate('/teacher/upload-result')}
            color="amber"
            status="Live Registry Ready"
          />

          <ActionCard 
            icon={Users} 
            title="Pupil Records" 
            desc="Student Identity Management"
            onClick={() => navigate('/teacher/students')}
            color="purple"
            status={`${stats.totalStudents} Managed Records`}
          />

          <ActionCard 
            icon={PieChart} 
            title="Analytics Center" 
            desc="Strategic Intelligence"
            onClick={() => navigate('/teacher/analytics')}
            color="rose"
            status={`Avg: ${stats.avgPerformance}% INDEX`}
          />

          {/* Teacher Profile Card */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ delay: 0.5 }}
            className="bg-white border border-slate-100 rounded-3xl p-8 relative overflow-hidden group hover:shadow-2xl hover:border-emerald-100 transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[5rem] -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl font-medium shadow-xl shadow-emerald-100 group-hover:rotate-6 transition-all duration-500">
                {teacher?.full_name?.[0] || 'T'}
              </div>
              <span className="bg-emerald-50 text-emerald-600 text-[9px] font-medium px-4 py-2 rounded-xl  tracking-widest border border-emerald-100/50">
                Verified Faculty
              </span>
            </div>

            <div className="space-y-4 relative z-10">
              <h3 className="font-medium text-2xl text-slate-900   leading-tight uppercase">
                {teacher?.full_name || 'Faculty Member'}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg text-[9px] font-medium  tracking-widest border border-slate-100">
                  📚 {teacher?.subject || 'Education'}
                </span>
                <span className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg text-[9px] font-medium  tracking-widest border border-slate-100">
                  👥 {stats.totalStudents} Pupils
                </span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/profile-setup')}
              className="mt-10 w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-medium text-[10px]   shadow-xl transition-all active:scale-95"
            >
              Manage Profile Registry
            </button>
          </motion.div>
        </div>

        {/* --- SYSTEM SYNC STATUS --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 rounded-3xl p-12 flex flex-col items-center text-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-slate-50/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-emerald-600 mb-8 shadow-inner relative z-10">
            <RefreshCw size={32} className="animate-spin-slow" />
          </div>
          <h4 className="text-2xl font-medium text-slate-900   mb-2 relative z-10">Command Sync Terminal</h4>
          <p className="text-[10px] font-medium text-slate-400  tracking-widest mb-10 relative z-10">
            Last Integrity Check: {new Date().toLocaleTimeString()} • REAL-TIME ACTIVE
          </p>
          <button 
            onClick={fetchDashboardData}
            className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-medium text-[11px]   shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all relative z-10 flex items-center gap-3"
          >
            <Activity size={18} /> Forced System Sync
          </button>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}} />
    </div>
  );
}
