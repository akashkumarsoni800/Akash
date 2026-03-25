import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
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
          .limit(1)
          .maybeSingle();

        if (studentData) {
          setStudent(studentData);

          const studentId = studentData.student_id || studentData.id;
          const [
            { data: attendanceData },
            { data: feeData },
            { data: homeworkData },
            { data: noticeData }
          ] = await Promise.all([
            supabase.from('attendance').select('status').eq('student_id', studentId),
            supabase.from('fees').select('total_amount').eq('student_id', studentId).eq('status', 'Pending'),
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
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 md:px-10 pb-32">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* --- STUDENT HERO SECTION --- */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-50 opacity-20 rounded-full -mr-40 -mt-40 transition-transform duration-[3s] group-hover:scale-110"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12 text-center lg:text-left">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-purple-50 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-purple-600 border border-purple-100 animate-pulse">
                < Award size={14} /> Academic Excellence 2024-25
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                Welcome Back,<br/>
                <span className="text-purple-600">
                  {student?.full_name?.split(' ')[0] || 'Scholar'}!
                </span>
              </h1>

              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                <div className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Batch</p>
                   <p className="text-lg font-black text-slate-800 tracking-tighter">Class {student?.class_name}</p>
                </div>
                <div className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Registry No</p>
                   <p className="text-lg font-black text-slate-800 tracking-tighter">#{student?.roll_no}</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="w-48 h-48 md:w-60 md:h-60 rounded-[3rem] p-2 bg-slate-50 border border-slate-100 shadow-2xl relative z-10 overflow-hidden group-hover:rotate-2 transition-transform duration-700">
                <img 
                  src={student?.photo_url || `https://ui-avatars.com/api/?name=${student?.full_name}&background=1e293b&color=fff`} 
                  className="w-full h-full object-cover rounded-[2.5rem]" 
                  alt="Profile"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white p-4 rounded-2xl shadow-xl border-4 border-white z-20 animate-bounce">
                <CheckCircle2 size={24} />
              </div>
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-purple-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            </div>
          </div>
        </motion.div>

        {/* --- PERFORMANCE INDEX --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <StatCard 
             icon={Clock} 
             title="Attendance Log" 
             value={`${stats.attendance}%`} 
             color="purple"
             subText="Real-time Presence"
           />
           <StatCard 
             icon={CreditCard} 
             title="Financial Status" 
             value={`₹${stats.pendingFees.toLocaleString()}`} 
             color={stats.pendingFees > 0 ? "rose" : "emerald"}
             subText="Pending Dues"
           />
           <StatCard 
             icon={BookOpen} 
             title="Homework Portal" 
             value={stats.activeHomework} 
             color="amber"
             subText="Assigned Tasks"
           />
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* --- SYSTEM ACCESS GRID --- */}
          <div className="lg:col-span-2 space-y-8">
             <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                 <Layout size={16} className="text-purple-600"/> Core System Access
               </h3>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <ActionCard icon="💸" label="Fees Registry" path="/student/fees" color="emerald" navigate={navigate}/>
                <ActionCard icon="📊" label="Academic Data" path="/student/result" color="purple" navigate={navigate}/>
                <ActionCard icon="📑" label="Homework Hub" path="/student/homework" color="amber" navigate={navigate}/>
                <ActionCard icon="📅" label="Presence Log" path="/student/attendance" color="blue" navigate={navigate}/>
                <ActionCard icon="🆔" label="Identity Card" path="/student/id-card" color="slate" navigate={navigate}/>
                <ActionCard icon="📢" label="Broadcasts" path="/student/notices" color="rose" navigate={navigate}/>
             </div>
          </div>

          {/* --- BROADCAST BOARD --- */}
          <div className="space-y-8">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
               <Bell size={16} className="text-purple-600"/> Latest Broadcasts
             </h3>
             
             <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-6">
                {stats.notices.length > 0 ? stats.notices.map((notice, idx) => (
                  <div key={idx} className="flex gap-4 group cursor-pointer hover:bg-slate-50 p-4 -mx-4 rounded-2xl transition-all" onClick={() => navigate('/student/notices')}>
                     <div className="bg-purple-50 p-3.5 rounded-xl text-purple-600 self-start group-hover:bg-purple-600 group-hover:text-white transition-all">
                       <Calendar size={18}/>
                     </div>
                     <div className="flex-1">
                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight line-clamp-1">{notice.title}</h4>
                        <p className="text-slate-400 text-[10px] font-bold mt-1 line-clamp-2 leading-relaxed">{notice.description}</p>
                     </div>
                  </div>
                )) : (
                  <div className="text-center py-12 opacity-30 italic font-black uppercase text-[10px] tracking-widest text-slate-400">Zero System Broadcasts</div>
                )}
                <button onClick={() => navigate('/student/notices')} className="w-full bg-slate-50 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 group">
                  Full Archive Access <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- REDESIGNED SUBCOMPONENTS ---
const StatCard = ({ icon: Icon, title, value, color, subText }: any) => {
  const accentColors: { [key: string]: string } = {
    purple: 'text-purple-600 bg-purple-50',
    rose: 'text-rose-600 bg-rose-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{subText}</span>
          </div>
        </div>
        <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${accentColors[color as keyof typeof accentColors]}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${color === 'rose' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Live System Sync</span>
         </div>
      </div>
    </motion.div>
  );
};

const ActionCard = ({ icon, label, path, color, navigate }: any) => {
  const themes: { [key: string]: string } = {
    emerald: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white',
    purple: 'text-purple-600 bg-purple-50 hover:bg-purple-600 hover:text-white',
    amber: 'text-amber-600 bg-amber-50 hover:bg-amber-600 hover:text-white',
    blue: 'text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white',
    slate: 'text-slate-600 bg-slate-50 hover:bg-slate-900 hover:text-white',
    rose: 'text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white',
  };

  return (
    <button 
      onClick={() => navigate(path)}
      className={`bg-white border border-slate-100 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 ${themes[color as keyof typeof themes]}`}
    >
       <div className="text-4xl mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6">{icon}</div>
       <h4 className="font-black uppercase tracking-tighter text-lg leading-tight">{label}</h4>
       <div className="mt-4 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
          Open Registry <ArrowRight size={10} />
       </div>
    </button>
  );
};


