import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Calendar, CheckCircle2, 
  XCircle, Clock, RefreshCw, Filter,
  TrendingUp, BarChart3, ShieldCheck, Activity, Zap, Search
} from 'lucide-react';

const StudentAttendance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0, percentage: 0 });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');

      const { data: student } = await supabase.from('students')
        .select('student_id')
        .eq('email', user.email)
        .limit(1)
        .maybeSingle();

      if (!student) {
        toast.error("Profile not found");
        return;
      }

      const { data } = await supabase.from('attendance')
        .select('*')
        .eq('student_id', student.student_id)
        .order('date', { ascending: false });

      const attRecords = data || [];
      setRecords(attRecords);

      const present = attRecords.filter(r => r.status === 'P' || r.status === 'Present').length;
      const total = attRecords.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      setStats({
        present,
        absent: total - present,
        total,
        percentage
      });

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
       <div className="relative">
          <RefreshCw size={60} className="animate-spin text-blue-600/20"/>
          <Activity size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
       </div>
       <p className="font-bold   text-slate-400 text-[10px] mt-8">Syncing Presence Manifest...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-10 pb-32 font-inter">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* --- NAVIGATION & CONTEXT --- */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="group flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all active:scale-95"
          >
            <ChevronLeft size={18} className="text-blue-600 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold  tracking-widest text-[10px] text-slate-600">Portal Exit</span>
          </button>

          <div className="bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4 group">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-[10px] font-bold   text-blue-400 ">Real-Time Sync Active</span>
          </div>
        </div>

        {/* --- DYNAMIC HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="">
              <h1 className="text-5xl md:text-7xl font-bold text-slate-900   leading-none">
                Presence<br/>
                <span className="text-blue-600">Analytics</span>
              </h1>
              <p className="text-slate-400 font-bold  text-[10px]  mt-4 flex items-center gap-2">
                <ShieldCheck size={12} className="text-blue-500" /> Institutional Presence & Activity Audit
              </p>
           </motion.div>
           
           <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all">
             <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl shadow-slate-200 group-hover:scale-110 transition-transform">📅</div>
             <div>
               <p className="text-[9px] font-bold text-slate-400   mb-1">Audit Score</p>
               <p className="text-3xl font-bold text-slate-900  ">{stats.percentage}% Consistent</p>
             </div>
           </div>
        </div>

        {/* 🟢 ANALYTICS SUMMARY GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <PremiumStatBox label="Presence Velocity" value={`${stats.percentage}%`} icon={TrendingUp} accent="blue" />
           <PremiumStatBox label="Total Logged Nodes" value={stats.total} icon={BarChart3} accent="slate" />
           <PremiumStatBox label="Successful Authentications" value={stats.present} icon={CheckCircle2} accent="emerald" />
           <PremiumStatBox label="Missed Sessions" value={stats.absent} icon={XCircle} accent="rose" />
        </div>

        {/* 🔵 PRESENCE TIMELINE */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden group"
        >
           <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-6 px-12">
              <h3 className="font-bold text-[10px] text-slate-400   flex items-center gap-3">
                 <Clock size={16} className="text-blue-600"/> Chronological Presence Timeline
              </h3>
              <div className="flex items-center gap-4">
                 <div className="relative group/filter">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/filter:text-blue-500 transition-colors" size={14}/>
                    <select className="bg-white border border-slate-100 rounded-xl pl-10 pr-6 py-2 text-[9px] font-bold  tracking-widest outline-none focus:ring-4 focus:ring-blue-100 transition-all appearance-none">
                       <option>Full Manifest</option>
                       <option>Last 30 Cycles</option>
                       <option>Flagged Only</option>
                    </select>
                 </div>
              </div>
           </div>

           <div className="p-6 md:p-12">
              {records.length > 0 ? (
                <div className="grid gap-6">
                   {records.map((record, idx) => (
                     <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * idx }}
                        key={idx} 
                        className={`bg-white rounded-[2.5rem] p-8 border transition-all duration-500 flex flex-col md:flex-row items-center justify-between group/row shadow-sm hover:shadow-xl ${
                           record.status === 'P' ? 'hover:border-blue-100 border-slate-50' : 'hover:border-rose-100 border-rose-50 shadow-rose-500/5 bg-rose-50/10'
                        }`}
                     >
                        <div className="flex items-center gap-8 w-full md:w-auto">
                           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${
                              record.status === 'P' ? 'bg-blue-50 text-blue-600 group-hover/row:bg-blue-600 group-hover/row:text-white' : 'bg-rose-50 text-rose-600 group-hover/row:bg-rose-600 group-hover/row:text-white'
                           }`}>
                              <Calendar size={24}/>
                           </div>
                           <div className="space-y-1">
                              <p className="font-bold text-slate-900 text-xl   ">
                                 {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400   flex items-center gap-2">
                                 <Zap size={10} className="text-blue-500"/> {new Date(record.date).toLocaleDateString('en-GB', { weekday: 'long' })} Protocol
                              </p>
                           </div>
                        </div>

                        <div className="mt-6 md:mt-0 flex items-center gap-6 w-full md:w-auto">
                           <div className={`px-10 py-4 rounded-[1.5rem] font-bold text-[10px]   shadow-xl  transition-all duration-500 ${
                              record.status === 'P' 
                              ? 'bg-slate-900 text-white shadow-slate-200 group-hover/row:bg-blue-600' 
                              : 'bg-rose-600 text-white shadow-rose-200 animate-pulse'
                           }`}>
                              {record.status === 'P' ? 'Session Authenticated' : 'Presence Flagged'}
                           </div>
                        </div>
                     </motion.div>
                   ))}
                </div>
              ) : (
                <div className="py-32 text-center space-y-8 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 opacity-30 group">
                   <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-5xl shadow-inner group-hover:rotate-12 transition-transform duration-500">📅</div>
                   <div className="space-y-2">
                      <h4 className="text-xl font-bold text-slate-900   ">Registry Nullified</h4>
                      <p className="text-[9px] font-bold text-slate-400  ">No presence records found in the current session cycle.</p>
                   </div>
                </div>
              )}
           </div>
        </motion.div>
      </div>
    </div>
  );
};

const PremiumStatBox = ({ label, value, icon: Icon, accent }: any) => {
   const colors: any = {
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      rose: 'bg-rose-50 text-rose-600 border-rose-100',
      slate: 'bg-slate-100 text-slate-600 border-slate-200'
   };

   return (
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all text-center group relative overflow-hidden">
         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all group-hover:scale-110 group-hover:rotate-3 ${colors[accent]}`}>
            <Icon size={24}/>
         </div>
         <p className="text-[9px] font-bold text-slate-400  tracking-widest mb-2 ">{label}</p>
         <p className="text-3xl font-bold text-slate-900  ">{value}</p>
         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon size={40} />
         </div>
      </div>
   );
};

export default StudentAttendance;
