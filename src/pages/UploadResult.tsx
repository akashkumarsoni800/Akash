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
      // 1. Fetch Students
      const { data: stdData } = await supabase.from('students').select('*').eq('is_approved', 'approved');
      if (stdData) {
        setAllStudents(stdData);
        setFilteredStudents(stdData);
        setClasses(['All', ...new Set(stdData.map(s => s.class_name))]);
      }

      // 2. Fetch Exams
      const { data: examData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (examData) setExams(examData);
    } catch (error) {
      toast.error("Data load failed");
    }
  };

  const handleExamChange = (examId) => {
    const exam = exams.find(e => e.id === examId);
    setSelectedExam(examId);
    
    // Crash Fix & Auto Load
    if (exam && Array.isArray(exam.subjects)) {
      const autoSubjects = exam.subjects.map(subName => ({
        subject: subName,
        marks: '',
        max_marks: exam.max_marks || '100'
      }));
      setResults(autoSubjects);
      toast.success("Subjects Auto-Loaded!");
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
    if(!selectedStudent || !selectedExam) return toast.error("Select Student & Exam!");
    
    setLoading(true);
    try {
      const { error } = await supabase.from('results').insert({
        student_id: selectedStudent.id,
        exam_id: selectedExam,
        marks_data: results,
        uploaded_at: new Date()
      });

      if (error) throw error;
      toast.success("Result Published!");
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
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Upload Results</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Student Selection */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Step 1: Select Student</p>
              
              <div className="space-y-3 mb-6">
                <input 
                  type="text" placeholder="Search name..."
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-black placeholder:text-gray-400 focus:ring-2 focus:ring-blue-900"
                  value={search} onChange={(e) => handleFilter(e.target.value, classFilter)}
                />
                
                <select 
                  className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-xs font-bold text-black"
                  value={classFilter} 
                  onChange={(e) => { setClassFilter(e.target.value); handleFilter(search, e.target.value); }}
                >
                  {classes.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                </select>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                {filteredStudents.map(s => (
                  <button 
                    key={s.id} onClick={() => setSelectedStudent(s)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedStudent?.id === s.id ? 'bg-blue-900 text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black ${selectedStudent?.id === s.id ? 'bg-white/20' : 'bg-blue-100 text-blue-900'}`}>{s.full_name.charAt(0)}</div>
                    <div className="text-left">
                      <p className={`text-[10px] font-black uppercase ${selectedStudent?.id === s.id ? 'text-white' : 'text-gray-900'}`}>{s.full_name}</p>
                      <p className={`text-[8px] font-bold ${selectedStudent?.id === s.id ? 'text-blue-200' : 'text-gray-400'}`}>CLASS: {s.class_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Exam & Marks Entry */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Step 2: Choose Exam</label>
                  
                  {/* ✅ FIX: Native Select Styling for Guaranteed Visibility */}
                  <select 
                    required
                    className="w-full mt-2 bg-gray-50 border-2 border-gray-200 text-gray-900 text-sm rounded-2xl focus:ring-blue-500 focus:border-blue-500 block w-full p-4 font-bold"
                    style={{ color: 'black', opacity: 1 }} // FORCE BLACK COLOR
                    value={selectedExam}
                    onChange={(e) => handleExamChange(e.target.value)}
                  >
                    <option value="" className="text-gray-500">Choose an Exam...</option>
                    {exams.length > 0 ? (
                      exams.map(ex => (
                        <option key={ex.id} value={ex.id} className="text-black font-bold">
                          {ex.exam_name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No exams found</option>
                    )}
                  </select>
                </div>
                
                {selectedStudent && (
                  <div className="bg-blue-50 p-4 rounded-2xl flex items-center gap-4 border border-blue-100">
                    <div className="bg-blue-900 text-white p-2 rounded-xl"><UserCircle size={20}/></div>
                    <div>
                      <p className="text-[10px] font-black text-blue-900 uppercase leading-none">{selectedStudent.full_name}</p>
                      <p className="text-[8px] font-bold text-blue-500 mt-1 uppercase">Ready to upload</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step 3: Marks Entry</p>
                  <button type="button" onClick={addSubjectField} className="text-blue-900 text-[10px] font-black uppercase flex items-center gap-1 hover:underline"><Plus size={14}/> Add Subject</button>
                </div>

                <div className="bg-gray-50 p-4 rounded-3xl space-y-3">
                  {results.map((res, idx) => (
                    <div key={idx} className="flex gap-3 items-center group">
                      <div className="bg-white p-3 rounded-xl text-gray-400"><BookOpen size={16}/></div>
                      <input 
                        placeholder="Subject" value={res.subject}
                        className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-xs font-bold text-black"
                        onChange={(e) => {
                          const n = [...results]; n[idx].subject = e.target.value; setResults(n);
                        }}
                      />
                      <input 
                        placeholder="00" value={res.marks} type="number"
                        className="w-20 bg-white border-none rounded-xl px-4 py-3 text-xs font-black text-blue-900 text-center"
                        onChange={(e) => {
                          const n = [...results]; n[idx].marks = e.target.value; setResults(n);
                        }}
                      />
                      <span className="text-gray-300">/</span>
                      <input 
                        placeholder="100" value={res.max_marks}
                        className="w-16 bg-transparent border-none px-2 py-3 text-xs font-bold text-gray-400 text-center"
                        onChange={(e) => {
                          const n = [...results]; n[idx].max_marks = e.target.value; setResults(n);
                        }}
                      />
                      <button type="button" onClick={() => removeSubjectField(idx)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-blue-900 text-white font-black py-5 rounded-3xl mt-8 uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-[1.01] transition-all"
              >
                {loading ? 'PUBLISHING...' : 'PUBLISH RESULT NOW'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadResult;
