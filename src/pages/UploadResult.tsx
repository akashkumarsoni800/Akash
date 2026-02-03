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
      // 1. Fetch Approved Students
      const { data: stdData } = await supabase.from('students').select('*').eq('is_approved', 'approved');
      if (stdData) {
        setAllStudents(stdData);
        setFilteredStudents(stdData);
        setClasses(['All', ...new Set(stdData.map(s => s.class_name))]);
      }

      // 2. Fetch Exams for Dropdown
      const { data: examData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (examData) setExams(examData);
    } catch (error) {
      toast.error("Error fetching database records");
    }
  };

  const handleExamChange = (examId) => {
    const exam = exams.find(e => e.id === examId);
    setSelectedExam(examId);
    
    // Auto-fill subjects if available in the exam record
    if (exam && exam.subjects) {
      const autoSubjects = exam.subjects.map(sub => ({
        subject: sub,
        marks: '',
        max_marks: exam.max_marks || '100'
      }));
      setResults(autoSubjects);
      toast.success(`${exam.subjects.length} Subjects loaded for ${exam.exam_name}`);
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
    if(!selectedStudent || !selectedExam) return toast.error("Please select a Student and an Exam!");
    
    setLoading(true);
    const { error } = await supabase.from('results').insert({
      student_id: selectedStudent.id,
      exam_id: selectedExam, 
      marks_data: results,
      uploaded_at: new Date()
    });

    setLoading(false);
    if (!error) {
      toast.success("Result Published Successfully!");
      setSelectedStudent(null);
      setResults([{ subject: '', marks: '', max_marks: '100' }]);
      setSelectedExam('');
    } else {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 bg-[#1E3A8A] rounded-2xl flex items-center justify-center text-white shadow-lg">
            <FileUp size={24} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Academic Results</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Student Selection */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Select Target Student</p>
              
              <div className="space-y-3 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="text" placeholder="Filter by name..."
                    className="w-full bg-gray-50 border-none rounded-xl pl-10 py-3 text-xs font-bold focus:ring-2 focus:ring-[#1E3A8A]"
                    value={search} onChange={(e) => handleFilter(e.target.value, classFilter)}
                  />
                </div>
                <select 
                  className="w-full bg-gray-50 border-none rounded-xl py-3 text-xs font-black text-[#1E3A8A] cursor-pointer"
                  value={classFilter} onChange={(e) => { setClassFilter(e.target.value); handleFilter(search, e.target.value); }}
                >
                  {classes.map(c => <option key={c} value={c} className="font-bold">CLASS: {c}</option>)}
                </select>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredStudents.map(s => (
                  <button 
                    key={s.id} onClick={() => setSelectedStudent(s)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedStudent?.id === s.id ? 'bg-[#1E3A8A] text-white shadow-md' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black ${selectedStudent?.id === s.id ? 'bg-white/20' : 'bg-blue-100 text-[#1E3A8A]'}`}>{s.full_name[0]}</div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase leading-none">{s.full_name}</p>
                      <p className="text-[8px] font-bold opacity-60 mt-1 tracking-wider">{s.class_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Exam & Marks Entry */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="relative">
                  <label className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-widest ml-2 mb-2 block">Available Exams</label>
                  <div className="relative">
                    <select 
                      required
                      className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl px-5 py-4 font-black text-[#1E3A8A] appearance-none focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
                      style={{ color: '#1E3A8A' }} 
                      value={selectedExam}
                      onChange={(e) => handleExamChange(e.target.value)}
                    >
                      <option value="" className="text-gray-400">CHOOSE EXAM...</option>
                      {exams.map(ex => (
                        <option key={ex.id} value={ex.id} className="text-[#1E3A8A] bg-white font-bold py-2">
                          {ex.exam_name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1E3A8A] pointer-events-none" size={18} />
                  </div>
                </div>

                {selectedStudent && (
                  <div className="bg-green-50 p-4 rounded-3xl flex items-center gap-4 border border-green-100 animate-in zoom-in-95">
                    <div className="bg-green-600 text-white p-2.5 rounded-xl shadow-lg shadow-green-100"><UserCircle size={20}/></div>
                    <div>
                      <p className="text-[10px] font-black text-green-900 uppercase leading-none">{selectedStudent.full_name}</p>
                      <p className="text-[8px] font-bold text-green-600 mt-1 uppercase tracking-widest italic">Target Selected</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <p className="text-[11px] font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
                    <BookOpen size={16} className="text-[#1E3A8A]"/> Marks Entry Panel
                  </p>
                  <button type="button" onClick={add
