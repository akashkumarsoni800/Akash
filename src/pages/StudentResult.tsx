import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { ChevronLeft, Search, GraduationCap, Award, Percent, Layout } from 'lucide-react';

const StudentResult = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({ name: '', fatherName: '', className: '' });
  const [studentData, setStudentData] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputs.name || !inputs.fatherName || !inputs.className) return toast.error("All fields are mandatory!");

    setLoading(true); setSearched(true);
    try {
      const { data: student, error: stdErr } = await supabase.from('students').select('*')
        .eq('class_name', inputs.className)
        .ilike('full_name', inputs.name.trim())
        .ilike('father_name', inputs.fatherName.trim())
        .maybeSingle();

      if (!student) return toast.error("Record not found!");
      setStudentData(student);

      const { data: resData } = await supabase.from('results').select('*, exams(title)').eq('student_id', student.id).order('uploaded_at', { ascending: false });
      setResults(resData || []);
      if(resData?.length) toast.success("Result Found!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] p-4 md:p-10 font-sans">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase mb-8"><ChevronLeft size={16}/> Go Back</button>
      
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center">
          <h1 className="text-5xl font-black text-gray-900 italic uppercase tracking-tighter">Digital Marksheet</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Enter credentials to view performance</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col md:flex-row gap-4">
           <input type="text" placeholder="STUDENT NAME" className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 font-black text-sm uppercase" value={inputs.name} onChange={e => setInputs({...inputs, name: e.target.value})} />
           <input type="text" placeholder="FATHER'S NAME" className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 font-black text-sm uppercase" value={inputs.fatherName} onChange={e => setInputs({...inputs, fatherName: e.target.value})} />
           <select className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 font-black text-sm uppercase" value={inputs.className} onChange={e => setInputs({...inputs, className: e.target.value})}>
              <option value="">CLASS</option>
              <option value="9th">9th</option><option value="10th">10th</option><option value="11th">11th</option><option value="12th">12th</option>
           </select>
           <button onClick={handleSearch} disabled={loading} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase italic shadow-lg shadow-indigo-100 hover:bg-black transition-all">
             {loading ? '...' : 'Search'}
           </button>
        </div>

        {searched && studentData && results.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
             {/* Profile Header */}
             <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10"><GraduationCap size={150}/></div>
                <div className="flex items-center gap-6 relative">
                   <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center text-4xl font-black border border-white/30">{studentData.full_name[0]}</div>
                   <div>
                      <h2 className="text-4xl font-black uppercase italic tracking-tighter">{studentData.full_name}</h2>
                      <p className="font-bold text-indigo-200 uppercase text-xs tracking-widest mt-1">S/O {studentData.father_name}</p>
                      <div className="mt-4 flex gap-2">
                         <span className="bg-white/10 px-4 py-1 rounded-full text-[10px] font-black uppercase">Roll: {studentData.roll_no}</span>
                         <span className="bg-emerald-500 px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-lg shadow-emerald-900/20">Current: {studentData.class_name}</span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-4">
                   <ResultSummary icon={Award} label="Status" value={results[0].status} color="white" />
                   <ResultSummary icon={Percent} label="Percentage" value={`${results[0].percentage?.toFixed(1)}%`} color="white" />
                </div>
             </div>

             {/* Detailed Marks */}
             <div className="bg-white rounded-[3.5rem] p-10 shadow-xl border border-gray-100">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2"><Layout size={16}/> Subject Breakdown ({results[0].exams?.title || 'Main Exam'})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {results[0].marks_data?.map((m:any, i:number) => (
                     <div key={i} className="flex justify-between items-center bg-gray-50 p-6 rounded-[2rem] border border-gray-100 hover:bg-white hover:border-indigo-100 transition-all">
                        <span className="font-black text-gray-500 uppercase text-xs">{m.subject}</span>
                        <div className="text-right">
                           <span className="text-xl font-black text-gray-900">{m.marks}</span>
                           <span className="text-[10px] font-bold text-gray-400 ml-1">/ {m.max_marks}</span>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="mt-10 pt-8 border-t border-dashed border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="text-center md:text-left">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Grand Total</p>
                      <h4 className="text-4xl font-black text-gray-900 tracking-tighter">{results[0].total_marks} / {results[0].marks_data?.reduce((a:any, b:any) => a + Number(b.max_marks), 0)}</h4>
                   </div>
                   {results[0].status === 'PASS' && (
                     <div className="bg-amber-100 text-amber-700 px-8 py-3 rounded-full font-black text-xs uppercase tracking-tighter animate-pulse">
                        🎊 Promoted to Next Session 🎊
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ResultSummary = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white/10 backdrop-blur-lg p-6 rounded-[2.2rem] border border-white/10 text-center min-w-[140px]">
     <div className="bg-white text-indigo-600 w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg"><Icon size={16}/></div>
     <p className="text-[9px] font-black uppercase opacity-60 mb-1">{label}</p>
     <p className="text-xl font-black uppercase">{value}</p>
  </div>
);

export default StudentResult;
