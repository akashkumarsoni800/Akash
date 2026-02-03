import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { FileUp, Search, UserCircle, Plus, Trash2, BookOpen, ChevronDown, Calculator } from 'lucide-react';

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

      // 2. Fetch Exams (Dynamic Table)
      const { data: examData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (examData) setExams(examData);
    } catch (error) {
      toast.error("Database Connection Error");
    }
  };

  // ✅ Calculation: Total Marks and Percentage
  const calculateTotal = () => {
    const totalObtained = results.reduce((acc, curr) => acc + (Number(curr.marks) || 0), 0);
    const totalMax = results.reduce((acc, curr) => acc + (Number(curr.max_marks) || 0), 0);
    const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : 0;
    return { totalObtained, totalMax, percentage };
  };

  // ✅ Dynamic Exam Logic
  const handleExamChange = (examId) => {
    const exam = exams.find(e => e.id === examId);
    setSelectedExam(examId);
    
    if (exam && Array.isArray(exam.subjects)) {
      const autoSubjects = exam.subjects.map(sub => ({
        subject: sub,
        marks: '',
        max_marks: exam.max_marks || '100'
      }));
      setResults(autoSubjects);
      toast.success(`${exam.subjects.length} Subjects loaded for ${exam.exam_name}`);
    } else {
      // Reset if no predefined subjects
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!selectedStudent || !selectedExam) return toast.error("Please complete Step 1 and Step 2!");
    
    setLoading(true);
    const stats = calculateTotal();
    
    try {
      const { error } = await supabase.from('results').insert({
        student_id: selectedStudent.id,
        exam_id: selectedExam,
        marks_data: results,
        total_obtained: stats.totalObtained,
        total_max: stats.totalMax,
        percentage: stats.percentage,
        uploaded_at: new Date()
      });

      if (error) throw error;
      toast.success(`Result Published! Score: ${stats.percentage}%`);
      setSelectedStudent(null);
      setSelectedExam('');
      setResults([{ subject: '', marks: '', max_marks: '100' }]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const stats = calculateTotal();

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-blue-900 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
              <FileUp size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Result Upload Portal</h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Dynamic Grading System</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Step 1 Student Selection */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
              <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-blue-900 text-white flex items-center justify-center text-[8px]">1</span> 
                Select Student
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" placeholder="Search by name..."
                    className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 text-xs font-bold focus:ring-2 focus:ring-blue-900 transition-all"
                    value={search} onChange={(e) => handleFilter(e.target.value, classFilter)}
                  />
                </div>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-xs font-black text-blue-900 appearance-none cursor-pointer"
                    value={classFilter} onChange={(e) => { setClassFilter(e.target.value); handleFilter(search, e.target.value); }}
                  >
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-900" size={16} />
                </div>
              </div>

              <div className="max-h-[450px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredStudents.map(s => (
                  <button 
                    key={s.id} onClick={() => setSelectedStudent(s)}
                    className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 ${selectedStudent?.id === s.id ? 'bg-blue-900 text-white shadow-2xl scale-[1.02]' : 'bg-gray-50 hover:bg-white hover:shadow-md'}`}
                  >
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black ${selectedStudent?.id === s.id ? 'bg-white/20' : 'bg-blue-100 text-blue-900'}`}>{s.full_name[0]}</div>
                    <div className="text-left">
                      <p className="text-xs font-black uppercase leading-none mb-1">{s.full_name}</p>
                      <p className={`text-[9px] font-bold ${selectedStudent?.id === s.id ? 'text-white/60' : 'text-gray-400'}`}>ID: #{s.id.slice(0,5)} | {s.class_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Step 2 & 3 Exam & Marks Entry */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
              
              {/* Exam Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full bg-blue-900 text-white flex items-center justify-center text-[8px]">2</span> 
                    Choose Exam
                  </p>
                  <div className="relative">
                    <select 
                      required
                      className="w-full bg-blue-50 border-2 border-blue-100 rounded-3xl px-6 py-5 font-black text-blue-900 appearance-none focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
                      value={selectedExam}
                      onChange={(e) => handleExamChange(e.target.value)}
                      style={{ color: '#1e3a8a' }}
                    >
                      <option value="">SELECT EXAM TYPE</option>
                      {exams.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.exam_name.toUpperCase()}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-900" size={20} />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-[2rem] p-6 flex items-center gap-4 border border-gray-100">
                  <div className="bg-white p-3 rounded-2xl shadow-sm"><Calculator className="text-blue-900" size={24}/></div>
                  <div>
                    <p className="text-2xl font-black text-gray-900">{stats.percentage}%</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Calculated Performance</p>
                  </div>
                </div>
              </div>

              {/* Marks Table */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full bg-blue-900 text-white flex items-center justify-center text-[8px]">3</span> 
                    Subject-wise Marks
                  </p>
                  <button 
                    type="button" 
                    onClick={() => setResults([...results, { subject: '', marks: '', max_marks: '100' }])}
                    className="bg-blue-900 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
                  >
                    <Plus size={14}/> Add Subject
                  </button>
                </div>

                <div className="space-y-3">
                  {results.map((res, idx) => (
                    <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-gray-50/50 p-4 rounded-3xl border border-gray-100 hover:border-blue-200 transition-all group">
                      <div className="bg-white p-3 rounded-2xl text-blue-900 shadow-sm border border-gray-100 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                        <BookOpen size={18}/>
                      </div>
                      <input 
                        placeholder="SUBJECT NAME" value={res.subject}
                        className="flex-1 min-w-[150px] bg-white border-none rounded-2xl px-5 py-3 text-xs font-black text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-900 uppercase"
                        onChange={(e) => {
                          const n = [...results]; n[idx].subject = e.target.value; setResults(n);
                        }}
                      />
                      <div className="flex items-center gap-3 bg-white px-5 rounded-2xl shadow-sm border border-gray-100">
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
                          className="w-12 bg-transparent border-none py-3 text-xs font-bold text-gray-400 text-center focus:ring-0"
                          onChange={(e) => {
                            const n = [...results]; n[idx].max_marks = e.target.value; setResults(n);
                          }}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setResults(results.filter((_, i) => i !== idx))}
                        className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Footer */}
              <div className="mt-8 p-6 bg-blue-900 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center text-white shadow-2xl shadow-blue-200">
                 <div className="text-center md:text-left mb-4 md:mb-0">
                    <p className="text-[10px] font-black uppercase text-blue-200 tracking-widest">Aggregate Score</p>
                    <h2 className="text-3xl font-black">{stats.totalObtained} <span className="text-lg opacity-50">/ {stats.totalMax}</span></h2>
                 </div>
                 <button 
                  type="submit" disabled={loading}
                  className="bg-white text-blue-900 px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-xl disabled:opacity-50"
                >
                  {loading ? 'PUBLISHING...' : 'PUBLISH NOW'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadResult;
