import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Filter, Mail, 
  Phone, ChevronRight, Star, 
  TrendingUp, Activity, BarChart3, 
  ShieldCheck, Zap, Info, ArrowUpRight,
  UserCheck, Database, Layout, RefreshCw,
  MapPin, GraduationCap, Smartphone
} from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  email: string;
  roll_number: string;
  class_name: string;
  father_name: string;
  phone: string;
  address: string;
  attendance_rate: number;
  avg_marks: number;
  status: 'active' | 'inactive';
  photo_url?: string;
}

const StudentList: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'marks' | 'attendance'>('name');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_approved', 'approved')
        .order('full_name');

      if (error) throw error;
      
      const formattedStudents: Student[] = (data || []).map(s => ({
        id: s.student_id || s.id,
        full_name: s.full_name,
        email: s.email,
        roll_number: s.roll_no,
        class_name: s.class_name,
        father_name: s.father_name,
        phone: s.contact_number,
        address: s.address,
        attendance_rate: Math.floor(Math.random() * 20) + 80, // Simulation for UI
        avg_marks: Math.floor(Math.random() * 20) + 75,       // Simulation for UI
        status: 'active',
        photo_url: s.photo_url
      }));

      setStudents(formattedStudents);
    } catch (error: any) {
      toast.error("Failed to load students: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    (selectedClass === 'All' || selectedClass === 'All Classes' || student.class_name === selectedClass) &&
    student.full_name.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
    if (sortBy === 'marks') return b.avg_marks - a.avg_marks;
    return b.attendance_rate - a.attendance_rate;
  });

  const classes = ['All Classes', ...Array.from(new Set(students.map(s => s.class_name)))];

  if (loading && !students.length) {
    return (
       <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
          <div className="relative">
             <RefreshCw size={60} className="animate-spin text-emerald-600/20"/>
             <Users size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600" />
          </div>
          <p className="font-black uppercase tracking-[0.4em] text-slate-400 italic text-[10px] mt-8 text-center px-10">Synchronizing Faculty Liaison...</p>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] py-12 px-4 md:px-10 pb-32">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-center md:text-left">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                Faculty<br/>
                <span className="text-emerald-600">Liaison</span>
              </h1>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-4 flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck size={12} className="text-emerald-500" /> Authorized Scholar Directory & Performance Hub v4.2
              </p>
           </motion.div>
           
           <div className="bg-white border border-slate-100 rounded-[3rem] p-8 shadow-sm flex items-center gap-10 group hover:shadow-xl transition-all relative z-20">
             <div className="w-16 h-16 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-3xl shadow-2xl shadow-slate-200 group-hover:scale-110 transition-transform">🎓</div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-2 leading-none">Managed Cohort</p>
                <p className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{students.length} Scholars</p>
             </div>
           </div>
        </div>

        {/* --- CONTROLS --- */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-8 p-10 bg-white rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600" />
          
          <div className="lg:col-span-2 relative group/search">
             <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within/search:text-emerald-500 transition-colors" />
             <input
               type="text"
               placeholder="Index scholar by nomenclature..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="premium-input italic text-sm placeholder:text-slate-200 pl-16 py-5"
             />
          </div>

          <div className="relative group/filter">
             <Filter size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within/filter:text-emerald-500 transition-colors" />
             <select 
               value={selectedClass} 
               onChange={(e) => setSelectedClass(e.target.value)}
               className="premium-input italic text-sm pl-16 py-5 appearance-none"
             >
               {classes.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>

          <div className="relative group/sort">
             <TrendingUp size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within/sort:text-emerald-500 transition-colors" />
             <select 
               value={sortBy} 
               onChange={(e) => setSortBy(e.target.value as any)}
               className="premium-input italic text-sm pl-16 py-5 appearance-none"
             >
               <option value="name">Sort: Nomenclature</option>
               <option value="marks">Sort: Academic Yield</option>
               <option value="attendance">Sort: Presence Index</option>
             </select>
          </div>
        </motion.div>

        {/* --- STUDENTS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence>
            {filteredStudents.map((student, idx) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.05 * (idx % 10) }}
                className="group premium-card p-10 hover:border-emerald-200 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 cursor-pointer relative overflow-hidden"
                onClick={() => navigate(`/teacher/student/${student.id}`)}
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 opacity-10 blur-3xl group-hover:opacity-30 transition-opacity"></div>
                
                <div className="flex items-center gap-6 mb-10 relative z-10">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] border-4 border-white shadow-xl flex items-center justify-center font-black text-slate-300 text-3xl italic group-hover:border-emerald-100 group-hover:text-emerald-600 transition-all overflow-hidden bg-cover bg-center" style={student.photo_url ? {backgroundImage: `url(${student.photo_url})`} : {}}>
                    {!student.photo_url && student.full_name[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-3 group-hover:text-emerald-600 transition-colors">{student.full_name}</h3>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.roll_number}</span>
                       <span className="w-1.5 h-1.5 bg-slate-100 rounded-full" />
                       <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest italic">{student.class_name}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-10 p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-50 group-hover:bg-white group-hover:border-emerald-50 transition-all duration-700 relative z-10">
                   <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Presence Index</p>
                      <div className="flex items-end gap-2">
                         <p className="text-2xl font-black text-slate-900 italic tracking-tighter leading-none">{student.attendance_rate}%</p>
                         <Activity size={14} className={student.attendance_rate >= 85 ? 'text-emerald-500' : 'text-amber-500'} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Academic Yield</p>
                      <div className="flex items-end gap-2">
                         <p className="text-2xl font-black text-slate-900 italic tracking-tighter leading-none">{student.avg_marks}%</p>
                         <ArrowUpRight size={14} className="text-blue-500" />
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-between relative z-10">
                   <div className="flex gap-4">
                      <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-inner group-hover:text-emerald-400">
                         <Smartphone size={18} />
                      </div>
                      <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-inner group-hover:text-emerald-400">
                         <Mail size={18} />
                      </div>
                   </div>
                   <button className="flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl group-hover:bg-emerald-600 transition-all  italic">
                      Profile <ChevronRight size={14} />
                   </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredStudents.length === 0 && (
          <div className="py-48 flex flex-col items-center justify-center text-center opacity-20">
             <Database size={100} className="text-slate-300 mb-8" />
             <p className="font-black uppercase tracking-[0.4em] text-slate-400 italic text-sm">No Matching Scholar Records Indexed</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentList;
