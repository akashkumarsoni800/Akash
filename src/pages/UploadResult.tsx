import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  FileUp, Search, User, BookOpen, 
  Trash2, Plus, ChevronDown, CheckCircle, Zap, Target, Award
} from 'lucide-react';
import { motion } from 'framer-motion';

const UploadResult = () => {
  const [loading, setLoading] = useState(false);
  const [students, setAllStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]); 
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [isFinalExam, setIsFinalExam] = useState(false); 
  const [passMarkPercent, setPassMarkPercent] = useState(33); 
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState<string[]>([]);
  const [results, setResults] = useState<{ subject: string; marks: string; max_marks: string }[]>([{ subject: '', marks: '', max_marks: '100' }]);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      const { data: stdData } = await supabase.from('students').select('*').eq('is_approved', 'approved').order('full_name');
      if (stdData) {
        setAllStudents(stdData);
        setFilteredStudents(stdData);
        setClasses(['All', ...new Set(stdData.map(s => s.class_name))]);
      }
      const { data: examData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (examData) setExams(examData);
    } catch (error) { toast.error("Failed to load data"); }
  };

  useEffect(() => {
    let temp = students;
    if (classFilter !== 'All') temp = temp.filter((s:any) => s.class_name === classFilter);
    if (searchTerm) temp = temp.filter((s:any) => s.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredStudents(temp);
  }, [searchTerm, classFilter, students]);

  // ✅ IMPROVED: Auto-Promotion logic with exact matching
  const getNextClass = (currentClass: string) => {
    const sequence = ["NUR", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8"];
    
    // सफाई: extra space हटाना
    const cleanCurrent = currentClass.trim();
    const index = sequence.findIndex(c => c.toLowerCase() === cleanCurrent.toLowerCase());
    
    if (index !== -1 && index < sequence.length - 1) {
      return sequence[index + 1];
    }
    return cleanCurrent; // अगर आखिरी क्लास है या मैच नहीं मिला
  };

  const handleExamSelect = (examId: string) => {
    setSelectedExamId(examId);
    const selectedExam:any = exams.find((e:any) => e.id === examId);
    if (selectedExam?.subjects) {
      setResults(selectedExam.subjects.map((sub:any) => ({ subject: sub, marks: '', max_marks: selectedExam.max_marks || '100' })));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedExamId) return toast.error("Select student and exam!");

    setLoading(true);
    try {
      const totalObtained = results.reduce((sum, r) => sum + Number(r.marks), 0);
      const totalMax = results.reduce((sum, r) => sum + Number(r.max_marks), 0);
      const percentage = (totalObtained / totalMax) * 100;
      const status = percentage >= passMarkPercent ? 'PASS' : 'FAIL';

      // 1. रिज़ल्ट टेबल में डेटा डालें
      const { error: resErr } = await supabase.from('results').insert({
        student_id: selectedStudent.student_id,
        exam_id: selectedExamId,
        marks_data: results,
        total_marks: totalObtained,
        percentage: percentage,
        status: status,
        uploaded_at: new Date()
      });
      if (resErr) throw resErr;

      // 2. ✅ FORCE PROMOTION: यहाँ हम इंतज़ार करेंगे ताकि अपडेट पक्का हो
      if (isFinalExam && status === 'PASS') {
        const nextClass = getNextClass(selectedStudent.class_name);
        
        if (nextClass !== selectedStudent.class_name) {
          const { error: promoErr } = await supabase
            .from('students')
            .update({ class_name: nextClass })
            .eq('student_id', selectedStudent.student_id);

          if (promoErr) throw promoErr;
          toast.success(`SUCCESS: Student moved to ${nextClass} 🚀`, { duration: 5000 });
        } else {
          toast.info("Student is already in the highest grade.");
        }
      }

      toast.success("Result Saved!");
      setSelectedStudent(null);
      setIsFinalExam(false);
      setResults([{ subject: '', marks: '', max_marks: '100' }]);
      
      // डेटा रिफ्रेश करें ताकि लिस्ट में नई क्लास दिखे
      await fetchInitialData(); 
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] py-8 px-4 md:px-10 pb-32">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* --- DYNAMIC HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900   leading-none uppercase">
                Academic<br/>
                <span className="text-emerald-600">Records</span>
              </h1>
              <p className="text-slate-400 font-black  text-[10px]  mt-4 flex items-center gap-2">
                <Target size={12} className="text-emerald-500" /> Scholastic Performance Ledger & Records v4.2
              </p>
           </motion.div>
           
           <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all">
             <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl shadow-slate-200 group-hover:scale-110 transition-transform">🎓</div>
             <div>
               <p className="text-[9px] font-black text-slate-400   mb-1">Active Scholars</p>
               <p className="text-3xl font-black text-slate-900 ">{students.length} Records</p>
             </div>
           </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* --- SCHOLAR DISCOVERY PANEL --- */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="lg:col-span-1 premium-card p-8 flex flex-col h-[850px] group"
          >
            <div className="mb-10 space-y-8">
              <h2 className="text-2xl font-black text-slate-800  tracking-tight flex items-center gap-3 uppercase">
                <Search size={22} className="text-emerald-600" /> Discovery Hub
              </h2>
              
              <div className="space-y-4">
                <div className="relative group/input">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search scholar name..." 
                    className="premium-input w-full pl-16 outline-none"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <select 
                  className="premium-input w-full appearance-none  !text-[10px]"
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'List: All Classes' : `List: ${c}`}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {filteredStudents.map(s => (
                <div 
                  key={s.student_id} 
                  onClick={() => setSelectedStudent(s)}
                  className={`p-6 rounded-[2rem] border transition-all cursor-pointer group/item hover:shadow-xl ${
                    selectedStudent?.student_id === s.student_id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[0.98]' 
                    : 'bg-white border-slate-50 hover:border-emerald-200 hover:bg-emerald-50/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`text-[9px] font-black  tracking-widest mb-1 ${selectedStudent?.student_id === s.student_id ? 'text-emerald-400' : 'text-slate-400'}`}>Class {s.class_name}</p>
                      <h4 className="font-black text-lg   leading-none ">{s.full_name}</h4>
                    </div>
                    {selectedStudent?.student_id === s.student_id && <CheckCircle size={20} className="text-emerald-400" />}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* --- PERFORMANCE REGISTRY --- */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="lg:col-span-2 premium-card p-10 md:p-16 relative overflow-hidden group min-h-[850px]"
          >
            {selectedStudent ? (
              <div className="space-y-12 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="text-4xl font-black text-slate-800   leading-none mb-3 uppercase">Entry Session</h3>
                    <p className="text-slate-400 font-black  text-[10px] tracking-widest flex items-center gap-2">
                      <User size={14} className="text-emerald-500" /> {selectedStudent.full_name} <span className="w-1 h-1 bg-slate-200 rounded-full"></span> #{selectedStudent.student_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl border border-emerald-100">
                     <Award size={20} />
                     <span className="text-xs font-black  tracking-widest">Merit Paid</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1">Protocol Selection</label>
                       <select 
                         required 
                         className="premium-input w-full"
                         onChange={(e) => handleExamSelect(e.target.value)}
                         value={selectedExamId}
                       >
                         <option value="">Choose Exam List</option>
                         {exams.map((e:any) => <option key={e.id} value={e.id}>{e.exam_name || e.title} ({e.session_year || 'Current'})</option>)}
                       </select>
                    </div>

                    <div className="space-y-4 flex flex-col justify-end">
                       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-600  tracking-widest cursor-pointer flex items-center gap-3">
                            <Zap size={16} className={isFinalExam ? "text-emerald-500" : "text-slate-300"} /> 
                            Apply Scholarship Promotion?
                          </label>
                          <input 
                            type="checkbox" 
                            className="w-6 h-6 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                            checked={isFinalExam}
                            onChange={(e) => setIsFinalExam(e.target.checked)}
                          />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black text-slate-400   flex items-center gap-3 ml-1 uppercase">
                      <BookOpen size={16} className="text-emerald-600"/> Metrics Compilation
                    </h3>
                    
                    <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-inner">
                      <table className="w-full">
                        <thead className="bg-slate-100/50 border-b border-slate-100">
                          <tr>
                            <th className="text-left px-8 py-5 text-[10px] font-black text-slate-500  tracking-widest">Course Title</th>
                            <th className="text-center px-8 py-5 text-[10px] font-black text-slate-500  tracking-widest">Achieved</th>
                            <th className="text-center px-8 py-5 text-[10px] font-black text-slate-500  tracking-widest">Max Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {results.map((r, i) => (
                            <tr key={i} className="group/row hover:bg-white transition-colors">
                              <td className="px-8 py-6 font-black text-slate-800 text-sm  tracking-tight group-hover/row:text-emerald-600 transition-colors">{r.subject}</td>
                              <td className="px-8 py-6 text-center">
                                <input 
                                  type="number" 
                                  required
                                  value={r.marks}
                                  onChange={(e) => {
                                    const newRes = [...results];
                                    newRes[i].marks = e.target.value;
                                    setResults(newRes);
                                  }}
                                  className="w-24 bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-center focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition-all shadow-sm mx-auto"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-8 py-6 text-center">
                                <input 
                                  type="number" 
                                  required
                                  value={r.max_marks}
                                  onChange={(e) => {
                                    const newRes = [...results];
                                    newRes[i].max_marks = e.target.value;
                                    setResults(newRes);
                                  }}
                                  className="w-24 bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-center focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition-all shadow-sm text-slate-400 mx-auto"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={() => setResults([...results, { subject: '', marks: '', max_marks: '100' }])}
                      className="w-full py-5 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black  text-slate-400 tracking-widest hover:bg-emerald-50/30 hover:text-emerald-600 transition-all active:scale-[0.98]"
                    >
                      + Append Subject Metric
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 pt-10 border-t border-slate-50">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="premium-button-admin flex-1 bg-emerald-600 hover:bg-emerald-700 border-none shadow-xl shadow-emerald-100"
                    >
                      {loading ? <CheckCircle className="animate-spin" size={18}/> : <FileUp size={18}/>}
                      {loading ? 'Authenticating Records...' : 'Authorize Result Entry'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSelectedStudent(null)}
                      className="px-10 py-6 bg-slate-50 text-slate-400 rounded-[1.5rem] font-black   text-[11px] hover:bg-slate-900 hover:text-white transition-all active:scale-[0.98]"
                    >
                      Reset Session
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-40 opacity-20 group-hover:opacity-30 transition-opacity">
                <div className="w-32 h-32 bg-slate-100 rounded-[3rem] flex items-center justify-center mb-8 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  <User size={60} className="text-slate-400" />
                </div>
                <h3 className="text-3xl font-black text-slate-900   mb-4 uppercase">List Locked</h3>
                <p className="max-w-xs text-[10px] font-black text-slate-400   leading-relaxed">Select a scholar from the Discovery Hub to initiate the scholastic registry protocol.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UploadResult;
