import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { ChevronLeft, GraduationCap, Award, Percent, Layout, FileText, CheckCircle2 } from 'lucide-react';

const StudentResult = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({ name: '', fatherName: '', className: '' });
  const [studentData, setStudentData] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputs.name || !inputs.fatherName || !inputs.className) return toast.error("Missing details!");

    setLoading(true); setSearched(true);
    try {
      const { data: student, error: stdErr } = await supabase.from('students').select('*')
        .eq('class_name', inputs.className)
        .ilike('full_name', inputs.name.trim())
        .ilike('father_name', inputs.fatherName.trim())
        .maybeSingle();

      if (!student) {
        setStudentData(null);
        return toast.error("No record found for this class and name.");
      }
      setStudentData(student);

      const { data: resData } = await supabase.from('results').select('*, exams(title)').eq('student_id', student.id).order('uploaded_at', { ascending: false });
      setResults(resData || []);
      if(resData && resData.length > 0) toast.success("Marksheet Loaded!");
      else toast.info("Profile found but no results uploaded yet.");
    } catch (error: any) {
      toast.error(error.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm text-indigo-600 font-black text-[10px] uppercase mb-8 border border-gray-100 hover:shadow-md transition-all"><ChevronLeft size={14}/> Dashboard</button>
      
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 italic uppercase tracking-tighter">Student Marksheet</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em]">Check academic progress live</p>
        </div>

        {/* Search Panel */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-indigo-50 flex flex-col md:flex-row gap-4 items-center">
           <div className="flex-1 w-full"><label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Full Name</label>
           <input type="text" placeholder="RAHUL KUMAR" className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-indigo-100" value={inputs.name} onChange={e => setInputs({...inputs, name: e.target.value})} /></div>
           
           <div className="flex-1 w-full"><label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Father's Name</label>
           <input type="text" placeholder="FATHER NAME" className="flex-1 w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-indigo-100" value={inputs.fatherName} onChange={e => setInputs({...inputs, fatherName: e.target.value})} /></div>
           
           <div className="w-full md:w-32"><label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Class</label>
           <select className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 font-black text-sm uppercase outline-none cursor-pointer" value={inputs.className} onChange={e => setInputs({...inputs, className: e.target.value})}>
              <option value="">SELECT</option>
              {["Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"].map(c => <option key={c} value={c}>{c}</option>)}
           </select></div>
           
           <button onClick={handleSearch} disabled={loading} className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase italic shadow-lg shadow-indigo-200 hover:bg-black transition-all mt-4 md:mt-5 flex items-center justify-center gap-2">
             {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Search size={18}/>}
           </button>
        </div>

        {searched && studentData && results.length > 0 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Header Profile */}
             <div className="bg-indigo-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="absolute -bottom-10 -left-10 opacity-10"><GraduationCap size={200}/></div>
                <div className="relative flex items-center gap-6">
                   <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center text-4xl font-black border border-white/20 shadow-inner">{studentData.full_name[0]}</div>
                   <div>
                      <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">{studentData.full_name}</h2>
                      <p className="font-bold text-indigo-300 uppercase text-[10px] tracking-[0.2em] mt-2">S/O {studentData.father_name}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                         <span className="bg-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase border border-white/5">Roll: {studentData.roll_no}</span>
                         <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase shadow-lg shadow-emerald-900/40">Verified Class: {studentData.class_name}</span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-3">
                   <StatBox icon={Award} label="Status" value={results[0].status} pass={results[0].status === 'PASS'} />
                   <StatBox icon={Percent} label="Score" value={`${Math.round(results[0].percentage)}%`} pass={results[0].status === 'PASS'} />
                </div>
             </div>

             {/* Subject List */}
             <div className="bg-white rounded-[3.5rem] p-8 md:p-12 shadow-xl border border-gray-100">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><FileText size={16}/> {results[0].exams?.title || 'Academic Record'}</h3>
                   {results[0].status === 'PASS' && <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase"><CheckCircle2 size={16}/> Promoted</div>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {results[0].marks_data?.map((m:any, i:number) => (
                     <div key={i} className="flex justify-between items-center bg-gray-50/50 p-6 rounded-[2.2rem] border border-transparent hover:border-indigo-100 hover:bg-white transition-all group">
                        <span className="font-black text-gray-400 uppercase text-[11px] group-hover:text-indigo-600 transition-colors">{m.subject}</span>
                        <div className="flex items-baseline gap-1">
                           <span className="text-2xl font-black text-gray-900">{m.marks}</span>
                           <span className="text-[10px] font-bold text-gray-300">/ {m.max_marks}</span>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                   <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Aggregate Result</p>
                      <h4 className="text-4xl font-black text-gray-900 tracking-tighter">{results[0].total_marks} <span className="text-lg text-gray-300">Total Marks</span></h4>
                   </div>
                   {results[0].status === 'PASS' ? (
                     <div className="bg-amber-100 text-amber-700 px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-tighter animate-pulse shadow-lg shadow-amber-100">
                        🎊 Next Session Admission Open 🎊
                     </div>
                   ) : (
                     <div className="bg-rose-50 text-rose-600 px-8 py-4 rounded-[2rem] font-black text-xs uppercase border border-rose-100">
                        Please Contact Admin Office
                     </div>
                   )}
                </div>
             </div>
          </div>
        ) : searched && !loading && (
          <div className="py-20 text-center space-y-4 bg-white rounded-[3rem] border border-dashed border-gray-200">
             <div className="text-5xl">🔍</div>
             <p className="text-gray-400 font-black uppercase tracking-widest text-sm italic">No records found. Check spelling or class.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatBox = ({ icon: Icon, label, value, pass }: any) => (
  <div className={`p-6 rounded-[2.5rem] border-2 text-center min-w-[130px] ${pass ? 'bg-white/10 border-white/20' : 'bg-rose-500/20 border-rose-500/30'}`}>
     <div className="bg-white w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg"><Icon size={16} className="text-indigo-900"/></div>
     <p className="text-[9px] font-black uppercase opacity-60 mb-1">{label}</p>
     <p className="text-xl font-black uppercase">{value}</p>
  </div>
);

export default StudentResult;
      
