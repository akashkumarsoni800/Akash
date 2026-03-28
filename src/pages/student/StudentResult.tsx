import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 ChevronLeft, GraduationCap, Award, 
 Percent, Layout, FileText, CheckCircle2,
 Printer, Download, ShieldCheck, RefreshCw,
 Search, Target, Zap, ArrowRight, Star
} from 'lucide-react';
import { useGetStudentProfile, useGetStudentResults } from '../../hooks/useQueries';

const StudentResult = () => {
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
 const studentId = student?.student_id || student?.id;
 
 const { data: results = [], isLoading: resLoading } = useGetStudentResults(studentId);

 const isLoading = profileLoading || resLoading;

 if (isLoading && !student) return (
  <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
    <div className="relative">
     <RefreshCw size={60} className="animate-spin text-emerald-600/20"/>
     <GraduationCap size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600" />
    </div>
    <p className="font-black  text-slate-400 text-[10px] mt-8 uppercase">Loading Exam Results...</p>
  </div>
 );

 return (
  <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-10 pb-32 font-inter">
   <div className="max-w-full mx-auto space-y-12">
    
    {/* --- NAVIGATION --- */}
    <div className="flex justify-between items-center">
     <button 
      onClick={() => navigate(-1)} 
      className="group flex items-center gap-3 bg-white px-6 py-3 rounded-[5px] shadow-sm border border-slate-100 hover:shadow-2xl active:scale-95 tracking-widest hover:border-emerald-200 transition-all active:scale-95 uppercase"
     >
      <ChevronLeft size={18} className="text-emerald-600 group-hover:-translate-x-1 transition-transform" />
      <span className="font-black tracking-widest text-[10px] text-slate-600 uppercase">Back</span>
     </button>

     <div className="bg-slate-900 px-6 py-3 rounded-[5px] border border-slate-800 shadow-2xl active:scale-95 tracking-widest flex items-center gap-4 group">
       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
       <span className="text-[10px] font-black  text-emerald-400 uppercase">Results Live</span>
     </div>
    </div>

    {/* --- HEADER --- */}
    <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="">
       <h1 className="text-5xl md:text-7xl font-black text-slate-900  leading-none uppercase">
        Grade<br/>
        <span className="text-emerald-600">Report</span>
       </h1>
       <p className="text-slate-400 font-black text-[10px] mt-4 flex items-center gap-2 uppercase">
        <ShieldCheck size={12} className="text-emerald-500" /> Verified Performance Records
       </p>
      </motion.div>
      
      <div className="bg-white border border-slate-100 rounded-[5px] p-6 shadow-sm flex items-center gap-8 group hover:shadow-2xl active:scale-95 tracking-widest transition-all">
       <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-2xl active:scale-95 tracking-widest shadow-slate-200 group-hover:scale-110 transition-transform">🎓</div>
       <div>
        <p className="text-[9px] font-black text-slate-400  mb-1 uppercase">Your Score</p>
        <p className="text-3xl font-black text-slate-900 uppercase">{results.length} Results Found</p>
       </div>
      </div>
    </div>

    {/* --- RESULTS TABLE / GRID --- */}
    <div className="grid gap-10">
     <AnimatePresence>
      {results.length > 0 ? results.map((res: any, idx: number) => (
       <motion.div 
        key={idx}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: idx * 0.1 }}
        className="bg-white rounded-[5px] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl hover:border-emerald-100 transition-all duration-700"
       >
         <div className="flex flex-col lg:flex-row">
          {/* Badge Section */}
          <div className="p-12 lg:w-96 bg-emerald-50 flex flex-col justify-center items-center text-center relative overflow-hidden group-hover:bg-emerald-600 transition-colors duration-700">
            <div className="absolute top-0 left-0 w-full h-[6px] opacity-20 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <div className="p-10 rounded-[5px] bg-white shadow-2xl active:scale-95 tracking-widest mb-6 group-hover:scale-110 transition-transform duration-500 border border-emerald-50">
             <Award size={64} className="text-emerald-600"/>
            </div>
            <p className="text-[10px] font-black text-emerald-600 group-hover:text-emerald-100 transition-colors uppercase truncate max-w-[200px]">{res.exams?.exam_name || 'Exam'}</p>
            <h3 className="text-4xl font-black text-slate-900 group-hover:text-white mt-2 transition-colors uppercase">PASSED</h3>
          </div>

          {/* Details Section */}
          <div className="flex-1 p-12 md:p-20 relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000">
             <Star size={400} className="rotate-12"/>
            </div>
            
            <div className="relative z-10 space-y-12">
             <div className="space-y-4">
               <h2 className="text-4xl md:text-6xl font-black text-slate-900  leading-none uppercase">{res.exams?.subject || 'Subject'}</h2>
               <div className="flex items-center gap-4 text-[11px] font-black  text-slate-400">
                <Target size={16} className="text-emerald-600"/> 
                <span className="bg-slate-100 px-5 py-2 rounded-[5px] uppercase">Marks: {res.marks_obtained} / {res.exams?.total_marks || '100'}</span>
               </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               <div className="space-y-2">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Percentage</p>
                 <p className="text-2xl font-black text-slate-900 uppercase">{Math.round((res.marks_obtained / (res.exams?.total_marks || 100)) * 100)}%</p>
               </div>
               <div className="space-y-2">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Status</p>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-lg font-black text-emerald-600 uppercase">VERIFIED</p>
                 </div>
               </div>
               <div className="space-y-2">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Security Code</p>
                 <p className="text-lg font-black text-slate-900 uppercase">ASM-SEC-{res.id?.slice(0,4)}</p>
               </div>
             </div>

             <div className="pt-10 border-t border-slate-50 flex flex-col sm:flex-row gap-6">
              <button className="flex-1 bg-slate-900 text-white px-10 py-5 rounded-[5px] font-black text-[10px]  shadow-2xl active:scale-95 tracking-widest shadow-slate-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95 uppercase group/btn">
                <Download size={18} className="group-hover/btn:translate-y-1 transition-transform"/> Download Result
              </button>
              <button className="flex-1 bg-white border border-slate-100 text-slate-400 px-10 py-5 rounded-[5px] font-black text-[10px]  shadow-sm hover:border-emerald-200 hover:text-emerald-600 transition-all flex items-center justify-center gap-3 uppercase active:scale-95 group/print">
                <Printer size={18} className="group-hover/print:scale-110 transition-transform"/> Print Hardcopy
              </button>
             </div>
            </div>
          </div>
         </div>
       </motion.div>
      )) : (
       <div className="py-32 text-center bg-white rounded-[5px] border-4 border-dashed border-slate-100 shadow-inner group">
         <div className="w-32 h-32 bg-slate-50 rounded-[5px] flex items-center justify-center mx-auto mb-8 text-6xl shadow-inner group-hover:rotate-12 transition-transform duration-500">📊</div>
         <div className="space-y-4">
          <h3 className="text-3xl font-black text-slate-900 uppercase">No Results Found</h3>
          <p className="max-w-md mx-auto text-slate-400 font-black text-[10px]  leading-relaxed px-10 uppercase">
           No exam results found in your account. Check back later for new result updates.
          </p>
         </div>
       </div>
      )}
     </AnimatePresence>
    </div>
   </div>
  </div>
 );
};

export default StudentResult;
