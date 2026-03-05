import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  FileUp, Search, User, BookOpen, 
  Trash2, Plus, ChevronDown, CheckCircle, Zap
} from 'lucide-react';

const UploadResult = () => {
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [students, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [exams, setExams] = useState([]); 
  
  // Selection States
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [isFinalExam, setIsFinalExam] = useState(false); // Promotion Trigger
  
  // Form States
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState([]);
  const [results, setResults] = useState([{ subject: '', marks: '', max_marks: '100' }]);

  useEffect(() => {
    fetchInitialData();
  }, []);

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
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    let temp = students;
    if (classFilter !== 'All') temp = temp.filter((s:any) => s.class_name === classFilter);
    if (searchTerm) temp = temp.filter((s:any) => s.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredStudents(temp);
  }, [searchTerm, classFilter, students]);

  // ✅ Promotion Logic: Classes Sequence
  const getNextClass = (currentClass: string) => {
    const sequence = ["Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th", "Graduated"];
    const index = sequence.indexOf(currentClass);
    return (index !== -1 && index < sequence.length - 1) ? sequence[index + 1] : currentClass;
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
      const status = percentage >= 33 ? 'PASS' : 'FAIL';

      // 1. Upload Result
      const { error: resErr } = await supabase.from('results').insert({
        student_id: selectedStudent.id,
        exam_id: selectedExamId,
        marks_data: results,
        total_marks: totalObtained,
        percentage: percentage,
        status: status,
        uploaded_at: new Date()
      });
      if (resErr) throw resErr;

      // 2. ✅ Auto Promotion Logic
      if (isFinalExam && status === 'PASS') {
        const nextClass = getNextClass(selectedStudent.class_name);
        await supabase.from('students').update({ class_name: nextClass }).eq('id', selectedStudent.id);
        toast.success(`Promoted to ${nextClass}!`);
      }

      toast.success("Result Published!");
      setSelectedStudent(null);
      setIsFinalExam(false);
      setResults([{ subject: '', marks: '', max_marks: '100' }]);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 pb-20 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="bg-blue-900 p-3 rounded-2xl text-white shadow-lg"><FileUp size={24} /></div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase italic">Upload Results</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">ASM v3.0 Automatic System</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Candidate List */}
          <div className="lg:col-span-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 h-[650px] flex flex-col">
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input type="text" placeholder="Search name..." className="w-full bg-gray-50 border-none rounded-2xl pl-10 py-3 text-sm font-bold" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-xs font-black text-blue-900" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : `Class ${c}`}</option>)}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredStudents.map((s:any) => (
                <div key={s.id} onClick={() => setSelectedStudent(s)} className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedStudent?.id === s.id ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-50 hover:bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs">{s.full_name[0]}</div>
                    <div>
                      <h4 className="font-bold text-sm">{s.full_name}</h4>
                      <p className="text-[10px] opacity-60 uppercase font-black">Class: {s.class_name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Area */}
          <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
             {/* PROMOTION TOGGLE */}
             <div className={`mb-8 p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between ${isFinalExam ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-transparent'}`}>
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-xl ${isFinalExam ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}><Zap size={20}/></div>
                   <div>
                      <p className="text-xs font-black uppercase text-gray-900">Yearly / Final Exam Mode</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase italic">If PASS, student will move to next class</p>
                   </div>
                </div>
                <input type="checkbox" checked={isFinalExam} onChange={(e) => setIsFinalExam(e.target.checked)} className="w-6 h-6 accent-orange-600 cursor-pointer" />
             </div>

             <div className="space-y-6">
                <select value={selectedExamId} onChange={(e) => handleExamSelect(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl p-5 font-black text-sm uppercase outline-none">
                  <option value="">-- Choose Exam Title --</option>
                  {exams.map((ex:any) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                </select>

                <div className="space-y-3">
                  {results.map((res, index) => (
                    <div key={index} className="flex gap-3 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                      <input type="text" placeholder="Subject" value={res.subject} className="flex-1 bg-transparent border-none font-black text-sm uppercase" onChange={(e) => {
                        const nr = [...results]; nr[index].subject = e.target.value; setResults(nr);
                      }} />
                      <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl">
                        <input type="number" placeholder="00" value={res.marks} className="w-12 bg-transparent border-none text-sm font-black text-center text-blue-900" onChange={(e) => {
                          const nr = [...results]; nr[index].marks = e.target.value; setResults(nr);
                        }} />
                        <span className="text-blue-200">/</span>
                        <input type="number" value={res.max_marks} className="w-10 bg-transparent border-none text-[10px] font-bold text-gray-400 text-center" onChange={(e) => {
                          const nr = [...results]; nr[index].max_marks = e.target.value; setResults(nr);
                        }} />
                      </div>
                      <button onClick={() => setResults(results.filter((_, i) => i !== index))} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>
                  ))}
                  <button onClick={() => setResults([...results, { subject: '', marks: '', max_marks: '100' }])} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-black text-[10px] uppercase hover:bg-gray-50">+ Add More Subject</button>
                </div>
                
                <button onClick={handleSubmit} disabled={loading || !selectedStudent} className="w-full bg-blue-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all disabled:opacity-30">
                  {loading ? 'Processing...' : 'Publish Result & Update Class'}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadResult;
