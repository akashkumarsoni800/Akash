import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { 
 Plus, FileText, Calendar, 
 Trash2, ShieldCheck, Zap, 
 ChevronRight, Info, RefreshCw,
 Search, BookOpen, Clock,
 MoreVertical, CheckCircle2,
 X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useGetAllExams, useDeleteExam, useAddExam } from '../../hooks/useQueries';

export default function ExamsManagement() {
 // ✅ React Query Hooks for Persistence & Offline Support
 const { data: exams = [], isLoading } = useGetAllExams();
 const { mutate: deleteExam } = useDeleteExam();
 const { mutate: addExam, isPending: isAdding } = useAddExam();

 const [isModalOpen, setIsModalOpen] = useState(false);
 const [formData, setFormData] = useState({
  title: '',
  examDate: '',
  subjects: ''
 });

 const handleDelete = async (id: any) => {
  if (!window.confirm("Purge exam schedule? This protocol is irreversible.")) return;
  deleteExam(id);
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.title || !formData.subjects) return toast.error("All parameters required.");

  const subjectsArray = formData.subjects.split(',').map(s => s.trim()).filter(s => s);
  
  addExam({
   title: formData.title,
   exam_date: formData.examDate,
   subjects: subjectsArray
  }, {
   onSuccess: () => {
    setIsModalOpen(false);
    setFormData({ title: '', examDate: '', subjects: '' });
   }
  });
 };

 if (isLoading) return <div className="py-24 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase animate-pulse">Synchronizing Schedules...</div>;

 return (
  <div className="space-y-8">
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
    <div className="space-y-1">
     <h3 className="text-2xl font-black text-slate-900 leading-none uppercase tracking-tighter">Exam Schedules</h3>
     <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-1">Academic Timelines Active</p>
    </div>
    <button 
     onClick={() => setIsModalOpen(true)}
     className="premium-button-admin flex items-center justify-center gap-3 bg-slate-900 text-white hover:bg-emerald-600 border-none shadow-2xl active:scale-95 transition-all"
    >
     <Plus size={16} /> New Schedule
    </button>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <AnimatePresence mode="popLayout">
     {exams.map((exam: any, idx: number) => (
      <motion.div 
       key={exam.id}
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: idx * 0.05 }}
       className="premium-card p-8 bg-white border border-slate-100 shadow-sm hover:shadow-2xl active:scale-95 transition-all group relative overflow-hidden"
      >
       <div className="absolute top-0 right-0 p-4">
        <button 
         onClick={() => handleDelete(exam.id)}
         className="p-2 text-slate-200 hover:text-rose-500 transition-colors"
        >
         <Trash2 size={16} />
        </button>
       </div>

       <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-emerald-50 rounded-[5px] flex items-center justify-center text-emerald-600">
         <FileText size={24} />
        </div>
        <div>
         <h4 className="text-lg font-black text-slate-900 leading-tight uppercase truncate max-w-[180px]">{exam.title}</h4>
         <div className="flex items-center gap-2 text-slate-400 mt-1">
          <Calendar size={12} />
          <span className="text-[9px] font-black tracking-widest uppercase">{new Date(exam.exam_date).toLocaleDateString()}</span>
         </div>
        </div>
       </div>

       <div className="space-y-3">
        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2">
         <span>Curriculum</span>
         <BookOpen size={12} />
        </div>
        <div className="flex flex-wrap gap-2">
         {exam.subjects?.map((sub: string, i: number) => (
          <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-[5px] text-[9px] font-black tracking-wider uppercase border border-slate-100">
           {sub}
          </span>
         ))}
        </div>
       </div>

       <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2 uppercase">
         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
         <span className="text-[9px] font-black text-slate-400 tracking-widest">Active Schedule</span>
        </div>
        <CheckCircle2 size={14} className="text-slate-100 group-hover:text-emerald-200" />
       </div>
      </motion.div>
     ))}
    </AnimatePresence>
   </div>

   {/* --- NEW EXAM MODAL --- */}
   <AnimatePresence>
    {isModalOpen && (
     <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       onClick={() => setIsModalOpen(false)}
       className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
      />
      <motion.div 
       initial={{ scale: 0.9, opacity: 0, y: 20 }}
       animate={{ scale: 1, opacity: 1, y: 0 }}
       exit={{ scale: 0.9, opacity: 0, y: 20 }}
       className="relative w-full max-w-lg bg-white rounded-[5px] shadow-2xl overflow-hidden"
      >
       <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
        <div className="space-y-1">
         <h3 className="text-xl font-black text-slate-900 uppercase">New Exam Cycle</h3>
         <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Initialize Academic Timeline</p>
        </div>
        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
         <X size={20} className="text-slate-400" />
        </button>
       </div>

       <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-6">
         <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exam Title</label>
          <input 
           required
           value={formData.title}
           onChange={e => setFormData({...formData, title: e.target.value})}
           className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[5px] text-xs font-black focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
           placeholder="E.G. FIRST TERMINAL 2024"
          />
         </div>

         <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commencement Date</label>
          <input 
           required
           type="date"
           value={formData.examDate}
           onChange={e => setFormData({...formData, examDate: e.target.value})}
           className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[5px] text-xs font-black focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
          />
         </div>

         <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subjects (Comma separated)</label>
          <textarea 
           required
           rows={3}
           value={formData.subjects}
           onChange={e => setFormData({...formData, subjects: e.target.value})}
           className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[5px] text-xs font-black focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
           placeholder="Math, English, Science, Hindi..."
          />
         </div>
        </div>

        <button 
         type="submit"
         disabled={isAdding}
         className="w-full py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-[5px] shadow-2xl hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50"
        >
         {isAdding ? 'INITIALIZING...' : 'LOCK TIMELINE'}
        </button>
       </form>
      </motion.div>
     </div>
    )}
   </AnimatePresence>
  </div>
 );
}
