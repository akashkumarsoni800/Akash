import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { ChevronLeft, RefreshCw, Printer, ShieldCheck } from 'lucide-react';
import StudentICard from './StudentICard';

const StudentICardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate('/');

        const { data } = await supabase.from('students')
          .select('*')
          .eq('email', user.email)
          .limit(1)
          .maybeSingle();

        if (data) setStudent(data);
        else toast.error("Student profile not found.");
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [navigate]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
       <RefreshCw size={40} className="animate-spin text-indigo-600 mb-4"/>
       <p className="font-black  tracking-widest text-gray-400 text-sm text-center px-10">Initializing Digital ID...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-sm text-indigo-600 font-black text-[10px]  mb-10 border border-indigo-50 tracking-widest hover:shadow-md transition-all">
        <ChevronLeft size={16}/> Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-block bg-indigo-50 px-4 py-1.5 rounded-full text-[9px] font-black text-indigo-600   mb-2">Electronic Credentials</div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900   leading-none uppercase">Student ID Card</h1>
          <p className="text-gray-400 font-black text-[10px]  ">Official School Identity</p>
        </div>

        <div className="flex flex-col items-center bg-white rounded-[4rem] p-10 md:p-20 shadow-2xl border border-gray-100 relative overflow-hidden">
           {/* Security Background Pattern */}
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none  font-black text-[20rem] text-indigo-900 flex items-center justify-center -rotate-12 select-none">ID</div>
           
           <div className="relative z-10 flex flex-col items-center gap-10">
              {student ? (
                <>
                  <StudentICard student={student} />
                  
                  <div className="max-w-md text-center space-y-4">
                     <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-[10px]  ">
                        <ShieldCheck size={16}/> Digitally Verified
                     </div>
                     <p className="text-gray-400 font-black text-xs leading-relaxed">"Always carry this ID card within school premises. This card is non-transferable and must be presented on demand."</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 opacity-30 font-black  text-xs tracking-widest">
                   No identity record generated yet.
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentICardPage;
