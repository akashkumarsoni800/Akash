import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { FileUp, Search, UserCircle, Plus, Trash2, Calendar } from 'lucide-react';

const UploadResult = () => {
  const [loading, setLoading] = useState(false);
  const [students, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState([]);
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [examName, setExamName] = useState('');
  const [existingExams, setExistingExams] = useState([]); // DB se exams fetch karne ke liye
  const [results, setResults] = useState([{ subject: '', marks: '', max_marks: '100' }]);

  // Initial Data Fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data: stdData } = await supabase.from('students').select('*').eq('is_approved', 'approved');
    if (stdData) {
      setAllStudents(stdData);
      setFilteredStudents(stdData);
      setClasses(['All', ...new Set(stdData.map(s => s.class_name))]);
    }
  };

  // Jab student select ho, unke purane exams fetch karo
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentResults();
    }
  }, [selectedStudent]);

  const fetchStudentResults = async () => {
    const { data } = await supabase
      .from('results')
      .select('exam_name, marks_data')
      .eq('student_id', selectedStudent.id);
    
    if (data) setExistingExams(data);
  };

  // Jab koi purana exam select karein, to marks auto-fill ho jayein
  const handleExamSelection = (name) => {
    setExamName(name);
    const existing = existingExams.find(e => e.exam_name === name);
    if (existing) {
      setResults(existing.marks_data);
      toast.info("Existing marks loaded for this exam.");
    } else {
      setResults([{ subject: '', marks: '', max_marks: '100' }]);
    }
  };

  // Search & Class Filter Logic
  useEffect(() => {
    const filtered = students.filter(s => 
      (classFilter === 'All' || s.class_name === classFilter) &&
      s.full_name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [search, classFilter, students]);

  const addSubjectField = () => setResults([...results, { subject: '', marks: '', max_marks: '100' }]);
  
  const removeSubjectField = (index) => {
    const newRes = results.filter((_, i) => i !== index);
    setResults(newRes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!selectedStudent || !examName) return toast.error("Please select student and exam name!");
    
    setLoading(true);
    // Upsert use karenge taaki agar same exam ho to update ho jaye
    const { error } = await supabase.from('results').upsert({
      student_id: selectedStudent.id,
      exam_name: examName,
      marks_data: results,
      updated_at: new Date()
    }, { onConflict: 'student_id, exam_name' }); // DB mein unique constraint hona chahiye student_id + exam_name par

    setLoading(false);
    if (!error) {
      toast.success("Result Saved Successfully!");
      fetchStudentResults();
    } else {
      toast.error(error.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 bg-[#F8FAFC] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-blue-900 rounded-3xl flex items-center justify-center text-white shadow-2xl">
            <FileUp size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Result Management</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update or Publish Academic Records</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Student List (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <div className="flex gap-2 mb-4">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                 <input 
                  type="text" placeholder="Search..." 
                  className="w-full bg-gray-50 border-none rounded-xl pl-10 py-3 text-xs font-bold"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                 />
               </div>
               <select 
                className="bg-gray-100 border-none rounded-xl text-[10px] font-black uppercase px-2"
                onChange={(e) => setClassFilter(e.target.value)}
               >
                 {classes.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {filteredStudents.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${selectedStudent?.id === s.id ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}
                >
                  <UserCircle size={18} className={selectedStudent?.id === s.id ? 'text-blue-300' : 'text-gray-400'} />
                  <div className="text-left">
                    <p className="text-[11px] font-black uppercase leading-none">{s.full_name}</p>
                    <p className="text-[9px] font-bold opacity-60 uppercase">Class: {s.class_name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Data Entry (8 Columns) */}
        <div className="lg:col-span-8">
          {selectedStudent ? (
            <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center font-black text-blue-900 uppercase">{selectedStudent.full_name[0]}</div>
                <div>
                  <h3 className="font-black text-gray-800 uppercase leading-none">{selectedStudent.full_name}</h3>
                  <p className="text-[10px] font-bold text-blue-600 uppercase">Updating Result Data</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Exam Name (Type or Select)</label>
                  <input 
                    list="exam-list"
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 mt-2 font-bold focus:ring-2 focus:ring-blue-900"
                    placeholder="Enter Exam Name"
                    value={examName}
                    onChange={(e) => handleExamSelection(e.target.value)}
                  />
                  <datalist id="exam-list">
                    {existingExams.map((e, i) => <option key={i} value={e.exam_name} />)}
                  </datalist>
                </div>
                <div className="bg-blue-50/50 rounded-2xl p-4 flex items-center gap-3">
                    <Calendar className="text-blue-900" size={20} />
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase">Class Context</p>
                        <p className="text-sm font-black text-blue-900 uppercase">{selectedStudent.class_name}</p>
                    </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">
                  <div className="w-1/2">Subject Name</div>
                  <div className="w-1/4">Obtained</div>
                  <div className="w-1/4">Max</div>
                </div>
                {results.map((res, idx) => (
                  <div key={idx} className="flex gap-3 group animate-in slide-in-from-top-2">
                    <input 
                      placeholder="Maths"
                      className="w-1/2 bg-gray-50 border-none rounded-xl px-5 py-3 font-bold focus:bg-white focus:ring-1 focus:ring-blue-100 transition"
                      value={res.subject}
                      onChange={(e) => {
                        const newRes = [...results];
                        newRes[idx].subject = e.target.value;
                        setResults(newRes);
                      }}
                    />
                    <input 
                      placeholder="85"
                      className="w-1/4 bg-gray-50 border-none rounded-xl px-5 py-3 font-bold text-center"
                      value={res.marks}
                      onChange={(e) => {
                        const newRes = [...results];
                        newRes[idx].marks = e.target.value;
                        setResults(newRes);
                      }}
                    />
                    <input 
                      placeholder="100"
                      className="w-1/4 bg-gray-50 border-none rounded-xl px-5 py-3 font-bold text-center"
                      value={res.max_marks}
                      onChange={(e) => {
                        const newRes = [...results];
                        newRes[idx].max_marks = e.target.value;
                        setResults(newRes);
                      }}
                    />
                    <button type="button" onClick={() => removeSubjectField(idx)} className="text-gray-300 hover:text-red-500 transition px-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-4 mt-8">
                <button 
                  type="button" 
                  onClick={addSubjectField}
                  className="flex-1 py-4 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-black text-gray-400 uppercase hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Add Subject
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-[2] bg-blue-900 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-blue-100 hover:bg-black transition"
                >
                  {loading ? 'Processing...' : 'Save Academic Record'}
                </button>
              </div>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-dashed border-gray-200 p-20 text-center">
              <div className="bg-gray-50 p-6 rounded-full mb-4">
                <UserCircle size={40} className="text-gray-200" />
              </div>
              <h3 className="font-black text-gray-900 uppercase">No Student Selected</h3>
              <p className="text-xs font-bold text-gray-400 uppercase mt-2 tracking-widest">Select a student from the list to manage their results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadResult;
