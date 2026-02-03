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
  const [students, setAllStudents] = useState([]); // All approved students
  const [filteredStudents, setFilteredStudents] = useState([]); // Displayed list
  const [exams, setExams] = useState([]); // All exams from DB
  
  // Selection States
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState('');
  
  // Form States
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState([]);
  const [results, setResults] = useState([{ subject: '', marks: '', max_marks: '100' }]);

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Fetch Students & Exams
  const fetchData = async () => {
    try {
      // Fetch Approved Students
      const { data: stdData } = await supabase
        .from('students')
        .select('*')
        .eq('is_approved', 'approved')
        .order('full_name');
        
      if (stdData) {
        setAllStudents(stdData);
        setFilteredStudents(stdData);
        // Extract unique classes for filter
        const uniqueClasses = ['All', ...new Set(stdData.map(s => s.class_name))];
        setClasses(uniqueClasses);
      }

      // Fetch Created Exams (Dynamic)
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

  // 2. Handle Filter Logic
  useEffect(() => {
    let temp = students;
    if (classFilter !== 'All') {
      temp = temp.filter(s => s.class_name === classFilter);
    }
    if (search) {
      temp = temp.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()));
    }
    setFilteredStudents(temp);
  }, [search, classFilter, students]);

  // 3. Handle Dynamic Exam Selection (Auto-fill Subjects)
  const handleExamSelect = (examId) => {
    setSelectedExamId(examId);
    
    // Find the exam object to get its subjects
    const selectedExam = exams.find(e => e.id === examId);
    
    if (selectedExam && selectedExam.subjects && Array.isArray(selectedExam.subjects)) {
      // If DB has subjects saved as an array, use them
      const autoFilledSubjects = selectedExam.subjects.map(sub => ({
        subject: sub,
        marks: '',
        max_marks: selectedExam.max_marks || '100' // Use exam default max marks if available
      }));
      setResults(autoFilledSubjects);
      toast.info(`Loaded ${autoFilledSubjects.length} subjects for ${selectedExam.exam_name}`);
    } else {
      // Fallback if no subjects found
      setResults([{ subject: '', marks: '', max_marks: '100' }]);
    }
  };

  // 4. Form Handlers
  const handleSubjectChange = (index, field, value) => {
    const newResults = [...results];
    newResults[index][field] = value;
    setResults(newResults);
  };

  const addSubjectRow = () => {
    setResults([...results, { subject: '', marks: '', max_marks: '100' }]);
  };

  const removeSubjectRow = (index) => {
    if (results.length > 1) {
      setResults(results.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedExamId) {
      return toast.error("Please select a student and an exam!");
    }

    setLoading(true);
    try {
      // Assuming you store results in a 'results' table
      // Structure: { student_id, exam_id, marks_data (json), ... }
      const { error } = await supabase.from('results').insert({
        student_id: selectedStudent.id,
        exam_id: selectedExamId,
        marks_data: results, // Storing the array of subjects/marks
        uploaded_at: new Date()
      });

      if (error) throw error;

      toast.success("Result Published Successfully!");
      // Reset logic (optional)
      setSelectedStudent(null);
      setResults([{ subject: '', marks: '', max_marks: '100' }]); 
      // Keep exam selected for easier bulk uploading

    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="bg-blue-900 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
            <FileUp size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Upload Results</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Digital Marksheet Entry</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Student Selection */}
          <div className="lg:col-span-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 h-[600px] flex flex-col">
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Step 1: Select Student</h3>
            
            {/* Filters */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search name..." 
                  value={search}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="relative">
                <select 
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-xs font-black uppercase focus:ring-2 focus:ring-blue-100 appearance-none"
                >
                  {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16}/>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {filteredStudents.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedStudent(s)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    selectedStudent?.id === s.id 
                    ? 'bg-blue-900 text-white border-blue-900 shadow-lg shadow-blue-200' 
                    : 'bg-gray-50 text-gray-700 border-transparent hover:bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs ${selectedStudent?.id === s.id ? 'bg-white/20' : 'bg-white text-blue-900'}`}>
                      {s.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{s.full_name}</h4>
                      <p className={`text-[10px] font-bold uppercase ${selectedStudent?.id === s.id ? 'text-blue-200' : 'text-gray-400'}`}>Class: {s.class_name}</p>
                    </div>
                    {selectedStudent?.id === s.id && <CheckCircle size={16} className="ml-auto text-emerald-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Exam & Marks Form */}
          <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
             <div className="flex justify-between items-start mb-8">
               <div>
                  <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Step 2: Exam Details</h3>
                  <div className="relative min-w-[300px]">
                    <select 
                      value={selectedExamId}
                      onChange={(e) => handleExamSelect(e.target.value)}
                      className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-2xl px-5 py-4 font-bold text-blue-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">-- Select Created Exam --</option>
                      {exams.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.exam_name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={20}/>
                  </div>
               </div>
               
               {/* Selected Student Badge */}
               {selectedStudent ? (
                 <div className="bg-emerald-50 border border-emerald-100 px-5 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-emerald-500 text-white p-2 rounded-xl"><User size={20}/></div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-800 uppercase">Selected Student</p>
                      <p className="font-bold text-emerald-900">{selectedStudent.full_name}</p>
                    </div>
                 </div>
               ) : (
                 <div className="bg-gray-50 px-5 py-4 rounded-2xl border border-dashed border-gray-300 text-gray-400 text-xs font-bold uppercase">
                   No Student Selected
                 </div>
               )}
             </div>

             {/* Marks Entry Area */}
             <div className="flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Step 3: Enter Marks</h3>
                  <button onClick={addSubjectRow} className="text-blue-600 text-[10px] font-black uppercase flex items-center gap-1 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
                    <Plus size={14}/> Add Subject Row
                  </button>
                </div>

                <div className="space-y-3">
                  {results.map((res, index) => (
                    <div key={index} className="flex gap-3 items-center group animate-in slide-in-from-left-4" style={{animationDelay: `${index * 50}ms`}}>
                      <div className="bg-gray-50 p-3 rounded-xl text-gray-400 group-hover:text-blue-600 transition-colors">
                        <BookOpen size={18} />
                      </div>
                      
                      <div className="flex-1">
                        <input 
                          type="text" 
                          placeholder="Subject Name"
                          value={res.subject}
                          onChange={(e) => handleSubjectChange(index, 'subject', e.target.value)}
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                      </div>

                      <div className="w-24">
                        <input 
                          type="number" 
                          placeholder="Marks"
                          value={res.marks}
                          onChange={(e) => handleSubjectChange(index, 'marks', e.target.value)}
                          className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-black text-center focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all text-blue-900"
                        />
                      </div>

                      <div className="w-20">
                         <input 
                          type="number" 
                          value={res.max_marks}
                          onChange={(e) => handleSubjectChange(index, 'max_marks', e.target.value)}
                          className="w-full bg-transparent border-none text-xs font-bold text-gray-400 text-center"
                          title="Max Marks"
                        />
                      </div>

                      <button 
                        onClick={() => removeSubjectRow(index)}
                        className="p-3 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
             </div>

             {/* Submit Button */}
             <div className="mt-8 pt-6 border-t border-gray-100">
               <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-900 hover:bg-black text-white py-5 rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
               >
                 {loading ? 'Publishing Result...' : (
                   <> <FileUp size={18} /> Publish Result Now </>
                 )}
               </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UploadResult;
