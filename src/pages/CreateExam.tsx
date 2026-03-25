import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Calendar, Plus, 
  Trash2, ShieldCheck, Zap, 
  ChevronRight, Layout, Info, Star, 
  ChevronLeft, RefreshCw, BookOpen, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CreateExam = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  
  const [currentSubject, setCurrentSubject] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);

  const handleAddSubject = () => {
    if (!currentSubject.trim()) return;
    if (subjects.includes(currentSubject)) {
      toast.error("Ye subject pehle se add hai!");
      return;
    }
    setSubjects([...subjects, currentSubject]);
    setCurrentSubject('');
  };

  const removeSubject = (sub: string) => {
    setSubjects(subjects.filter(s => s !== sub));
  };

  const handleCreateExam = async () => {
    if (!examTitle || subjects.length === 0) {
      toast.error("Please enter Exam Name and at least one Subject.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('exams')
        .insert([
          {
            title: examTitle,
            exam_date: examDate,
            subjects: subjects
          }
        ]);

      if (error) throw error;

      toast.success("Exam Created Successfully! 🎉");
      navigate('/admin/dashboard');

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to create exam.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-10 pb-32 font-inter">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900   leading-none uppercase">
                Exam<br/>
                <span className="text-purple-600">System</span>
              </h1>
              <p className="text-slate-400 font-black  text-[10px]  mt-4 flex items-center gap-2">
                <ShieldCheck size={12} className="text-purple-500" /> Paid Scholastic Assessment Architect
              </p>
           </motion.div>

           <div className="flex bg-white border border-slate-100 rounded-3xl p-5 shadow-sm items-center gap-6 group hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm border border-purple-100 group-hover:scale-110 transition-transform">
                 <FileText size={28} />
              </div>
              <div className="pr-4">
                 <p className="text-[10px] font-black text-slate-400  tracking-widest mb-1">Active Batch</p>
                 <p className="text-xl font-black text-slate-900   leading-none">Session 2026-27</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
           
           {/* --- LEFT: MAIN CONFIG --- */}
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             className="lg:col-span-3 bg-white p-10 md:p-14 rounded-[4rem] shadow-sm border border-slate-100 space-y-12 relative overflow-hidden"
           >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 to-blue-600" />
              
              <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                   <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                      <Layout size={20} />
                   </div>
                   <h2 className="text-2xl font-black text-slate-900    uppercase">List Parameters</h2>
                </div>

                <div className="grid grid-cols-1 gap-8">
                   <InputField 
                     label="Examination Title *" 
                     name="title" 
                     placeholder="e.g. Periodic Assessment 01" 
                     value={examTitle}
                     onChange={(e: any) => setExamTitle(e.target.value)} 
                     required 
                     icon={FileText}
                   />

                   <InputField 
                     label="Commencement Date" 
                     name="date" 
                     type="date" 
                     value={examDate}
                     onChange={(e: any) => setExamDate(e.target.value)} 
                     icon={Calendar}
                   />
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                   <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                      <BookOpen size={20} />
                   </div>
                   <h2 className="text-2xl font-black text-slate-900    uppercase">Subject Arsenal</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-3">
                    <div className="relative flex-1 group">
                       <Plus className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-purple-400 transition-colors" size={18} />
                       <input 
                         type="text" 
                         placeholder="Synthesize Subject Index (e.g. Physics)"
                         className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-purple-100 focus:bg-white transition-all  text-sm"
                         value={currentSubject}
                         onChange={e => setCurrentSubject(e.target.value)}
                         onKeyPress={e => e.key === 'Enter' && handleAddSubject()}
                       />
                    </div>
                    <button 
                      onClick={handleAddSubject}
                      className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black   text-[10px] shadow-lg hover:bg-purple-600 active:scale-95 transition-all "
                    >
                      Initialize
                    </button>
                  </div>

                  <AnimatePresence>
                    <div className="flex flex-wrap gap-3">
                      {subjects.map((sub, index) => (
                        <motion.span 
                          key={sub}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="bg-white border border-slate-100 pl-6 pr-3 py-3 rounded-2xl text-[10px] font-black   text-slate-600 flex items-center gap-4 shadow-sm hover:border-purple-200 hover:text-purple-600 transition-all group "
                        >
                          {sub}
                          <button onClick={() => removeSubject(sub)} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
                             <Trash2 size={14} />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  </AnimatePresence>
                  {subjects.length === 0 && (
                    <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
                       <p className="text-[10px] font-black text-slate-300  tracking-widest">Awaiting Subject Induction...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50 flex flex-col sm:flex-row gap-6">
                 <button 
                   onClick={handleCreateExam}
                   disabled={loading}
                   className="flex-1 bg-slate-900 text-white px-10 py-6 rounded-[2rem] font-black   text-xs shadow-2xl shadow-slate-200 hover:bg-purple-600 active:scale-95 transition-all flex items-center justify-center gap-4 group "
                 >
                   {loading ? (
                      <RefreshCw className="animate-spin" size={20} />
                   ) : (
                      <><ShieldCheck size={24} className="group-hover:rotate-12 transition-transform" /> Authorize Exam Fleet</>
                   )}
                 </button>
                 <button 
                   onClick={() => navigate('/admin/dashboard')}
                   className="px-10 py-6 rounded-[2rem] font-black   text-[10px] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all "
                 >
                   Abort Logic
                 </button>
              </div>
           </motion.div>

           {/* --- RIGHT: INSIGHTS / STATS --- */}
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
             className="lg:col-span-2 space-y-8"
           >
              <div className="bg-slate-900 p-10 rounded-[4rem] text-white space-y-10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-3xl group-hover:bg-purple-500/40 transition-all duration-1000" />
                 <div className="relative z-10 space-y-2">
                    <p className="text-[10px] font-black text-purple-400   ">School Insight</p>
                    <h3 className="text-4xl font-black   leading-none  uppercase">Assessment<br/>Table</h3>
                 </div>

                 <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-end border-b border-white/5 pb-6">
                       <p className="text-[10px] font-black text-slate-400  tracking-widest">Subject Density</p>
                       <p className="text-3xl font-black  ">{subjects.length}</p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-6">
                       <p className="text-[10px] font-black text-slate-400  tracking-widest">Temporal Status</p>
                       <p className="text-xl font-black   text-blue-400 ">{examDate ? 'Scheduled' : 'Pending'}</p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-6">
                       <p className="text-[10px] font-black text-slate-400  tracking-widest">Paid Level</p>
                       <p className="text-xl font-black   text-purple-400 ">Lvl 07 Admin</p>
                    </div>
                 </div>

                 <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-white/40  tracking-widest leading-relaxed">
                       Notice: The generated matrix will be broadcasted to all cohort terminals upon authorization. Ensure sequential validation.
                    </p>
                 </div>
              </div>

              <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                       <Info size={20} />
                    </div>
                    <h4 className="text-lg font-black text-slate-900   ">Operational Help</h4>
                 </div>
                 <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                       <p className="text-[11px] font-black text-slate-500 leading-relaxed">Enter precise titles for institutional indexing.</p>
                    </li>
                    <li className="flex items-start gap-4">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                       <p className="text-[11px] font-black text-slate-500 leading-relaxed">Subject arsenal supports batch synthesis.</p>
                    </li>
                    <li className="flex items-start gap-4">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                       <p className="text-[11px] font-black text-slate-500 leading-relaxed">Date configuration is non-mandatory for drafts.</p>
                    </li>
                 </ul>
              </div>
           </motion.div>

        </div>

      </div>
    </div>
  );
};

const InputField = ({ label, icon: Icon, ...props }: any) => (
  <div className="space-y-1 group">
    <label className="block text-[9px] font-black text-slate-400   ml-2 transition-colors group-focus-within:text-purple-500">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-purple-400 transition-colors" size={18} />}
      <input className={`w-full ${Icon ? 'pl-16' : 'px-8'} py-5 bg-slate-50 border-none rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-purple-100 focus:bg-white transition-all  text-sm`} {...props} />
    </div>
  </div>
);

export default CreateExam;
