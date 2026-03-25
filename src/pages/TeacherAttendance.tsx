import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, CheckSquare, ShieldCheck, 
  ChevronRight, Search, Zap, CheckCircle2, XCircle
} from 'lucide-react';

const TeacherAttendance = () => {
  const [classList, setClassList] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const today = new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }); 

  const dbDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD for DB

  // 1. Fetch available classes from the student table
  useEffect(() => {
    const getClasses = async () => {
      const { data } = await supabase.from('students').select('class_name');
      if (data) {
        const unique = Array.from(new Set(data.map(s => s.class_name))).filter(Boolean);
        setClassList(unique as string[]);
      }
    };
    getClasses();
  }, []);

  // 2. Fetch students when a class is selected
  useEffect(() => {
    if (selectedClass) {
      const fetchClassStudents = async () => {
        setLoading(true);
        const { data } = await supabase.from('students')
          .select('id:student_id, full_name')
          .eq('class_name', selectedClass)
          .eq('is_approved', 'approved')
          .order('full_name');

        if (data) {
          setStudents(data);
          const initial: any = {};
          data.forEach(s => initial[s.id] = 'P');
          setAttendance(initial);
        }
        setLoading(false);
      };
      fetchClassStudents();
    }
  }, [selectedClass]);

  const toggleStatus = (id: any) => {
    setAttendance((prev: any) => ({ ...prev, [id]: prev[id] === 'P' ? 'A' : 'P' }));
  };

  const saveAttendance = async () => {
    setLoading(true);
    try {
      const records = Object.entries(attendance).map(([id, status]) => ({
        student_id: id,
        date: dbDate,
        status: status,
      }));

      const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id, date' });
      if (error) throw error;
      toast.success(`Registry updated: Class ${selectedClass} presence secured.`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = Object.values(attendance).filter(v => v === 'P').length;
  const absentCount = Object.values(attendance).filter(v => v === 'A').length;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-10 pb-32">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* --- DYNAMIC HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                Presence<br/>
                <span className="text-blue-600">Registry</span>
              </h1>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-4 flex items-center gap-2">
                <ShieldCheck size={12} className="text-blue-500" /> Faculty Log & Registry Protocol
              </p>
           </motion.div>
           
           <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all">
             <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl shadow-slate-200 group-hover:scale-110 transition-transform">📝</div>
             <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Session Date</p>
               <p className="text-2xl font-black text-slate-900 tracking-tighter italic ">{today}</p>
             </div>
           </div>
        </div>

        {/* --- CLASS SELECTOR --- */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 group hover:shadow-xl transition-all duration-500">
                <div className="w-full md:w-1/3 space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Select Target Manifest</label>
                  <div className="relative group/sel">
                    <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/sel:text-blue-500 transition-colors" size={18} />
                    <select 
                      className="premium-input w-full pl-16 appearance-none"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                    >
                      <option value="">Choose Class Manifest</option>
                      {classList.map(c => <option key={c} value={c}>Class Protocol: {c}</option>)}
                    </select>
                    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within/sel:rotate-90 transition-transform" size={14} />
                  </div>
                </div>

                {selectedClass && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex gap-4 w-full md:w-auto">
                    <div className="flex-1 bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex flex-col justify-center">
                       <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Authenticated</p>
                       <p className="text-2xl font-black text-emerald-700 tracking-tighter leading-none">{presentCount} Present</p>
                    </div>
                    <div className="flex-1 bg-red-50 border border-red-100 p-6 rounded-[2rem] flex flex-col justify-center">
                       <p className="text-[8px] font-black text-red-600 uppercase tracking-widest mb-1">Flagged</p>
                       <p className="text-2xl font-black text-red-700 tracking-tighter leading-none">{absentCount} Absent</p>
                    </div>
                  </motion.div>
                )}

                {selectedClass && (
                  <button 
                    onClick={saveAttendance} 
                    disabled={loading}
                    className="w-full md:w-auto px-10 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-200 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 "
                  >
                    {loading ? <CheckCircle2 className="animate-spin" size={18}/> : <CheckSquare size={18}/>}
                    Secure Registry
                  </button>
                )}
             </div>
          </div>
          
          <div className="bg-slate-900 rounded-[3rem] p-8 flex flex-col justify-center items-center text-center shadow-xl group hover:bg-blue-600 transition-all duration-700">
             <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <ShieldCheck className="text-blue-400 group-hover:text-white" size={24} />
             </div>
             <p className="text-blue-400 group-hover:text-white/80 font-black uppercase text-[8px] tracking-widest mb-1">Cloud Sync</p>
             <p className="text-white text-lg font-black tracking-tighter italic ">Active Nodes</p>
          </div>
        </div>

        {/* --- STUDENT PRESENCE GRID --- */}
        <AnimatePresence mode="wait">
          {selectedClass ? (
            <motion.div 
              key={selectedClass}
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3 ">
                  <span className="bg-blue-100 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center text-xs">01</span>
                  Presence Manifest <span className="text-slate-300 ml-2">Class {selectedClass}</span>
                </h2>
                
                <div className="relative group/search w-full md:w-80">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search presence by name..."
                    className="premium-input w-full pl-16 rounded-2xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map((s, idx) => (
                  <motion.div 
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-white p-8 rounded-[2.5rem] border transition-all duration-300 flex items-center justify-between group/card shadow-sm hover:shadow-xl ${
                      attendance[s.id] === 'P' 
                      ? 'border-emerald-100 hover:border-emerald-200 bg-gradient-to-br from-white to-emerald-50/20' 
                      : 'border-red-100 hover:border-red-200 bg-gradient-to-br from-white to-red-50/20 shadow-red-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black  shadow-sm transition-all ${
                        attendance[s.id] === 'P' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {s.full_name[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 uppercase italic tracking-tighter leading-none mb-1 ">{s.full_name}</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Zap size={10} className={attendance[s.id] === 'P' ? 'text-emerald-500' : 'text-red-500'}/> Node Secured
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => toggleStatus(s.id)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg ${
                        attendance[s.id] === 'P' 
                        ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700' 
                        : 'bg-red-600 text-white shadow-red-200 hover:bg-red-700'
                      }`}
                    >
                      {attendance[s.id] === 'P' ? <CheckCircle2 size={24}/> : <XCircle size={24}/>}
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3.5rem] border border-dashed border-slate-200 opacity-30 group">
              <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                <Calendar size={48} className="text-slate-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2 italic ">Identity Recognition Locked</h3>
              <p className="max-w-xs text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] leading-relaxed text-center">Select a target class manifest from the registry portal to begin real-time presence logging.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeacherAttendance;
