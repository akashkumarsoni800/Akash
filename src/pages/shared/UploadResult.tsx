import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import {
  FileUp, Search, User, BookOpen,
  Trash2, Plus, ChevronDown, CheckCircle, Zap, Target, Award, RefreshCw, Filter, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    if (classFilter !== 'All') temp = temp.filter((s: any) => s.class_name === classFilter);
    if (searchTerm) temp = temp.filter((s: any) => s.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
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
    const selectedExam: any = exams.find((e: any) => e.id === examId);
    if (selectedExam?.subjects) {
      setResults(selectedExam.subjects.map((sub: any) => ({ subject: sub, marks: '', max_marks: selectedExam.max_marks || '100' })));
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
    <div className="min-h-screen bg-[var(--bg-main)] py-12 px-1 md:px-2 pb-32">
      <div className="max-w-full mx-auto space-y-12">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-none uppercase">
              Exam Results
            </h1>
            <p className="text-slate-400 font-black text-[10px] mt-4 flex items-center gap-2">
              <Target size={12} className="text-emerald-500" /> Enter Student Marks
            </p>
          </motion.div>
        </div>

        <div className="premium-card p-10 md:p-16 relative overflow-hidden bg-white rounded-[5px] shadow-2xl">
          {/* Form Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-50 pb-10 mb-12">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-emerald-50 rounded-[5px] flex items-center justify-center text-emerald-600 shadow-inner">
                <Award size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase">Enter Marks</h2>
                <p className="text-[10px] font-black text-slate-300 tracking-widest leading-none uppercase">Enter marks information</p>
              </div>
            </div>

            {selectedStudent && (
              <div className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-[5px] border border-emerald-100 flex items-center gap-4">
                <User size={18} />
                <span className="text-xs font-black tracking-widest uppercase">{selectedStudent.full_name} ({selectedStudent.class_name})</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Pickers */}
            <div className="grid md:grid-cols-3 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1 uppercase">1. Class Filter</label>
                <select 
                  value={classFilter} 
                  onChange={(e) => {
                    setClassFilter(e.target.value);
                    setSelectedStudent(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[5px] px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-50 transition-all cursor-pointer"
                >
                  {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1 uppercase">2. Select Student</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-[5px] px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-50 transition-all cursor-pointer"
                  onChange={(e) => {
                    const found = students.find(s => String(s.student_id) === String(e.target.value));
                    setSelectedStudent(found || null);
                  }}
                  value={selectedStudent ? String(selectedStudent.student_id) : ''}
                >
                  <option value="">-- Choose Student --</option>
                  {filteredStudents.map(s => (
                    <option key={String(s.student_id)} value={String(s.student_id)}>
                      {s.full_name} {s.roll_no ? `(Roll: ${s.roll_no})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1 uppercase">3. Choose Exam</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-[5px] px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-50 transition-all cursor-pointer"
                  onChange={(e) => handleExamSelect(e.target.value)}
                  value={selectedExamId}
                >
                  <option value="">-- Choose Exam --</option>
                  {exams.map((e: any) => <option key={e.id} value={e.id}>{e.exam_name || e.title}</option>)}
                </select>
              </div>
            </div>

            {/* Sub-search */}
            <div className="max-w-md mx-auto space-y-4">
               <label className="text-[10px] font-black text-slate-300 tracking-widest text-center block uppercase">Search By Name</label>
               <input
                type="text"
                placeholder="Type name to narrow list..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-[5px] px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-50 transition-all text-center"
              />
            </div>

            {/* Results Table Area */}
            {selectedStudent && selectedExamId ? (
              <div className="pt-10 border-t border-slate-50 space-y-10">
                <div className="bg-slate-50/50 rounded-[5px] border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/50 border-b border-slate-100">
                      <tr>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Marks</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.map((r, i) => (
                        <tr key={i} className="hover:bg-white transition-colors">
                          <td className="px-10 py-6 font-black text-slate-800 text-sm">{r.subject}</td>
                          <td className="px-10 py-6 text-center">
                            <input
                              type="number"
                              required
                              value={r.marks}
                              onChange={(e) => {
                                const newRes = [...results];
                                newRes[i].marks = e.target.value;
                                setResults(newRes);
                              }}
                              className="w-24 bg-white border border-slate-200 rounded-[5px] px-4 py-3 text-sm font-black text-center focus:border-emerald-400 outline-none"
                            />
                          </td>
                          <td className="px-10 py-6 text-center text-slate-400 text-sm font-black">{r.max_marks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Promotion Check */}
                <div className="flex justify-between items-center bg-slate-50 p-8 rounded-[5px] border border-slate-100">
                   <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-[5px] flex items-center justify-center transition-all ${isFinalExam ? 'bg-emerald-600 text-white shadow-2xl active:scale-95 tracking-widest' : 'bg-white text-slate-200 border border-slate-100'}`}>
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-none">PROMOTE TO NEXT CLASS</p>
                      <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">Promote student to next class?</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="w-10 h-10 rounded-[5px] border-slate-200 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                    checked={isFinalExam}
                    onChange={(e) => setIsFinalExam(e.target.checked)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white hover:bg-emerald-600 py-8 rounded-[5px] text-lg font-black tracking-widest flex items-center justify-center gap-4 shadow-2xl transition-all"
                >
                  {loading ? <RefreshCw className="animate-spin" size={24} /> : <FileUp size={24} />}
                  {loading ? 'PROCESSING...' : 'SAVE RESULTS'}
                </button>
              </div>
            ) : (
              <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[5px] opacity-30">
                <Target size={48} className="mx-auto mb-6 text-slate-300" />
                <p className="font-black text-[10px] text-slate-400 tracking-widest uppercase">Select student and exam to activate form</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );


};

export default UploadResult;
