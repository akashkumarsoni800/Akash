import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 ChevronLeft, BookOpen, Clock, 
 CheckCircle2, AlertCircle, RefreshCw, 
 Plus, FileText, Send, Calendar, ShieldCheck, Zap
} from 'lucide-react';

const StudentHomework = () => {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(true);
 const [homeworks, setHomeworks] = useState<any[]>([]);
 const [studentData, setStudentData] = useState<any>(null);

 useEffect(() => {
  fetchHomework();
 }, []);

 const fetchHomework = async () => {
  try {
   setLoading(true);
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) return navigate('/');

   const { data: student } = await supabase.from('students')
    .select('*')
    .eq('email', user.email)
    .limit(1)
    .maybeSingle();

   if (!student) {
    toast.error("Profile not found");
    return;
   }
   setStudentData(student);

   const { data: hwData } = await supabase.from('homework')
    .select(`
     *,
     homework_submissions!left(*)
    `)
    .eq('class_name', student.class_name)
    .order('due_date', { ascending: true });

   const formattedHW = (hwData || []).map(hw => {
    const studentSubmission = hw.homework_submissions?.find((s: any) => s.student_id === student.id);
    return {
     ...hw,
     isSubmitted: !!studentSubmission,
     submissionDate: studentSubmission?.submitted_at
    };
   });

   setHomeworks(formattedHW);
  } catch (error: any) {
   toast.error(error.message);
  } finally {
   setLoading(false);
  }
 };

 if (loading) return (
  <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
    <div className="relative">
     <RefreshCw size={60} className="animate-spin text-purple-600/20"/>
     <BookOpen size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-600" />
    </div>
    <p className="font-black  text-slate-400 text-[10px] mt-8 text-center">Syncing Assignment List...</p>
  </div>
 );

 return (
  <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-10 pb-32 font-inter">
   <div className="max-w-6xl mx-auto space-y-12">
    
    {/* --- NAVIGATION & CONTEXT --- */}
    <div className="flex justify-between items-center">
     <button 
      onClick={() => navigate(-1)} 
      className="group flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-purple-200 transition-all active:scale-95"
     >
      <ChevronLeft size={18} className="text-purple-600 group-hover:-translate-x-1 transition-transform" />
      <span className="font-black tracking-widest text-[10px] text-slate-600">Portal Exit</span>
     </button>

     <div className="bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4 group">
       <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
       <span className="text-[10px] font-black  text-purple-400 ">Digital Classroom Active</span>
     </div>
    </div>

    {/* --- DYNAMIC HEADER --- */}
    <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="">
       <h1 className="text-5xl md:text-7xl font-black text-slate-900  leading-none uppercase">
        Academic<br/>
        <span className="text-purple-600">Assets</span>
       </h1>
       <p className="text-slate-400 font-black text-[10px] mt-4 flex items-center gap-2">
        <ShieldCheck size={12} className="text-purple-500" /> Paid Scholastic Tasks & Resource List
       </p>
      </motion.div>
      
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all">
       <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl shadow-slate-200 group-hover:scale-110 transition-transform">📚</div>
       <div>
        <p className="text-[9px] font-black text-slate-400  mb-1">Task Density</p>
        <p className="text-3xl font-black text-slate-900 ">{homeworks.length} Assignments</p>
       </div>
      </div>
    </div>

    {/* --- ASSIGNMENT TERMINAL --- */}
    <div className="space-y-10">
     <AnimatePresence>
      {homeworks.length > 0 ? homeworks.map((hw, idx) => (
       <motion.div 
        key={idx}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.1 }}
        className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl hover:border-purple-100 transition-all duration-700"
       >
         <div className="flex flex-col lg:flex-row">
          {/* Status Sidebar */}
          <div className={`p-12 lg:w-96 flex flex-col justify-center items-center text-center relative transition-colors duration-500 ${
            hw.isSubmitted ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
          }`}>
            <div className="absolute top-0 left-0 w-full h-[6px] opacity-20 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <div className="p-8 rounded-[2rem] bg-white shadow-xl mb-6 group-hover:scale-110 transition-transform duration-500">
             {hw.isSubmitted ? <CheckCircle2 size={40}/> : <Clock size={40} className="animate-pulse"/>}
            </div>
            <p className="text-[10px] font-black  ">{hw.subject || 'Core Discipline'}</p>
            <h3 className="text-3xl font-black  mt-2 uppercase">{hw.isSubmitted ? 'Authenticated' : 'Pending'}</h3>
            {hw.submissionDate && (
             <div className="mt-4 flex items-center gap-2 bg-emerald-100/50 px-4 py-1.5 rounded-full">
              <Zap size={10} className="text-emerald-600" />
              <p className="text-[9px] font-black text-emerald-700 tracking-widest">{new Date(hw.submissionDate).toLocaleDateString()} Logged</p>
             </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 p-12 md:p-16 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-16 -top-16 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity duration-1000 rotate-12">
             <BookOpen size={300}/>
            </div>
            
            <div className="relative z-10 space-y-8">
             <div className="space-y-4">
               <h2 className="text-3xl md:text-5xl font-black text-slate-900  leading-none uppercase">{hw.title}</h2>
               <div className="flex items-center gap-4 text-[10px] font-black  text-slate-400">
                <Calendar size={16} className="text-purple-600"/> 
                <span className="bg-slate-100 px-4 py-1.5 rounded-xl">Deadline: {new Date(hw.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
               </div>
             </div>

             <p className="text-slate-600 font-black text-lg leading-relaxed max-w-2xl border-l-[6px] border-slate-50 pl-8 py-2 group-hover:border-purple-100 transition-colors">
              {hw.description || 'School instructions for this task manifest have not been detailed. Please consult individual faculty nodes.'}
             </p>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-6 items-center relative z-10">
             <button className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px]  shadow-xl shadow-slate-200 hover:bg-purple-600 transition-all flex items-center justify-center gap-3 active:scale-95 group/btn">
               <FileText size={18} className="group-hover/btn:rotate-12 transition-transform"/> Access Materials
             </button>
             {!hw.isSubmitted && (
              <button className="w-full sm:w-auto bg-purple-600 text-white px-12 py-5 rounded-2xl font-black text-[10px]  shadow-xl shadow-purple-100 hover:bg-slate-900 transition-all flex items-center justify-center gap-3 active:scale-95 group/submit">
                <Send size={18} className="group-hover/submit:translate-x-1 group-hover/submit:-translate-y-1 transition-transform"/> Submit Execution
              </button>
             )}
            </div>
          </div>
         </div>
       </motion.div>
      )) : (
       <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 shadow-inner group"
       >
         <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-6xl shadow-inner group-hover:rotate-12 transition-transform duration-500">📚</div>
         <div className="space-y-4">
          <h3 className="text-3xl font-black text-slate-900  uppercase">Repository Clear</h3>
          <p className="max-w-md mx-auto text-slate-400 font-black text-[10px]  leading-relaxed px-10">
           No pending assignments detected for your current cohort. Maintain operational readiness for upcoming task emissions.
          </p>
         </div>
       </motion.div>
      )}
     </AnimatePresence>
    </div>
   </div>
  </div>
 );
};

export default StudentHomework;
