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
                      className="w-full bg-blue-50 border-2 border-blue-100 rounded-3xl px-6 py-5 font-black text-blue-900 appearance-none focus:ring-4 focus:ring-blue-1
