import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  FileUp, Search, User, BookOpen, 
  Trash2, Plus, ChevronDown, CheckCircle 
} from 'lucide-react';

const UploadResult = () => {
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [students, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [exams, setExams] = useState([]); 
  
  // Selection States
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState('');
  
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
      const { data: stdData } = await supabase
        .from('students')
        .select('*')
        .eq('is_approved', 'approved')
        .order('full_name');
        
      if (stdData) {
        setAllStudents(stdData);
        setFilteredStudents(stdData);
        const uniqueClasses = ['All', ...new Set(stdData.map(s => s.class_name))];
        setClasses(uniqueClasses);
      }

      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (examData) setExams(examData);

    } catch (error) {
      console.error(error);
      toast.error("Data load karne mein error aayi");
    }
  };

  useEffect(() => {
    let temp = students;
    if (classFilter !== 'All') temp = temp.filter(s => s.class_name === classFilter);
    if (searchTerm) temp = temp.filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredStudents(temp);
  }, [searchTerm, classFilter, students]);

  // ✅ CRASH-PROOF & VISIBLE DROPDOWN LOGIC
  const handleExamSelect = (examId) => {
    setSelectedExamId(examId);
    if (!examId) return;

    const selectedExam = exams.find(e => String(e.id) === String(examId));
    
    if (selectedExam && Array.isArray(selectedExam.subjects)) {
      const autoFilledSubjects = selectedExam.subjects.map(sub => ({
        subject: sub,
        marks: '',
        max_marks: selectedExam.max_marks || '100'
      }));
      setResults(autoFilledSubjects);
      toast.success(`${selectedExam.exam_name} ke subjects load ho gaye!`);
    } else {
      setResults([{ subject: '', marks: '', max_marks: '100' }]);
    }
  };

  const handleSubjectChange = (index, field, value) => {
    const newResults = [...results];
    newResults[index][field] = value;
    setResults(newResults);
  };

  const addSubjectRow = () => setResults([...results, { subject: '', marks: '', max_marks: '100' }]);
  
  const removeSubjectRow = (index) => {
    if (results.length > 1) setResults(results.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedExamId) return toast.error("Student aur Exam select karein!");

    setLoading(true);
    try {
      const { error } = await supabase.from('results').insert({
        student_id: selectedStudent.id,
        exam_id: selectedExamId,
        marks_data: results,
        uploaded_at: new Date()
      });

      if (error) throw error;
      toast.success("Result publish ho gaya!");
      setSelectedStudent(null);
      setResults([{ subject: '', marks: '', max_marks: '100' }]); 
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="bg-blue-900 p-3 rounded-2xl text-white shadow-lg">
            <FileUp size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Result Portal</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest italic">ASM Education Management</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* STEP 1: Student Selection */}
          <div className="lg:col-span-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 h-[600px] flex flex-col">
            <h3 className="text-blue-900 text-[10px] font-black uppercase tracking-widest mb-4">1. SELECT STUDENT</h3>
            
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search name..." 
                  className="w-full bg-gray-50 border-none rounded-2xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-xs font-black text-blue-900 appearance-none"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>)}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {filteredStudents.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedStudent(s)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all ${
                    selectedStudent?.id === s.id 
                    ? 'bg-blue-900 text-white shadow-lg' 
                    : 'bg-gray-50 text-gray-700 hover:bg-white hover:border-gray-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs ${selectedStudent?.id === s.id ? 'bg-white/20' : 'bg-white text-blue-900 shadow-sm'}`}>
                      {s.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{s.full_name}</h4>
                      <p className={`text-[10px] font-bold uppercase ${selectedStudent?.id === s.id ? 'text-blue-200' : 'text-gray-400'}`}>Class: {s.class_name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 2 & 3: Exam Area */}
          <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
             <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
               <div className="w-full md:w-auto">
                  <h3 className="text-blue-900 text-[10px] font-black uppercase tracking-widest mb-2 italic">2. EXAM TYPE</h3>
                  <div className="relative">
                    {/* ✅ HIGH CONTRAST FIX: Explicit black text and white background */}
                    <select 
                      value={selectedExamId}
                      onChange={(e) => handleExamSelect(e.target.value)}
                      className="w-full min-w-[300px] bg-white text-black border-2 border-blue-100 rounded-2xl px-5 py-4 font-black focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all appearance-none cursor-pointer"
                      style={{ color: '#000000', WebkitAppearance: 'none' }}
                    >
                      <option value="" style={{ color: '#666' }}>-- CLICK TO SELECT EXAM --</option>
                      {exams.map(ex => (
                        <option key={ex.id} value={ex.id} style={{ color: '#000', background: '#fff' }}>
                          {ex.exam_name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-900 pointer-events-none" size={20}/>
                  </div>
               </div>
               
               {selectedStudent && (
                 <div className="bg-emerald-50 border border-emerald-100 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle className="text-emerald-500" size={24}/>
                    <div>
                      <p className="text-[10px] font-black text-emerald-800 uppercase leading-none mb-1">Student Selected</p>
                      <p className="font-black text-emerald-900">{selectedStudent.full_name}</p>
                    </div>
                 </div>
               )}
             </div>

             <div className="flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-blue-900 text-[10px] font-black uppercase tracking-widest italic">3. MARKS ENTRY</h3>
                  <button onClick={addSubjectRow} className="bg-blue-50 text-blue-900 text-[10px] font-black uppercase flex items-center gap-1 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all">
                    <Plus size={14} strokeWidth={3}/> Add Row
                  </button>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-[2rem] border border-gray-100 space-y-3">
                  {results.map((res, index) => (
                    <div key={index} className="flex gap-3 items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100 group">
                      <div className="bg-gray-50 p-3 rounded-xl text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-all">
                        <BookOpen size={18} />
                      </div>
                      
                      <div className="flex-1">
                        <input 
                          type="text" 
                          placeholder="Subject"
                          value={res.subject}
                          className="w-full bg-transparent border-none px-2 py-2 text-sm font-black text-gray-800 focus:ring-0 uppercase placeholder:text-gray-300"
                          onChange={(e) => handleSubjectChange(index, 'subject', e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-2 bg-blue-50/50 px-4 py-2 rounded-xl border border-blue-100">
                        <input 
                          type="number" 
                          placeholder="00"
                          value={res.marks}
                          className="w-12 bg-transparent border-none text-sm font-black text-center focus:ring-0 text-blue-900 p-0"
                          onChange={(e) => handleSubjectChange(index, 'marks', e.target.value)}
                        />
                        <span className="text-blue-200 font-black">/</span>
                        <input 
                          type="number" 
                          value={res.max_marks}
                          className="w-10 bg-transparent border-none text-[10px] font-bold text-gray-400 text-center p-0 focus:ring-0"
                          onChange={(e) => handleSubjectChange(index, 'max_marks', e.target.value)}
                        />
                      </div>

                      <button onClick={() => removeSubjectRow(index)} className="p-3 text-gray-300 hover:text-rose-600 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
             </div>

             <div className="mt-8">
               <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-900 hover:bg-black text-white py-6 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
               >
                 {loading ? 'SYNCING DATA...' : 'PUBLISH NOW'}
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadResult;
