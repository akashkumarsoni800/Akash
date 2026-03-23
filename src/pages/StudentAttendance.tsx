import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  ChevronLeft, Calendar, CheckCircle2, 
  XCircle, Clock, RefreshCw, Filter,
  TrendingUp, BarChart3
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
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
       <RefreshCw size={40} className="animate-spin text-indigo-600 mb-4"/>
       <p className="font-black uppercase tracking-widest text-gray-400 italic text-sm">Attendance Syncing...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-sm text-indigo-600 font-black text-[10px] uppercase mb-10 border border-gray-100 tracking-widest">
        <ChevronLeft size={16}/> Back to Dashboard
      </button>

      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-6xl font-black text-gray-900 italic uppercase tracking-tighter leading-none">Attendance Log</h1>
          <p className="text-gray-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em]">Official presence records</p>
        </div>

        {/* 🟢 SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
           <StatBox label="Presence" value={`${stats.percentage}%`} icon={TrendingUp} color="indigo" />
           <StatBox label="Total Days" value={stats.total} icon={BarChart3} color="blue" />
           <StatBox label="Present" value={stats.present} icon={CheckCircle2} color="emerald" />
           <StatBox label="Absent" value={stats.absent} icon={XCircle} color="rose" />
        </div>

        {/* 🔵 ATTENDANCE LIST */}
        <div className="bg-white rounded-[3.5rem] shadow-xl border border-gray-100 overflow-hidden">
           <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center px-10">
              <h3 className="font-black text-xs text-gray-400 uppercase tracking-widest italic flex items-center gap-2">
                 <Clock size={16}/> Recent Logs
              </h3>
              <div className="flex items-center gap-2 text-indigo-600 font-black text-[9px] uppercase tracking-tighter">
                 <Filter size={14}/> Monthly Filter
              </div>
           </div>

           <div className="p-4 md:p-10">
              {records.length > 0 ? (
                <div className="grid gap-4">
                   {records.map((record, idx) => (
                     <div key={idx} className="bg-white rounded-[2rem] p-6 border border-gray-50 flex items-center justify-between hover:border-indigo-100 transition-all shadow-sm group">
                        <div className="flex items-center gap-5">
                           <div className={`p-4 rounded-2xl ${record.status === 'P' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              <Calendar size={20}/>
                           </div>
                           <div>
                              <p className="font-black text-gray-900 text-lg italic uppercase">{new Date(record.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                           </div>
                        </div>
                        <div className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm ${record.status === 'P' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-pulse'}`}>
                           {record.status === 'P' ? 'Present' : 'Absent'}
                        </div>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="py-20 text-center opacity-30 italic font-black uppercase text-xs tracking-widest flex flex-col items-center gap-4">
                   <div className="text-5xl">📅</div>
                   No attendance records found yet.
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-transparent hover:border-indigo-100 transition-all text-center group">
     <div className={`bg-${color}-50 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 text-${color}-600 group-hover:scale-110 transition-transform`}>
        <Icon size={20} className="md:w-6 md:h-6"/>
     </div>
     <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic opacity-60">{label}</p>
     <p className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tighter">{value}</p>
  </div>
);

export default StudentAttendance;
