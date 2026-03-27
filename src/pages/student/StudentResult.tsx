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

const StudentResult = () => {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(true);
 const [studentData, setStudentData] = useState<any>(null);
 const [results, setResults] = useState<any[]>([]);

 useEffect(() => {
  fetchResults();
 }, []);

 const fetchResults = async () => {
  try {
   setLoading(true);
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) return navigate('/');

   // 1. Get Student Info
   const { data: student } = await supabase.from('students')
    .select('*')
    .eq('email', user.email)
    .limit(1)
    .maybeSingle();

   if (!student) {
    toast.error("Scholar profile not found.");
    return;
   }
   setStudentData(student);

   // 2. Get Results
   const { data: resData } = await supabase.from('results')
    .select('*, exams(title)')
    .eq('student_id', student.student_id || student.id)
    .order('uploaded_at', { ascending: false });

   setResults(resData || []);
  } catch (error: any) {
   toast.error(error.message);
  } finally {
   setLoading(false);
  }
 };

 if (loading) return (
  <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
    <div className="relative">
     <RefreshCw size={60} className="animate-spin text-emerald-600/20"/>
     <GraduationCap size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600" />
    </div>
    <p className="font-black  text-slate-400 text-[10px] mt-8">Syncing Scholastic ...</p>
  </div>
 );

 return (
  <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-10 pb-32 font-inter">
   <div className="max-w-full mx-auto space-y-12">
    
    {/* --- NAVIGATION & CONTEXT --- */}
    <div className="flex justify-between items-center">
     <button 
      onClick={() => navigate(-1)} 
      className="group flex items-center gap-3 bg-white px-6 py-3 rounded-[5px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-emerald-200 transition-all active:scale-95"
     >
      <ChevronLeft size={18} className="text-emerald-600 group-hover:-translate-x-1 transition-transform" />
      <span className="font-black tracking-widest text-[10px] text-slate-600">Portal Exit</span>
     </button>

     <div className="hidden md:flex items-center gap-3 bg-white px-6 py-3 rounded-[5px] border border-slate-100 shadow-sm">
       <Star size={16} className="text-amber-400 fill-amber-400" />
       <span className="text-[10px] font-black tracking-widest text-slate-400 ">Academic Distinction Protocol</span>
     </div>
    </div>

    {/* --- MAIN PORTFOLIO --- */}
    {studentData && results.length > 0 ? (
     <div className="space-y-12">
      
      {/* 🟢 PRESTIGE HEADER CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-[5px] p-8 md:p-16 text-white shadow-2xl relative overflow-hidden group border-b-[12px] border-emerald-500/20"
      >
        <div className="absolute -bottom-20 -right-20 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 rotate-12 group-hover:rotate-0">
         <GraduationCap size={400}/>
        </div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-center gap-12">
         <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
           <div className="w-24 h-24 md:w-40 md:h-40 bg-white/5 backdrop-blur-3xl rounded-[5px] flex items-center justify-center text-4xl md:text-6xl font-black border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-700 ">
            {studentData.photo_url ? (
             <img src={studentData.photo_url} className="w-full h-full object-cover rounded-[5px]" alt="Profile" />
            ) : studentData.full_name[0].toUpperCase()}
           </div>
           <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <ShieldCheck className="text-emerald-400" size={18}/>
              <span className="text-[9px] md:text-[10px] font-black  text-emerald-400/80 ">Verified Scholastic Identity</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-black  leading-none uppercase">{studentData.full_name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <span className="bg-white/5 px-6 py-2 rounded-[5px] text-[10px] font-black border border-white/5 tracking-widest backdrop-blur-md">Node {studentData.class_name}</span>
              <span className="bg-white/5 px-6 py-2 rounded-[5px] text-[10px] font-black border border-white/5 tracking-widest backdrop-blur-md">List #{studentData.roll_no}</span>
            </div>
           </div>
         </div>

         <div className="flex flex-row md:flex-col gap-5 w-full md:w-auto">
           <PremiumQuickStat label="Academic Standing" value={results[0].status} accent="emerald" />
           <PremiumQuickStat label="Aggregate Performance" value={`${Math.round(results[0].percentage)}%`} accent="emerald" />
         </div>
        </div>
      </motion.div>

      {/* 🔵 SCHOLASTIC METRICS BOARD */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-[5px] p-10 md:p-20 shadow-sm border border-slate-100 relative overflow-hidden group"
      >
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-10">
         <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl rotate-[15deg] group-hover:rotate-0 transition-transform duration-500">
            <FileText size={28}/>
           </div>
           <div>
            <h3 className="text-3xl font-black text-slate-900  uppercase">{results[0].exams?.title || 'Comprehensive Examination'}</h3>
            <p className="text-[11px] font-black text-slate-400  mt-1"> Session: 2024-25</p>
           </div>
         </div>
         
         <div className="flex items-center gap-4">
           <button onClick={() => window.print()} className="bg-slate-50 text-slate-900 px-8 py-5 rounded-[5px] font-black text-[11px] tracking-widest shadow-sm border border-slate-100 hover:bg-slate-900 hover:text-white transition-all flex items-center gap-3 ">
            <Printer size={18}/> Print 
           </button>
         </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <AnimatePresence>
          {results[0].marks_data?.map((m:any, i:number) => (
           <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i }}
            key={i} 
            className="bg-slate-50/50 p-8 rounded-[5px] border border-transparent hover:border-emerald-200 hover:bg-white transition-all duration-500 group/row shadow-sm hover:shadow-xl group-hover:border-slate-100"
           >
             <div className="flex justify-between items-end">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200"></div>
                 <span className="font-black text-slate-400 text-[9px] group-hover/row:text-emerald-600 transition-colors">Course Metric</span>
                </div>
                <h4 className="text-2xl font-black text-slate-800  ">{m.subject}</h4>
              </div>
              <div className="text-right">
                <span className="text-5xl font-black text-slate-900 ">{m.marks}</span>
                <span className="text-sm font-black text-slate-300 ml-2 tracking-widest ">/ {m.max_marks}</span>
              </div>
             </div>
             
             <div className="mt-6 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${(m.marks/m.max_marks)*100}%` }}
               transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 + (i * 0.1) }}
               className="h-full bg-emerald-500 rounded-full"
              />
             </div>
           </motion.div>
          ))}
         </AnimatePresence>
        </div>

        <div className="mt-20 pt-16 border-t-2 border-dashed border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-12">
         <div className="text-center lg:text-left space-y-2">
           <p className="text-[10px] font-black text-slate-400 ">Cumulative Score List</p>
           <h4 className="text-6xl md:text-9xl font-black text-slate-900  leading-none">
            {results[0].total_marks} 
            <span className="text-2xl md:text-3xl text-slate-300 not-ml-6 tracking-widest font-inter">Verified Units</span>
           </h4>
         </div>
         
         <div className="flex flex-col gap-6 w-full lg:w-96">
           <button className="bg-slate-900 text-white px-12 py-7 rounded-[5px] font-black text-xs  flex items-center justify-center gap-4 shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 group/btn ">
            <Download size={22} className="group-hover/btn:translate-y-1 transition-transform" /> 
            Archive Digital Protocol
           </button>
           <p className="text-[9px] text-slate-400 font-black text-center tracking-widest leading-loose">
            This scholastic report is an electronic reproduction <br/> 
            authorized by the Central Examination .
           </p>
         </div>
        </div>
      </motion.div>
     </div>
    ) : (
     <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="py-32 text-center space-y-10 bg-white rounded-[5px] border-4 border-dashed border-slate-100 shadow-inner group"
     >
       <div className="bg-slate-50 w-32 h-32 rounded-[5px] flex items-center justify-center mx-auto mb-8 text-6xl shadow-inner group-hover:rotate-[360deg] transition-transform duration-1000 rotate-12">🎓</div>
       <div className="space-y-4">
        <h3 className="text-3xl font-black text-slate-900  uppercase">List Unavailable</h3>
        <p className="max-w-md mx-auto text-slate-400 font-black text-[10px]  leading-relaxed px-10">
         The academic registry for this session has not yet been authorized. Please maintain scholastic excellence while waiting for final publication.
        </p>
       </div>
       <button onClick={() => navigate('/student/dashboard')} className="premium-button-student mx-auto flex items-center gap-3">
        <ArrowRight size={18} /> Return to Operations Center
       </button>
     </motion.div>
    )}
   </div>
  </div>
 );
};

const PremiumQuickStat = ({ label, value, accent }: any) => (
 <div className="bg-white/10 backdrop-blur-xl border border-white/5 p-6 rounded-[5px] min-w-[180px] shadow-2xl group/stat hover:bg-white/15 transition-all">
   <p className="text-[9px] font-black text-emerald-400 mb-2 ">{label}</p>
   <p className="text-3xl font-black text-white  leading-none group-hover/stat:scale-110 transition-transform origin-left">{value}</p>
 </div>
);

export default StudentResult;

   
