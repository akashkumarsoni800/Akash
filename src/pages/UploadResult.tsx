import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { FileUp, Search, UserCircle, Plus, Trash2, BookOpen } from 'lucide-react';

const UploadResult = () => {
  const [loading, setLoading] = useState(false);
  const [students, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState([]);
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [results, setResults] = useState([{ subject: '', marks: '', max_marks: '100' }]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const { data: stdData } = await supabase.from('students').select('*').eq('is_approved', 'approved');
      if (stdData) {
        setAllStudents(stdData);
        setFilteredStudents(stdData);
        setClasses(['All', ...new Set(stdData.map(s => s.class_name))]);
      }
      const { data: examData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (examData) setExams(examData);
    } catch (e) {
      console.error(e);
    }
  };

  // ✅ Fixed Crash Logic
  const handleExamChange = (examId) => {
    const exam = exams.find(e => e.id === examId);
    setSelectedExam(examId);
    
    // Check if exam and subjects exist to prevent crash
    if (exam && Array.isArray(exam.subjects)) {
      const autoSubjects = exam.subjects.map(subName => ({
        subject: subName,
        marks: '',
        max_marks: exam.max_marks || '100'
      }));
      setResults(autoSubjects);
      // Fixed sub.length error here
      toast.success(`${exam.subjects.length} Subjects Loaded Automatically!`);
    } else {
      setResults([{ subject: '', marks: '', max_marks: '100' }]);
    }
  };

  const handleFilter = (term, cls) => {
    setSearch(term);
    let filtered = students;
    if (cls !== 'All') filtered = filtered.filter(s => s.class_name === cls);
    if (term) filtered = filtered.filter(s => s.full_name.toLowerCase().includes(term.toLowerCase()));
    setFilteredStudents(filtered);
  };

  const addSubjectField = () => setResults([...results, { subject: '', marks: '', max_marks: '100' }]);
  const removeSubjectField = (index) => setResults(results.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!selectedStudent || !selectedExam) return toast.error("Select Student & Exam first!");
    
    setLoading(true);
    try {
      const { error } = await supabase.from('results').insert({
        student_id: selectedStudent.id,
        exam_id: selectedExam,
        marks_data: results,
        uploaded_at: new Date()
      });

      if (error) throw error;
      toast.success("Result Published Successfully!");
      setSelectedStudent(null);
      setSelectedExam('');
      setResults([{ subject: '', marks: '', max_marks: '100' }]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 bg-blue-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <FileUp size={24} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Result Upload Portal</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Student Selector */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-4 italic">1. Select Candidate</p>
              
              <div className="space-y-3 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="text" placeholder="Search..."
                    className="w-full bg-gray-50 border-none rounded-xl pl-10 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-900"
                    value={search} onChange={(e) => handleFilter(e.target.value, classFilter)}
                  />
                </div>
                <select 
                  className="w-full bg-gray-50 border-none rounded-xl py-3 text-xs font-black text-blue-900 appearance-none px-4"
                  value={classFilter} onChange={(e) => { setClassFilter(e.target.value); handleFilter(search, e.target.value); }}
                >
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredStudents.map(s => (
                  <button 
                    key={s.id} type="button" onClick={() => setSelectedStudent(s)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedStudent?.id === s.id ? 'bg-blue-900 text-white shadow-xl' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black ${selectedStudent?.id === s.id ? 'bg-white/20' : 'bg-blue-100 text-blue-900'}`}>{s.full_name[0]}</div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase leading-none">{s.full_name}</p>
                      <p className="text-[8px] font-bold opacity-60">CLASS: {s.class_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Entry */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest ml-2 italic">2. Choose Exam Type</label>
                  <select 
                    required
                    style={{ color: '#1e3a8a', fontWeight: '900' }}
                    className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl px-5 py-4 mt-1 focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer block"
                    value={selectedExam}
                    onChange={(e) => handleExamChange(e.target.value)}
                  >
                    <option value="" className="text-gray-400">--- CLICK TO CHOOSE ---</option>
                    {exams.map(ex => (
                      <option key={ex.id} value={ex.id} style={{ color: '#1e3a8a' }}>
                        {ex.exam_name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStudent && (
                  <div className="bg-emerald-50 p-4 rounded-2xl flex items-center gap-4 border border-emerald-100 self-end animate-in fade-in zoom-in">
                    <UserCircle size={24} className="text-emerald-600"/>
                    <div>
                      <p className="text-[10px] font-black text-emerald-900 uppercase leading-none">{selectedStudent.full_name}</p>
                      <p className="text-[8px] font-bold text-emerald-500 mt-1 uppercase">Ready for grading</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">3. Marksheet Details</p>
                  <button type="button" onClick={addSubjectField} className="text-blue-900 text-[10px] font-black uppercase flex items-center gap-1 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all"><Plus size={14}/> Add Subject</button>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-3xl space-y-3 border border-gray-100">
                  {results.map((res, idx) => (
                    <div key={idx} className="flex gap-3 items-center group animate-in slide-in-from-right-2">
                      <div className="bg-white p-3 rounded-xl text-blue-900 shadow-sm"><BookOpen size={16}/></div>
                      <input 
                        placeholder="Subject" value={res.subject}
                        className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-xs font-black text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-900"
                        onChange={(e) => {
                          const n = [...results]; n[idx].subject = e.target.value; setResults(n);
                        }}
                      />
                      <div className="flex items-center gap-2 bg-white px-3 rounded-xl shadow-sm border border-gray-100">
                        <input 
                          placeholder="00" value={res.marks} type="number"
                          className="w-12 bg-transparent border-none py-3 text-sm font-black text-blue-900 text-center focus:ring-0"
                          onChange={(e) => {
                            const n = [...results]; n[idx].marks = e.target.value; setResults(n);
                          }}
                        />
                        <span className="text-gray-300 font-bold">/</span>
                        <input 
                          placeholder="100" value={res.max_marks}
                          className="w-10 bg-transparent border-none py-3 text-[10px] font-bold text-gray-400 text-center focus:ring-0"
                          onChange={(e) => {
                            const n = [...results]; n[idx].max_marks = e.target.value; setResults(n);
                          }}
                        />
                      </div>
                      <button type="button" onClick={() => removeSubjectField(idx)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-blue-900 text-white font-black py-5 rounded-3xl mt-8 uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'FINALIZING...' : 'UPLOAD & PUBLISH'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadResult;
