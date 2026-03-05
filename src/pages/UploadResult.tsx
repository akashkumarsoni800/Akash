import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  FileUp, Search, User, BookOpen, 
  Trash2, Plus, ChevronDown, CheckCircle, Zap, Target
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
  const [isFinalExam, setIsFinalExam] = useState(false); 
  const [passMarkPercent, setPassMarkPercent] = useState(33); // एडमिन यहाँ सेट करेगा
  
  // Form States
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState([]);
  const [results, setResults] = useState([{ subject: '', marks: '', max_marks: '100' }]);

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

  // ✅ Auto-Promotion Logic
  const getNextClass = (currentClass: string) => {
    const sequence = ["Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th", "Graduate"];
    const index = sequence.indexOf(currentClass.trim());
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
      
      // ✅ Admin द्वारा सेट किए गए % के हिसाब से PASS/FAIL तय होगा
      const status = percentage >= passMarkPercent ? 'PASS' : 'FAIL';

      // 1. Result Table में डेटा डालना
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

      // 2. ✅ Actual Promotion Step (Database Update)
      if (isFinalExam && status === 'PASS') {
        const nextClass = getNextClass(selectedStudent.class_name);
        const { error: promoErr } = await supabase
          .from('students')
          .update({ class_name: nextClass })
          .eq('id', selectedStudent.id);

        if (promoErr) throw promoErr;
        toast.success(`Hurray! Student promoted to ${nextClass} 🚀`);
      }

      toast.success("Result Published Successfully!");
      setSelectedStudent(null);
      setIsFinalExam(false);
      setResults([{ subject: '', marks: '', max_marks: '100' }]);
      fetchInitialData(); // Refresh list to see updated classes
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 pb-20 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-900 p-3 rounded-2xl text-white shadow-lg"><FileUp size={24} /></div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase italic">Upload Results</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Digital Promotion System</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side: Student List */}
          <div className="lg:col-span-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 h-[700px] flex flex-col">
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input type="text" placeholder="Search name..." className="w-full bg-gray-50 border-none rounded-2xl pl-10 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-xs font-black text-indigo-900" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : `Class ${c}`}</option>)}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {filteredStudents.map((s:any) => (
                <div key={s.id} onClick={() => setSelectedStudent(s)} className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedStudent?.id === s.id ? 'bg-indigo-900 text-white shadow-lg' : 'bg-gray-50 hover:bg-white hover:border-indigo-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg ${selectedStudent?.id === s.id ? 'bg-white/20' : 'bg-white text-indigo-900 shadow-sm'} flex items-center justify-center font-black text-xs`}>{s.full_name[0]}</div>
                    <div>
                      <h4 className="font-bold text-sm">{s.full_name}</h4>
                      <p className={`text-[10px] uppercase font-black ${selectedStudent?.id === s.id ? 'text-indigo-200' : 'text-gray-400'}`}>Class: {s.class_name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
             {/* ✅ PROMOTION & PASSING MARKS CONTROLS */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className={`p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between ${isFinalExam ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-transparent'}`}>
                    <div className="flex items-center gap-3">
                       <Zap size={20} className={isFinalExam ? 'text-orange-500' : 'text-gray-300'}/>
                       <span className="text-xs font-black uppercase text-gray-700">Yearly / Final Exam</span>
                    </div>
                    <input type="checkbox" checked={isFinalExam} onChange={(e) => setIsFinalExam(e.target.checked)} className="w-6 h-6 accent-orange-600 cursor-pointer" />
                </div>

                <div className="p-5 rounded-[2rem] bg-indigo-50 border-2 border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Target size={20} className="text-indigo-600"/>
                       <span className="text-xs font-black uppercase text-indigo-900">Passing %</span>
                    </div>
                    <input type="number" value={passMarkPercent} onChange={(e) => setPassMarkPercent(Number(e.target.value))} className="w-16 bg-white border-none rounded-xl p-2 text-center font-black text-indigo-600" />
                </div>
             </div>

             <div className="space-y-6">
                <select value={selectedExamId} onChange={(e) => handleExamSelect(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl p-5 font-black text-sm uppercase outline-none focus:ring-2 focus:ring-indigo-100">
                  <option value="">-- Select Exam Template --</option>
                  {exams.map((ex:any) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                </select>

                <div className="space-y-3 bg-gray-50/50 p-4 rounded-[2.5rem] border border-dashed border-gray-200">
                  {results.map((res, index) => (
                    <div key={index} className="flex gap-3 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-right-2">
                      <input type="text" placeholder="Subject" value={res.subject} className="flex-1 bg-transparent border-none font-black text-sm uppercase outline-none" onChange={(e) => {
                        const nr = [...results]; nr[index].subject = e.target.value; setResults(nr);
                      }} />
                      <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                        <input type="number" placeholder="00" value={res.marks} className="w-12 bg-transparent border-none text-sm font-black text-center text-indigo-900 outline-none" onChange={(e) => {
                          const nr = [...results]; nr[index].marks = e.target.value; setResults(nr);
                        }} />
                        <span className="text-indigo-200 font-bold">/</span>
                        <input type="number" value={res.max_marks} className="w-10 bg-transparent border-none text-[10px] font-bold text-gray-400 text-center outline-none" onChange={(e) => {
                          const nr = [...results]; nr[index].max_marks = e.target.value; setResults(nr);
                        }} />
                      </div>
                      <button type="button" onClick={() => setResults(results.filter((_, i) => i !== index))} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setResults([...results, { subject: '', marks: '', max_marks: '100' }])} className="w-full py-3 border-2 border-dotted border-gray-200 rounded-2xl text-gray-400 font-black text-[10px] uppercase hover:bg-white hover:text-indigo-600 transition-all">+ Add Subject</button>
                </div>
                
                <button onClick={handleSubmit} disabled={loading || !selectedStudent} className="w-full bg-indigo-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all disabled:opacity-30 flex items-center justify-center gap-3">
                  {loading ? 'Processing...' : (isFinalExam ? 'Publish & Promote Student' : 'Upload Result Now')}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadResult;
                                      
