import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  ChevronLeft, BookOpen, Clock, 
  CheckCircle2, AlertCircle, RefreshCw, 
  Plus, FileText, Send, Calendar
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
        .maybeSingle();

      if (!student) {
        toast.error("Profile not found");
        return;
      }
      setStudentData(student);

      // Fetch homework for this student's class
      const { data: hwData } = await supabase.from('homework')
        .select(`
          *,
          homework_submissions!left(*)
        `)
        .eq('class_name', student.class_name)
        .order('due_date', { ascending: true });

      // Note: In a real app, we'd filter submissions by the current student_id in the join.
      // For now, we'll manually check if this student has a submission in the joined data.
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
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
       <RefreshCw size={40} className="animate-spin text-indigo-600 mb-4"/>
       <p className="font-black uppercase tracking-widest text-gray-400 italic text-sm text-center px-10">Syncing Assignments...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-sm text-indigo-600 font-black text-[10px] uppercase mb-10 border border-indigo-50 tracking-widest hover:shadow-md transition-all">
        <ChevronLeft size={16}/> Back to Dashboard
      </button>

      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-block bg-amber-50 px-4 py-1.5 rounded-full text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2">Digital Classroom</div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 italic uppercase tracking-tighter leading-none">Home Assignments</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.4em]">Adarsh Shishu Mandir - Live Tasks</p>
        </div>

        {/* 🟡 ASSIGNMENT LIST */}
        <div className="space-y-6">
           {homeworks.length > 0 ? homeworks.map((hw, idx) => (
             <div key={idx} className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden group hover:border-amber-200 transition-all duration-500">
                <div className="flex flex-col md:flex-row">
                   <div className={`p-10 md:w-80 flex flex-col justify-center items-center text-center ${hw.isSubmitted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <div className="p-5 rounded-3xl bg-white shadow-xl mb-4 group-hover:scale-110 transition-transform">
                         {hw.isSubmitted ? <CheckCircle2 size={32}/> : <Clock size={32} className="animate-pulse"/>}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest">{hw.subject || 'General'}</p>
                      <h3 className="text-2xl font-black italic uppercase tracking-tight mt-1">{hw.isSubmitted ? 'Submitted' : 'Pending'}</h3>
                      {hw.submissionDate && <p className="text-[9px] font-bold mt-2 opacity-60 italic">on {new Date(hw.submissionDate).toLocaleDateString()}</p>}
                   </div>

                   <div className="flex-1 p-10 md:p-14 relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                         <div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">{hw.title}</h2>
                            <div className="flex items-center gap-3 mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                               <Calendar size={14} className="text-indigo-600"/> Due: {new Date(hw.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                            </div>
                         </div>
                         <div className="hidden md:block transition-all group-hover:rotate-12 opacity-10">
                            <BookOpen size={60} className="text-gray-400" />
                         </div>
                      </div>

                      <p className="text-gray-600 font-medium text-sm leading-relaxed mb-10 max-w-lg">{hw.description || 'No detailed instructions provided by teacher.'}</p>

                      <div className="flex flex-col md:flex-row gap-4 items-center">
                         <button className="w-full md:w-auto bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-gray-200 hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                            <FileText size={16}/> View Materials
                         </button>
                         {!hw.isSubmitted && (
                           <button className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                              <Send size={16}/> Submit Work
                           </button>
                         )}
                      </div>
                   </div>
                </div>
             </div>
           )) : (
             <div className="py-24 text-center bg-white rounded-[4rem] border-4 border-dashed border-gray-100 shadow-inner">
                <div className="text-6xl mb-6 grayscale opacity-30">📚</div>
                <p className="text-gray-400 font-black uppercase tracking-widest text-lg italic">No assignments for your class today!</p>
                <p className="text-gray-300 font-bold text-[10px] uppercase mt-2 tracking-widest">Enjoy your free time or revise previous lessons.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default StudentHomework;
