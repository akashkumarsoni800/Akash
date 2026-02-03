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
      // 1. Fetch Students
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

      // 2. Fetch Exams (Assuming column is 'title' as per previous code)
      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (examData) setExams(examData);

    } catch (error) {
      console.error(error);
      toast.error("Failed to load initial data");
    }
  };

  // Filter Logic
  useEffect(() => {
    let temp = students;
    if (classFilter !== 'All') temp = temp.filter(s => s.class_name === classFilter);
    if (searchTerm) temp = temp.filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredStudents(temp);
  }, [searchTerm, classFilter, students]);

  // Handle Exam Selection & Auto-fill Subjects
  const handleExamSelect = (examId) => {
    setSelectedExamId(examId);
    const selectedExam = exams.find(e => e.id === examId);
    
    if (selectedExam && selectedExam.subjects && Array.isArray(selectedExam.subjects)) {
      const autoFilledSubjects = selectedExam.subjects.map(sub => ({
        subject: sub,
        marks: '',
        max_marks: selectedExam.max_marks || '100'
      }));
      setResults(autoFilledSubjects);
      toast.success(`Loaded ${autoFilledSubjects.length} subjects for ${selectedExam.title || 'Exam'}`);
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
    if (!selectedStudent || !selectedExamId) return toast.error("Please select a student and an exam!");

    setLoading(true);
    try {
      const { error } = await supabase.from('results').insert({
        student_id: selectedStudent.id,
        exam_id: selectedExamId,
        marks_data: results,
        uploaded_at: new Date()
      });

      if (error) throw error;
      toast.success("Result Published Successfully!");
      setSelectedStudent(null);
      setResults([{ subject: '', marks: '', max_marks: '100' }]); 
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="bg-blue-900 p-3 rounded-2xl text-white shadow-lg">
            <FileUp size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Upload Results</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">BLRS Dynamic Portal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* STEP 1: Student Selection */}
          <div className="lg:col-span-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 h-[600px] flex flex-col">
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4 italic">1. Select Candidate</h3>
            
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
              <div className="relative">
                <select 
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-xs font-black text-blue-900 focus:ring-2 focus:ring-blue-100 appearance-none"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-900 pointer-events-none" size={16}/>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {filteredStudents.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedStudent(s)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    selectedStudent?.id === s.id 
                    ? 'bg-blue-900 text-white border-blue-900 shadow-lg' 
                    : 'bg-gray-50 text-gray-700 border-transparent hover:bg-white hover:border-gray-200'
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
                    {selectedStudent?.id === s.id && <CheckCircle size={16} className="ml-auto text-emerald-400 animate-in zoom-in" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 2 & 3: Form Area */}
          <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
             <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
               <div className="w-full md:w-auto">
                  <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">2. Exam Selection</h3>
                  <div className="relative">
                    {/* Fixed: Changed 'exam_name' to 'title' assuming database column is 'title' */}
                    <select 
                      value={selectedExamId}
                      onChange={(e) => handleExamSelect(e.target.value)}
                      className="w-full min-w-[280px] bg-white text-black border-2 border-gray-100 rounded-2xl px-5 py-4 font-black focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all appearance-none cursor-pointer"
                      style={{ color: 'black' }} 
                    >
                      <option value="" className="text-gray-400" style={{ color: 'gray' }}>-- Choose Created Exam --</option>
                      {exams.map(ex => (
                        <option key={ex.id} value={ex.id} style={{ color: 'black', background: 'white' }}>
                          {ex.title ? ex.title.toUpperCase() : 'Unnamed Exam'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-900 pointer-events-none" size={20}/>
                  </div>
               </div>
               
               {selectedStudent && (
                 <div className="bg-emerald-50 border border-emerald-100 px-5 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-emerald-600 text-white p-2 rounded-xl"><User size={20}/></div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-800 uppercase">Publishing For</p>
                      <p className="font-bold text-emerald-900">{selectedStudent.full_name}</p>
                    </div>
                 </div>
               )}
             </div>

             <div className="flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest italic">3. Marks Breakdown</h3>
                  <button onClick={addSubjectRow} className="text-blue-900 text-[10px] font-black uppercase flex items-center gap-1 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all">
                    <Plus size={14} strokeWidth={3}/> Add Subject
                  </button>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-[2rem] border border-gray-100 space-y-3">
                  {results.map((res, index) => (
                    <div key={index} className="flex gap-3 items-center group animate-in slide-in-from-right-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-50">
                      <div className="bg-gray-100 p-3 rounded-xl text-blue-900">
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
                          className="w-10 bg-transparent border-none text-[10px] font-bold text-gray-400 text-center p-0"
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
                className="w-full bg-blue-900 hover:bg-black text-white py-6 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-3"
               >
                 {loading ? 'SYNCING...' : 'PUBLISH MARKSHEET'}
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadResult;
