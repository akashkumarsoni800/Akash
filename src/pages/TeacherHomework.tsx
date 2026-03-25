import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Users, CheckCircle2, Clock, 
  Send, ShieldCheck, Zap, ChevronRight, 
  Layout, Info, Star, RefreshCw, BookOpen, Search, Filter
} from 'lucide-react';

interface Homework {
  id: number;
  title: string;
  subject: string;
  class_name: string;
  due_date: string;
  total_students: number;
  submissions: {
    submitted: number;
    pending: number;
    names_submitted: string[];
    names_pending: string[];
  };
}

interface HomeworkSubmission {
  id: number;
  homework_id: number;
  student_id: string;
  student_name: string;
  submitted_at: string;
  status: 'submitted' | 'pending' | 'graded';
  file_url?: string;
}

const TeacherHomework: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHomework, setSelectedHomework] = useState<number>(0);

  useEffect(() => {
    fetchHomeworkData();
  }, []);

  const fetchHomeworkData = async () => {
    setLoading(true);
    try {
      const { data: hwData } = await supabase
        .from('homework')
        .select(`
          *,
          homework_submissions!inner(count),
          students!homework_students(class_name)
        `);

      const homeworkList: Homework[] = (hwData || []).map((hw: any) => ({
        id: hw.id,
        title: hw.title,
        subject: hw.subject,
        class_name: hw.students?.class_name || '10A',
        due_date: hw.due_date,
        total_students: hw.students?.length || 32,
        submissions: {
          submitted: hw.homework_submissions_count || 0,
          pending: (hw.students?.length || 32) - (hw.homework_submissions_count || 0),
          names_submitted: [],
          names_pending: []
        }
      }));

      setHomeworks(homeworkList);

      if (id) {
        await fetchSubmissions(parseInt(id));
      }
    } catch (error) {
      console.error('Homework fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (homeworkId: number) => {
    try {
      const { data } = await supabase
        .from('homework_submissions')
        .select(`
          *,
          students(full_name)
        `)
        .eq('homework_id', homeworkId)
        .order('submitted_at', { ascending: false });

      setSubmissions(data || []);
      setSelectedHomework(homeworkId);
    } catch (error) {
      console.error('Submissions fetch error:', error);
    }
  };

  const selectedHW = homeworks.find(h => h.id === selectedHomework);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
       <div className="relative">
          <RefreshCw size={60} className="animate-spin text-emerald-600/20"/>
          <Layout size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600" />
       </div>
       <p className="font-black   text-slate-400 text-[10px] mt-8 text-center px-10">Initializing Distribution Manifest...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-10 pb-32 font-inter">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900   leading-none uppercase">
                Asset<br/>
                <span className="text-emerald-600">Distribution</span>
              </h1>
              <p className="text-slate-400 font-black  text-[10px]  mt-4 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500" /> Authorized Scholastic Task Emission & Oversight Terminal
              </p>
           </motion.div>

           <div className="flex flex-wrap items-center gap-4">
              <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group">
                 <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <BookOpen size={20} />
                 </div>
                 <div>
                    <p className="text-[8px] font-black text-slate-400  tracking-widest">Active Fleet</p>
                    <p className="text-xl font-black text-slate-900 ">{homeworks.length} Assignments</p>
                 </div>
              </div>
              <button className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px]   shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-3 active:scale-95 group">
                 <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" /> Emit New Task
              </button>
           </div>
        </div>

        {/* --- HOMEWORK LIST GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {homeworks.map((hw, index) => (
            <motion.div
              key={hw.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => fetchSubmissions(hw.id)}
              className={`group relative p-8 md:p-10 rounded-[3.5rem] border-4 transition-all duration-700 cursor-pointer overflow-hidden ${
                selectedHomework === hw.id 
                  ? 'bg-white border-emerald-600 shadow-2xl shadow-emerald-100 scale-[1.02]' 
                  : 'bg-white border-transparent shadow-sm hover:shadow-xl hover:border-slate-100'
              }`}
            >
              <div className="absolute -right-8 -top-8 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                 <Zap size={200} />
              </div>

              <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                 <div className="space-y-6">
                    <div className="flex justify-between items-start">
                       <div className="space-y-2">
                          <p className={`text-[10px] font-black    ${
                             selectedHomework === hw.id ? 'text-emerald-600' : 'text-slate-400'
                          }`}>{hw.subject || 'Core Discipline'}</p>
                          <h3 className="text-3xl font-black text-slate-900   leading-none  uppercase">{hw.title}</h3>
                       </div>
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                          selectedHomework === hw.id 
                          ? 'bg-emerald-600 text-white shadow-lg' 
                          : 'bg-slate-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600'
                       }`}>
                          <ChevronRight size={24} className={selectedHomework === hw.id ? 'translate-x-1' : ''} />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-300  tracking-widest leading-none">Cohort Node</p>
                          <p className="text-xl font-black text-slate-900  tracking-tight">Class {hw.class_name}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-300  tracking-widest leading-none">Emission Due</p>
                          <div className="flex items-center gap-2">
                             <Clock size={14} className="text-emerald-500" />
                             <p className="text-xl font-black text-slate-900  tracking-tight">{new Date(hw.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                   <div className="w-full bg-slate-100 rounded-full h-2 shadow-inner p-0.5">
                     <div 
                       className="bg-emerald-600 h-full rounded-full transition-all duration-1000 shadow-sm" 
                       style={{ width: `${(hw.submissions.submitted / hw.total_students) * 100}%` }}
                     />
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black    px-2">
                     <div className="text-emerald-600 flex items-center gap-2">
                       <CheckCircle2 size={12}/> {hw.submissions.submitted} Authenticated
                     </div>
                     <div className="text-slate-400 flex items-center gap-2">
                       <Clock size={12}/> {hw.submissions.pending} Pending
                     </div>
                   </div>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* --- SUBMISSION TERMINAL --- */}
        <AnimatePresence mode="wait">
          {selectedHW && (
            <motion.div 
              key={selectedHomework}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="bg-white rounded-[4rem] p-10 md:p-14 shadow-sm border border-slate-100 space-y-12 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[8px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 opacity-20" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-slate-50 pb-10">
                 <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900   leading-none  uppercase">
                       Submission<br/>
                       <span className="text-emerald-600">Terminal</span>
                    </h2>
                    <div className="flex items-center gap-4">
                       <span className="bg-slate-900 text-white px-5 py-1.5 rounded-full text-[9px] font-black  tracking-widest ">{selectedHW.title}</span>
                       <p className="text-slate-400 font-black text-[10px]  tracking-widest flex items-center gap-2">
                          <Users size={12} className="text-emerald-500" /> Oversight Cohort: Class {selectedHW.class_name}
                       </p>
                    </div>
                 </div>
                 
                 <div className="flex bg-slate-50 rounded-2xl p-1.5 border border-slate-100 shadow-inner">
                    <button className="px-8 py-3 font-black  text-[10px] tracking-widest rounded-xl bg-white text-emerald-600 shadow-md transition-all ">✅ Authenticated ({submissions.length})</button>
                    <button className="px-8 py-3 font-black  text-[10px] tracking-widest rounded-xl text-slate-400 hover:text-slate-900 transition-all ">⏳ Awaiting ({selectedHW.submissions.pending})</button>
                 </div>
              </div>

              <div className="asm-table-container custom-scrollbar border border-slate-50 bg-slate-50/30 rounded-[3rem] p-4 md:p-10">
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-300   ">
                        <th className="p-8">Oversight Target</th>
                        <th className="p-8 text-center">Temporal Timestamp</th>
                        <th className="p-8 text-center">Status Index</th>
                        <th className="p-8 text-right">Directives</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {submissions.map((submission) => (
                        <tr key={submission.id} className="group hover:bg-white hover:shadow-2xl transition-all duration-300 rounded-[2rem]">
                          <td className="p-8">
                             <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-slate-200 border border-slate-100 shadow-inner transition-colors group-hover:border-emerald-200 group-hover:text-emerald-600 text-xl ">
                                   {submission.student_name ? submission.student_name.charAt(0) : 'S'}
                                </div>
                                <div>
                                   <p className="font-black text-slate-900  text-sm  tracking-tight">{submission.student_name}</p>
                                   <p className="text-[8px] font-black text-slate-400  tracking-widest">ASM REGISTRY INDEX: {submission.student_id}</p>
                                </div>
                             </div>
                          </td>
                          <td className="p-8 text-center">
                             <div className="inline-flex items-center gap-3 bg-slate-100/50 px-5 py-2 rounded-xl group-hover:bg-emerald-50 transition-colors">
                                <Clock size={12} className="text-slate-400 group-hover:text-emerald-500" />
                                <span className="font-black text-slate-500 text-[10px]  tracking-wider group-hover:text-emerald-700">{new Date(submission.submitted_at).toLocaleString('en-GB')}</span>
                             </div>
                          </td>
                          <td className="p-8 text-center">
                            <span className={`px-6 py-2 rounded-full text-[9px] font-black  tracking-widest border transition-all ${
                              submission.status === 'submitted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              submission.status === 'graded' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                              'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {submission.status}
                            </span>
                          </td>
                          <td className="p-8 text-right">
                             <button className="relative bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[9px]   shadow-xl hover:bg-emerald-600 transition-all active:scale-95 group/btn  overflow-hidden">
                                <span className="relative z-10 flex items-center gap-2 font-black ">Evaluate <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" /></span>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Tablet Grid */}
                <div className="lg:hidden space-y-6">
                   {submissions.map((submission) => (
                      <div key={submission.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 group hover:shadow-xl transition-all">
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-300 text-lg ">{submission.student_name?.charAt(0)}</div>
                               <div>
                                  <h3 className="font-black text-slate-900  text-sm leading-tight  uppercase">{submission.student_name}</h3>
                                  <p className="text-[8px] font-black text-slate-400  tracking-widest mt-0.5">ID: {submission.student_id}</p>
                               </div>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black  tracking-widest border ${
                              submission.status === 'submitted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              submission.status === 'graded' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                              'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {submission.status}
                            </span>
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-black text-slate-400  tracking-wider bg-slate-50 px-4 py-2 rounded-xl">
                            <div className="flex items-center gap-2"><Clock size={12}/> {new Date(submission.submitted_at).toLocaleDateString()}</div>
                            <span>{new Date(submission.submitted_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         </div>
                         <button className="w-full text-[10px] font-black   bg-slate-900 text-white py-4 rounded-2xl hover:bg-emerald-600 transition-all  active:scale-95">
                            Evaluate Submission
                         </button>
                      </div>
                   ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- IDLE STATE --- */}
        {!selectedHW && !loading && homeworks.length > 0 && (
          <div className="py-40 text-center space-y-10 group bg-white rounded-[5rem] shadow-sm border border-slate-100">
             <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-4 shadow-inner text-6xl group-hover:scale-110 transition-transform duration-1000 grayscale opacity-40">📊</div>
             <div className="space-y-4 px-10">
                <h4 className="text-3xl font-black text-slate-900   ">Fleet Awaiting Select</h4>
                <p className="max-w-md mx-auto text-slate-400 font-black text-[10px]   leading-relaxed">
                  Select an assignment fleet from the hub above to initiate institutional submission oversight and evaluation protocols.
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherHomework;
