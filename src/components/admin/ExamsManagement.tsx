import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
 Plus, FileText, Calendar, 
 Trash2, ShieldCheck, Zap, 
 ChevronRight, Info, RefreshCw,
 Search, BookOpen, Clock,
 MoreVertical, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ExamsManagement() {
 const [exams, setExams] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [formData, setFormData] = useState({
  title: '',
  examDate: '',
  subjects: ''
 });

 useEffect(() => {
  fetchExams();
 }, []);

 const fetchExams = async () => {
  setLoading(true);
  try {
   const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('exam_date', { ascending: false });

   if (error) throw error;
   setExams(data || []);
  } catch (err: any) {
   toast.error("Sync Error: " + err.message);
  } finally {
   setLoading(false);
  }
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.title || !formData.subjects) return toast.error("All parameters required.");

  setLoading(true);
  try {
   const subjectsArray = formData.subjects.split(',').map(s => s.trim()).filter(s => s);
   const { error } = await supabase
    .from('exams')
    .insert([{
     title: formData.title,
     exam_date: formData.examDate,
     subjects: subjectsArray
    }]);

   if (error) throw error;
   
   toast.success("Identity Locked: Exam Scheduled 🎯");
   setIsModalOpen(false);
   setFormData({ title: '', examDate: '', subjects: '' });
   fetchExams();
  } catch (err: any) {
   toast.error(err.message);
  } finally {
   setLoading(false);
  }
 };

 const deleteExam = async (id: string) => {
  if (!window.confirm("Confirm deletion of this assessment node?")) return;
  try {
   const { error } = await supabase.from('exams').delete().eq('id', id);
   if (error) throw error;
   toast.success("Assessment Purged");
   fetchExams();
  } catch (err: any) {
   toast.error(err.message);
  }
 };

 return (
  <div className="space-y-8">
   
   {/* --- TOP BAR --- */}
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
     <div className="space-y-1">
      <h3 className="text-2xl font-black text-slate-900  leading-none uppercase">Exam List</h3>
      <p className="text-[10px] font-black text-slate-400 tracking-widest mt-1">Manage school examinations</p>
     </div>
     <button 
      onClick={() => setIsModalOpen(true)}
      className="premium-button-admin bg-slate-950 text-white hover:bg-blue-600 border-none shadow-xl"
     >
      <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Add Exam
     </button>
   </div>

   {/* --- STATS MINI --- */}
   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
     <div className="premium-card p-6 shadow-sm">
      <p className="text-[9px] font-black text-slate-400 tracking-widest mb-2">Active Exams</p>
      <p className="text-2xl font-black text-slate-900 leading-none">{exams.length}</p>
     </div>
     <div className="premium-card p-6 shadow-sm">
      <p className="text-[9px] font-black text-slate-400 tracking-widest mb-2">Sync Status</p>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
        <p className="text-[10px] font-black text-emerald-600  leading-none">System Online</p>
      </div>
     </div>
   </div>

   {/* --- EXAM GRID --- */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
     <AnimatePresence mode="popLayout">
      {exams.map((exam, idx) => (
        <motion.div 
         key={exam.id}
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: idx * 0.05 }}
         className="premium-card p-8 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
        >
         <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={() => deleteExam(exam.id)} className="p-2 bg-rose-50 text-rose-500 rounded-[5px] hover:bg-rose-500 hover:text-white transition-all">
            <Trash2 size={16} />
           </button>
         </div>
 
         <div className="space-y-6">
           <div className="w-12 h-12 bg-blue-50 rounded-[5px] flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
            <FileText size={24} />
           </div>
           <div>
            <h4 className="text-xl font-black text-slate-900  leading-none mb-2">{exam.title}</h4>
            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-slate-300" />
              <p className="text-[10px] font-black text-slate-400 tracking-wide">{exam.exam_date || 'TBD'}</p>
            </div>
           </div>

           <div className="flex flex-wrap gap-2">
            {exam.subjects?.map((sub: string) => (
              <span key={sub} className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black  border border-slate-100">{sub}</span>
            ))}
           </div>
         </div>
        </motion.div>
      ))}
     </AnimatePresence>

     {exams.length === 0 && !loading && (
      <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[5px]">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
         <Search size={40} />
        </div>
        <p className="text-[10px] font-black text-slate-300  mb-2">No exams scheduled yet</p>
        <p className="text-[9px] font-black text-slate-200 tracking-widest leading-relaxed">Add a new exam to see it here.</p>
      </div>
     )}
   </div>

   {/* --- ADD MODAL --- */}
   <AnimatePresence>
     {isModalOpen && (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
        <motion.div 
         initial={{ scale: 0.95, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         exit={{ scale: 0.95, opacity: 0 }}
         className="bg-white w-full max-w-lg rounded-[5px] p-10 md:p-14 shadow-2xl border border-slate-100"
        >
         <div className="flex justify-between items-center mb-10">
           <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900  leading-none uppercase">Add Exam</h2>
            <p className="text-[10px] font-black text-slate-400 tracking-widest mt-1">Create a new exam schedule</p>
           </div>
           <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 rounded-[5px] hover:bg-slate-100 transition-all">
            <Plus size={20} className="rotate-45" />
           </button>
         </div>

         <form onSubmit={handleSubmit} className="space-y-8">
           <div className="space-y-8">
            <InputField 
             label="Exam Name" 
             icon={Zap} 
             placeholder="e.g., Annual Exam 2026..."
             value={formData.title}
             onChange={(e: any) => setFormData({ ...formData, title: e.target.value })}
            />
            <InputField 
             label="Exam Date" 
             type="date"
             icon={Calendar} 
             value={formData.examDate}
             onChange={(e: any) => setFormData({ ...formData, examDate: e.target.value })}
            />
            <div className="space-y-2 group">
             <label className="block text-[9px] font-black text-slate-400  ml-2 transition-colors group-focus-within:text-blue-600">Subjects</label>
             <div className="relative">
              <BookOpen className="absolute left-6 top-6 text-slate-200 group-focus-within:text-blue-400 transition-colors" size={18} />
              <textarea 
               className="w-full pl-16 pr-8 py-3 bg-slate-50 border-none rounded-[5px] font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all text-sm placeholder:text-slate-200 min-h-[120px] resize-none"
               placeholder="Mathematics, Physics, Chemistry... (comma separated)"
               value={formData.subjects}
               onChange={(e: any) => setFormData({ ...formData, subjects: e.target.value })}
              />
             </div>
            </div>
           </div>

           <div className="flex gap-4 pt-6">
            <button type="submit" disabled={loading} className="flex-1 premium-button-admin bg-slate-950 text-white py-3 hover:bg-blue-600 border-none shadow-xl">
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <><CheckCircle2 size={18} /> Save Exam</>}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 bg-slate-50 text-slate-400 py-3 rounded-[5px] font-black  text-[10px] hover:bg-slate-100 hover:text-slate-600 transition-all">Cancel</button>
           </div>
         </form>
        </motion.div>
      </div>
     )}
   </AnimatePresence>

  </div>
 );
}

const InputField = ({ label, icon: Icon, ...props }: any) => (
 <div className="space-y-2 group/input">
  <label className="block text-[9px] font-black text-slate-400  ml-2 transition-colors group-focus-within/input:text-blue-600">{label}</label>
  <div className="relative">
   {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within/input:text-blue-400 transition-colors" size={18} />}
   <input className={`premium-input text-sm placeholder:text-slate-200 ${Icon ? 'pl-16' : 'px-8'} py-3`} {...props} />
  </div>
 </div>
);
