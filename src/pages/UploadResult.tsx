import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { FileUp, Search, UserCircle, Plus, Trash2, BookOpen, ChevronDown } from 'lucide-react';

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
      const { data: stdData, error: stdError } = await supabase
        .from('students')
        .select('*')
        .eq('is_approved', 'approved');
      
      if (stdError) throw stdError;
      
      if (stdData) {
        setAllStudents(stdData);
        setFilteredStudents(stdData);
        const uniqueClasses = ['All', ...new Set(stdData.map(s => s.class_name))];
        setClasses(uniqueClasses);
      }

      // 2. Fetch Exams
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (examError) throw examError;
      if (examData) setExams(examData);

    } catch (error) {
      console.error(error);
      toast.error("Error loading data");
    }
  };

  const handleExamChange = (examId) => {
    setSelectedExam(examId);
    const exam = exams.find(e => e.id === examId);
    
    // ✅ CRASH FIX: Safe check for subjects
    if (exam && Array.isArray(exam.subjects)) {
      const autoSubjects = exam.subjects.map(subName => ({
        subject: subName,
        marks: '',
        max_marks: exam.max_marks || '100'
      }));
      setResults(autoSubjects);
      toast.success(`${exam.subjects.length} Subjects Loaded!`);
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
    if(!selectedStudent || !selectedExam) return toast.error("Please select both Student & Exam");
    
    const invalidEntry = results.some(r => r.marks === '' || r.subject === '');
    if(invalidEntry) return toast.warning("Please fill all marks fields.");

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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="text" placeholder="Search name..."
                    className="w-full bg-gray-50 border-none rounded-xl pl-10 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-900 text-black"
                    value={search} onChange={(e) => handleFilter(e.target.value, classFilter)}
                  />
                </div>
                
                {/* ✅ CLASS FILTER FIXED */}
                <div className="relative">
                  <select 
                    className="w-full bg-gray-100 border-none rounded-xl py-3 px-4 text-xs font-bold text-black appearance-none cursor-pointer"
                    style={{ color: 'black' }}
                    value={classFilter} 
                    onChange={(e) => { setClassFilter(e.target.value); handleFilter(search, e.target.value); }}
                  >
                    {classes.map(c => <option key={c} value={c} style={{ color: 'black' }}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(s => (
                    <button 
                      key={s.id} onClick={() => setSelectedStudent(s)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedStudent?.id === s.id ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black ${selectedStudent?.id === s.id ? 'bg-white/20' : 'bg-blue-100 text-blue-900'}`}>{s.full_name.charAt(0)}</div>
                      <div className="text-left">
                        <p className={`text-[10px] font-black uppercase leading-none ${selectedStudent?.id === s.id ? 'text-white' : 'text-gray-900'}`}>{s.full_name}</p>
                        <p className={`text-[8px] font-bold mt-1 ${selectedStudent?.id === s.id ? 'text-blue-200' : 'text-gray-400'}`}>CLASS: {s.class_name}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-center text-xs text-gray-400 font-bold py-4">No students found</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Exam & Marks Entry */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Step 2: Choose Exam</label>
                  
                  {/* ✅ EXAM DROPDOWN FIXED - High Contrast */}
                  <div className="relative mt-1">
                    <select 
                      required
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-5 py-4 font-bold text-black appearance-none focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
                      style={{ color: '#000000', backgroundColor: '#F9FAFB' }} // Forced Black Text on Light Grey
                      value={selectedExam}
                      onChange={(e) => handleExamChange(e.target.value)}
                    >
                      <option value="" className="text-gray-400">--- CLICK TO SELECT EXAM ---</option>
                      {exams.map(ex => (
                        <option key={ex.id} value={ex.id} style={{ color: 'black', background: 'white' }}>
                          {ex.exam_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={20} />
                  </div>
                </div>
                
                {selectedStudent && (
                  <div className="bg-blue-50 p-4 rounded-2xl flex items-center gap-4 border border-blue-100 animate-in fade-in">
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
                  <button type="button" onClick={addSubjectField} className="text-blue-900 text-[10px] font-black uppercase flex items-center gap-1 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all"><Plus size={14}/> Add Subject</button>
                </div>

                <div className="bg-gray-50 p-4 rounded-3xl space-y-3">
                  {results.map((res, idx) => (
                    <div key={idx} className="flex gap-3 items-center group animate-in slide-in-from-right-2">
                      <div className="bg-white p-3 rounded-xl text-gray-400 group-hover:text-blue-900 shadow-sm"><BookOpen size={16}/></div>
                      
                      {/* Subject Name */}
                      <input 
                        placeholder="Subject" 
                        value={res.subject}
                        className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-xs font-bold shadow-sm text-black placeholder:text-gray-300 focus:ring-2 focus:ring-blue-900"
                        onChange={(e) => {
                          const n = [...results]; n[idx].subject = e.target.value; setResults(n);
                        }}
                      />
                      
                      {/* Marks */}
                      <input 
                        placeholder="00" 
                        value={res.marks} 
                        type="number"
                        className="w-20 bg-white border-none rounded-xl px-4 py-3 text-xs font-black text-blue-900 shadow-sm text-center focus:ring-2 focus:ring-blue-900"
                        onChange={(e) => {
                          const n = [...results]; n[idx].marks = e.target.value; setResults(n);
                        }}
                      />
                      
                      <span className="text-gray-300 font-bold">/</span>
                      
                      {/* Max Marks */}
                      <input 
                        placeholder="100" 
                        value={res.max_marks}
                        className="w-16 bg-transparent border-none px-2 py-3 text-xs font-bold text-gray-400 text-center focus:ring-0"
                        onChange={(e) => {
                          const n = [...results]; n[idx].max_marks = e.target.value; setResults(n);
                        }}
                      />
                      
                      <button type="button" onClick={() => removeSubjectField(idx)} className="p-2 text-gray-300 hover:text-red-500 transition"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-blue-900 text-white font-black py-5 rounded-3xl mt-8 uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
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
