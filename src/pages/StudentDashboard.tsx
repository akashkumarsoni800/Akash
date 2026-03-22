import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  User, BookOpen, CreditCard, Bell, 
  Calendar, Award, CheckCircle2, AlertCircle,
  ArrowRight, GraduationCap, Clock, Layout
} from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [stats, setStats] = useState({
    attendance: 0,
    pendingFees: 0,
    activeHomework: 0,
    notices: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate('/');

        // 1. Fetch Student Profile
        const { data: studentData } = await supabase.from('students')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (studentData) {
          setStudent(studentData);

          // 2. Fetch Stats in Parallel
          const [
            { data: attendanceData },
            { data: feeData },
            { data: homeworkData },
            { data: noticeData }
          ] = await Promise.all([
            supabase.from('attendance').select('status').eq('student_id', studentData.id),
            supabase.from('fees').select('total_amount').eq('student_id', studentData.id).eq('status', 'Pending'),
            supabase.from('homework').select('id').eq('class_name', studentData.class_name),
            supabase.from('events').select('*').order('created_at', { ascending: false }).limit(3)
          ]);

          // Calculate Attendance %
          const attRecords = attendanceData || [];
          const presentCount = attRecords.filter((a: any) => a.status === 'Present').length;
          const attendancePct = attRecords.length > 0 ? Math.round((presentCount / attRecords.length) * 100) : 0;

          // Calculate Pending Fees
          const pendingTotal = (feeData || []).reduce((sum, f) => sum + Number(f.total_amount), 0);

          setStats({
            attendance: attendancePct,
            pendingFees: pendingTotal,
            activeHomework: homeworkData?.length || 0,
            notices: noticeData || []
          });
        }
      } catch (error) {
        console.error("Dashboard Sync Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center animate-pulse">
        <GraduationCap size={64} className="mx-auto text-indigo-600 mb-4" />
        <p className="font-black uppercase tracking-widest text-gray-400 italic">Syncing Your Portal...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans space-y-10 pb-24">
      {/* 🟢 TOP HEADER - HERO SECTION */}
      <div className="bg-indigo-900 rounded-[3.5rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="relative z-10 text-center md:text-left">
          <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 mb-6">
            ✨ Academic Session 2024-25
          </div>
          <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none mb-4">
            Welcome Back,<br/>{student?.full_name?.split(' ')[0] || 'Scholar'}!
          </h1>
          <p className="text-indigo-200 font-bold uppercase text-xs tracking-[0.2em] flex items-center justify-center md:justify-start gap-3">
             <span className="opacity-60">Class:</span> {student?.class_name} 
             <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
             <span className="opacity-60">Roll:</span> {student?.roll_no}
          </p>
        </div>
        
        <div className="relative group">
           <div className="w-32 h-32 md:w-44 md:h-44 rounded-[3rem] bg-white/10 border-4 border-white/20 p-2 overflow-hidden backdrop-blur-3xl shadow-2xl transition-transform hover:scale-105">
              <img 
                src={student?.photo_url || `https://ui-avatars.com/api/?name=${student?.full_name}&background=6366f1&color=fff`} 
                className="w-full h-full object-cover rounded-[2.5rem]" 
                alt="Profile"
              />
           </div>
           <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-3 rounded-2xl shadow-xl border-4 border-indigo-900">
             <CheckCircle2 size={24} />
           </div>
        </div>
        
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* 🔵 STATS GRID - LIVE DATA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatSummaryCard 
          icon={Clock} 
          label="Attendance" 
          value={`${stats.attendance}%`} 
          sub="Monthly Presence"
          color="indigo"
        />
        <StatSummaryCard 
          icon={CreditCard} 
          label="Fees Due" 
          value={`₹${stats.pendingFees.toLocaleString()}`} 
          sub="Academic Arrears"
          color={stats.pendingFees > 0 ? "rose" : "emerald"}
        />
        <StatSummaryCard 
          icon={BookOpen} 
          label="Active Tasks" 
          value={stats.activeHomework} 
          sub="Pending Homework"
          color="amber"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* 🟡 QUICK ACTIONS */}
        <div className="lg:col-span-2 space-y-8">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-3 italic">
             <Layout size={16}/> Essential Systems
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <ActionCard icon="💸" label="Fees" path="/student/fees" color="emerald" navigate={navigate}/>
              <ActionCard icon="📊" label="Results" path="/student/result" color="indigo" navigate={navigate}/>
              <ActionCard icon="📑" label="Homework" path="/student/homework" color="amber" navigate={navigate}/>
              <ActionCard icon="📅" label="Attendance" path="/student/attendance" color="blue" navigate={navigate}/>
              <ActionCard icon="🆔" label="ID Card" path="/student/id-card" color="purple" navigate={navigate}/>
              <ActionCard icon="📢" label="Notices" path="/student/notices" color="rose" navigate={navigate}/>
           </div>
        </div>

        {/* 🔴 RECENT NOTICES */}
        <div className="space-y-8">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-3 italic">
             <Bell size={16}/> Latest Updates
           </h3>
           <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-gray-100 flex flex-col gap-6">
              {stats.notices.length > 0 ? stats.notices.map((notice, idx) => (
                <div key={idx} className="flex gap-4 group cursor-pointer" onClick={() => navigate('/student/notices')}>
                   <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 self-start group-hover:bg-indigo-600 group-hover:text-white transition-all">
                     <Calendar size={18}/>
                   </div>
                   <div>
                      <h4 className="font-black text-gray-900 text-sm">{notice.title}</h4>
                      <p className="text-gray-400 text-[10px] font-bold mt-1 line-clamp-2 leading-relaxed">{notice.description}</p>
                   </div>
                </div>
              )) : (
                <div className="text-center py-10 opacity-20 italic font-black uppercase text-xs tracking-widest">No recent notices.</div>
              )}
              <button onClick={() => navigate('/student/notices')} className="w-full bg-gray-50 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                View All Board <ArrowRight size={14}/>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for cleaner structure
const StatSummaryCard = ({ icon: Icon, label, value, sub, color }: any) => (
  <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 hover:border-indigo-100 transition-all flex items-center gap-6 group">
    <div className={`bg-${color}-50 p-6 rounded-[2.5rem] text-${color}-600 group-hover:scale-110 transition-transform`}>
      <Icon size={32} />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 italic">{label}</p>
      <h3 className="text-4xl font-black text-gray-900 tracking-tighter italic">{value}</h3>
      <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{sub}</p>
    </div>
  </div>
);

const ActionCard = ({ icon, label, path, color, navigate }: any) => (
  <div 
    onClick={() => navigate(path)}
    className="bg-white p-8 rounded-[2.8rem] shadow-sm border border-gray-50 hover:shadow-2xl hover:border-indigo-100 cursor-pointer transition-all flex flex-col items-center justify-center text-center group active:scale-95"
  >
     <div className="text-5xl mb-4 group-hover:rotate-12 transition-transform">{icon}</div>
     <h4 className="font-black text-gray-800 uppercase tracking-tighter italic text-lg">{label}</h4>
     <div className={`w-8 h-1 bg-${color}-500 rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
  </div>
);

