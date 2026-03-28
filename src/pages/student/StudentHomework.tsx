import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 ChevronLeft, BookOpen, Clock, 
 CheckCircle2, AlertCircle, RefreshCw, 
 Plus, FileText, Send, Calendar, ShieldCheck, Zap
} from 'lucide-react';
import { useGetStudentProfile, useGetStudentHomework } from '../../hooks/useQueries';

const StudentHomework = () => {
 const navigate = useNavigate();
 const [userEmail, setUserEmail] = useState<string | null>(null);

 // 1. Identify User
 useEffect(() => {
  const checkUser = async () => {
   const { data: { user } } = await supabase.auth.getUser();
   if (user?.email) {
    setUserEmail(user.email);
   } else {
    navigate('/');
   }
  };
  checkUser();
 }, [navigate]);

 // 2. ✅ Persistent Hooks for Offline Support
 const { data: student, isLoading: profileLoading } = useGetStudentProfile(userEmail || '');
 const studentId = student?.id; // Internal database ID for join check
 const className = student?.class_name || '';

 const { data: rawHomeworks = [], isLoading: hwLoading } = useGetStudentHomework(className);

 const isLoading = profileLoading || hwLoading;

 // 3. Format Homeworks with local submission status
 const homeworks = rawHomeworks.map((hw: any) => {
  const studentSubmission = hw.homework_submissions?.find((s: any) => s.student_id === studentId);
  return {
   ...hw,
   isSubmitted: !!studentSubmission,
   submissionDate: studentSubmission?.submitted_at
  };
 });

 if (isLoading && !student) return (
  <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
    <div className="relative">
     <RefreshCw size={60} className="animate-spin text-purple-600/20"/>
     <BookOpen size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-600" />
    </div>
    <p className="font-black  text-slate-400 text-[10px] mt-8 text-center uppercase">Loading Homework List...</p>
  </div>
 );

 return (
  <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-10 pb-32 font-inter">
   <div className="max-w-full mx-auto space-y-12">
    
    {/* --- NAVIGATION & CONTEXT --- */}
    <div className="flex justify-between items-center">
     <button 
      onClick={() => navigate(-1)} 
      className="group flex items-center gap-3 bg-white px-6 py-3 rounded-[5px] shadow-sm border border-slate-100 hover:shadow-2xl active:scale-95 tracking-widest hover:border-purple-200 transition-all active:scale-95"
     >
      <ChevronLeft size={18} className="text-purple-600 group-hover:-translate-x-1 transition-transform" />
      <span className="font-black tracking-widest text-[10px] text-slate-600 uppercase">Back</span>
     </button>

     <div className="bg-slate-900 px-6 py-3 rounded-[5px] border border-slate-800 shadow-2xl active:scale-95 tracking-widest flex items-center gap-4 group">
       <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
       <span className="text-[10px] font-black  text-purple-400 uppercase">Classroom Online</span>
     </div>
    </div>

    {/* --- DYNAMIC HEADER --- */}
    <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="">
       <h1 className="text-5xl md:text-7xl font-black text-slate-900  leading-none uppercase">
        Academic<br/>
        <span className="text-purple-600">Material</span>
       </h1>
       <p className="text-slate-400 font-black text-[10px] mt-4 flex items-center gap-2 uppercase">
        <ShieldCheck size={12} className="text-purple-500" /> Homework & Study Material
       </p>
      </motion.div>
      
      <div className="bg-white border border-slate-100 rounded-[5px] p-6 shadow-sm flex items-center gap-8 group hover:shadow-2xl active:scale-95 tracking-widest transition-all">
       <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-2xl active:scale-95 tracking-widest shadow-slate-200 group-hover:scale-110 transition-transform">📚</div>
       <div>
        <p className="text-[9px] font-black text-slate-400  mb-1 uppercase">Task Density</p>
        <p className="text-3xl font-black text-slate-900 uppercase">{homeworks.length} Total</p>
       </div>
      </div>
    </div>

    {/* --- HOMEWORK LIST --- */}
    <div className="space-y-10">
     <AnimatePresence>
      {homeworks.length > 0 ? homeworks.map((hw: any, idx: number) => (
       <motion.div 
        key={idx}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.1 }}
        className="bg-white rounded-[5px] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl hover:border-purple-100 transition-all duration-700"
       >
         <div className="flex flex-col lg:flex-row">
          {/* Status Sidebar */}
          <div className={`p-12 lg:w-96 flex flex-col justify-center items-center text-center relative transition-colors duration-500 ${
            hw.isSubmitted ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
          }`}>
            <div className="absolute top-0 left-0 w-full h-[6px] opacity-20 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <div className="p-8 rounded-[5px] bg-white shadow-2xl active:scale-95 tracking-widest mb-6 group-hover:scale-110 transition-transform duration-500">
             {hw.isSubmitted ? <CheckCircle2 size={40}/> : <Clock size={40} className="animate-pulse"/>}
            </div>
            <p className="text-[10px] font-black uppercase ">{hw.subject || 'Subject'}</p>
            <h3 className="text-3xl font-black  mt-2 uppercase">{hw.isSubmitted ? 'Completed' : 'Pending'}</h3>
            {hw.submissionDate && (
             <div className="mt-4 flex items-center gap-2 bg-emerald-100/50 px-4 py-1.5 rounded-full">
              <Zap size={10} className="text-emerald-600" />
              <p className="text-[9px] font-black text-emerald-700 tracking-widest uppercase">{new Date(hw.submissionDate).toLocaleDateString()} Submitted</p>
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
                <span className="bg-slate-100 px-4 py-1.5 rounded-[5px] uppercase">Deadline: {new Date(hw.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
               </div>
             </div>

             <p className="text-slate-600 font-black text-lg leading-relaxed max-w-2xl border-l-[6px] border-slate-50 pl-8 py-2 group-hover:border-purple-100 transition-colors uppercase">
              {hw.description || 'Instructions for this homework have not been added yet. Please ask your teacher.'}
             </p>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-6 items-center relative z-10">
             <button className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-[5px] font-black text-[10px]  shadow-2xl active:scale-95 tracking-widest shadow-slate-200 hover:bg-purple-600 transition-all flex items-center justify-center gap-3 active:scale-95 group/btn uppercase">
               <FileText size={18} className="group-hover/btn:rotate-12 transition-transform"/> View Materials
             </button>
             {!hw.isSubmitted && (
              <button className="w-full sm:w-auto bg-purple-600 text-white px-12 py-5 rounded-[5px] font-black text-[10px]  shadow-2xl active:scale-95 tracking-widest shadow-purple-100 hover:bg-slate-900 transition-all flex items-center justify-center gap-3 active:scale-95 group/submit uppercase">
                <Send size={18} className="group-hover/submit:translate-x-1 group-hover/submit:-translate-y-1 transition-transform"/> Submit Now
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
         className="py-32 text-center bg-white rounded-[5px] border-4 border-dashed border-slate-100 shadow-inner group"
       >
         <div className="w-32 h-32 bg-slate-50 rounded-[5px] flex items-center justify-center mx-auto mb-8 text-6xl shadow-inner group-hover:rotate-12 transition-transform duration-500">📚</div>
         <div className="space-y-4">
          <h3 className="text-3xl font-black text-slate-900  uppercase">No Homework</h3>
          <p className="max-w-md mx-auto text-slate-400 font-black text-[10px]  leading-relaxed px-10 uppercase">
           No pending homework found for your class. Check back later for new assignments.
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
