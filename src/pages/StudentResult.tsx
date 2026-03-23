import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  ChevronLeft, GraduationCap, Award, 
  Percent, Layout, FileText, CheckCircle2,
  Printer, Download, ShieldCheck, RefreshCw,
  Search
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
        .maybeSingle();

      if (!student) {
        toast.error("Student profile not found.");
        return;
      }
      setStudentData(student);

      // 2. Get Results
      const { data: resData } = await supabase.from('results')
        .select('*, exams(title)')
        .eq('student_id', student.id)
        .order('uploaded_at', { ascending: false });

      setResults(resData || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
       <RefreshCw size={40} className="animate-spin text-indigo-600 mb-4"/>
       <p className="font-black uppercase tracking-widest text-gray-400 italic text-sm">Academic Records Syncing...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans pb-20">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-sm text-indigo-600 font-black text-[10px] uppercase mb-10 border border-gray-100 hover:shadow-md transition-all tracking-widest">
        <ChevronLeft size={16}/> Back to Dashboard
      </button>
      
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-block bg-indigo-50 px-4 py-1.5 rounded-full text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Live Marksheets</div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 italic uppercase tracking-tighter leading-none">Academic Portfolio</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.4em]">Adarsh Shishu Mandir - Digital Record</p>
        </div>

        {studentData && results.length > 0 ? (
          <div className="space-y-8">
             {/* 🟢 TOP SUMMARY CARD */}
             <div className="bg-indigo-900 rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10 border-b-[8px] md:border-b-[10px] border-indigo-500/30">
                <div className="absolute -bottom-10 -left-10 opacity-10 pointer-events-none self-center"><GraduationCap size={240}/></div>
                
                <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left">
                   <div className="w-20 h-20 md:w-32 md:h-32 bg-white/10 backdrop-blur-3xl rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center text-3xl md:text-4xl font-black border border-white/20 shadow-inner">
                      {studentData.photo_url ? (
                        <img src={studentData.photo_url} className="w-full h-full object-cover rounded-[1.5rem] md:rounded-[2.5rem]" alt="Profile" />
                      ) : studentData.full_name[0]}
                   </div>
                   <div>
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                         <ShieldCheck className="text-emerald-400" size={16}/>
                         <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-300">Official Report</span>
                      </div>
                      <h2 className="text-2xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight">{studentData.full_name}</h2>
                      <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                         <span className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border border-white/5 tracking-widest">Class {studentData.class_name}</span>
                         <span className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border border-white/5 tracking-widest">Roll: {studentData.roll_no}</span>
                      </div>
                   </div>
                </div>

                <div className="flex gap-4">
                   <QuickStat label="Status" value={results[0].status} isPass={results[0].status === 'PASS'} />
                   <QuickStat label="Aggregate" value={`${Math.round(results[0].percentage)}%`} isPass={results[0].status === 'PASS'} />
                </div>
             </div>

             {/* 🔵 DETAILED MARKS BOARD */}
             <div className="bg-white rounded-[4rem] p-8 md:p-14 shadow-2xl border border-gray-50 relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                   <div className="flex items-center gap-4">
                      <div className="bg-gray-900 p-4 rounded-3xl text-white shadow-xl rotate-3"><FileText size={24}/></div>
                      <div>
                         <h3 className="font-black text-gray-900 uppercase text-lg italic">{results[0].exams?.title || 'Final Examination'}</h3>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Batch 2024-2025</p>
                      </div>
                   </div>
                   <button onClick={() => window.print()} className="bg-indigo-50 text-indigo-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2">
                      <Printer size={16}/> Print Marksheet
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {results[0].marks_data?.map((m:any, i:number) => (
                     <div key={i} className="flex justify-between items-center bg-gray-50/50 p-7 rounded-[2.5rem] border border-transparent hover:border-indigo-100 hover:bg-white transition-all group shadow-sm">
                        <div>
                           <span className="font-black text-gray-400 uppercase text-[10px] tracking-widest group-hover:text-indigo-600 transition-colors block mb-1">Subject</span>
                           <span className="text-lg font-black text-gray-800 uppercase italic">{m.subject}</span>
                        </div>
                        <div className="text-right">
                           <span className="text-3xl font-black text-gray-900 italic">{m.marks}</span>
                           <span className="text-[11px] font-bold text-gray-300 ml-1">/ {m.max_marks}</span>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="mt-14 pt-10 border-t-2 border-dashed border-gray-100 flex flex-col md:flex-row justify-between items-center gap-10">
                   <div className="text-center md:text-left">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2 italic">Total Score Portfolio</p>
                      <h4 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter italic">{results[0].total_marks} <span className="text-2xl text-gray-300 not-italic">Marks Obtained</span></h4>
                   </div>
                   <div className="flex flex-col gap-4 w-full md:w-auto">
                      <button className="bg-gray-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:bg-indigo-600 transition-all">
                         <Download size={18}/> Download Digital Copy
                      </button>
                      <p className="text-[9px] text-gray-400 font-bold uppercase text-center italic">Digitally Verified by Controller of Exams</p>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="py-20 text-center space-y-6 bg-white rounded-[4rem] border-4 border-dashed border-gray-100 shadow-inner">
             <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl">🎓</div>
             <div>
                <p className="text-gray-900 font-black uppercase tracking-tighter text-2xl italic">No Results Published Yet</p>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2 px-10">Keep focused on your studies! Once teachers upload your marks, they will appear here instantly.</p>
             </div>
             <button onClick={() => navigate('/student/dashboard')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Back to Portal</button>
          </div>
        )}
      </div>
    </div>
  );
};

const QuickStat = ({ label, value, isPass }: any) => (
  <div className={`p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border-2 text-center min-w-[120px] md:min-w-[140px] shadow-lg backdrop-blur-md overflow-hidden relative ${isPass ? 'bg-white/10 border-white/20' : 'bg-rose-500/20 border-rose-500/30'}`}>
     <div className="relative z-10">
        <p className="text-[8px] md:text-[9px] font-black uppercase text-indigo-300 tracking-widest mb-1 italic opacity-60">{label}</p>
        <p className="text-xl md:text-2xl font-black uppercase italic tracking-tight">{value}</p>
     </div>
     <div className={`absolute bottom-0 inset-x-0 h-1 md:h-1.5 ${isPass ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
  </div>
);

export default StudentResult;

      
