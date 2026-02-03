import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { FileUp, Search, User, Plus, Trash2, BookOpen, Save } from 'lucide-react';

const UploadResult = () => {
  const [loading, setLoading] = useState(false);
  const [students, setAllStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // Form State
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [examName, setExamName] = useState('');
  const [results, setResults] = useState([{ subject: '', marks: '', max_marks: '100' }]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*').eq('is_approved', 'approved');
    if (data) {
      setAllStudents(data);
      setFilteredStudents(data);
    }
  };

  const handleSearch = (e: any) => {
    const term = e.target.value.toLowerCase();
    setSearch(term);
    setFilteredStudents(students.filter(s => s.full_name.toLowerCase().includes(term)));
  };

  const handleSubjectChange = (index: number, field: string, value: string) => {
    const newResults: any = [...results];
    newResults[index][field] = value;
    setResults(newResults);
  };

  const addSubject = () => {
    setResults([...results, { subject: '', marks: '', max_marks: '100' }]);
  };

  const removeSubject = (index: number) => {
    const newResults = results.filter((_, i) => i !== index);
    setResults(newResults);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return toast.error("Please select a student first");
    if (!examName) return toast.error("Please enter exam name");

    setLoading(true);
    try {
      const { error } = await supabase.from('results').insert({
        student_id: selectedStudent.id,
        exam_name: examName,
        marks_data: results, // Assuming you have a JSONB column or similar structure
        date: new Date().toISOString()
      });

      if (error) throw error;
      toast.success("Result uploaded successfully!");
      setExamName('');
      setResults([{ subject: '', marks: '', max_marks: '100' }]);
      setSelectedStudent(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200">
            <FileUp size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Upload Results</h1>
            <p className="text-sm font-medium text-gray-400">Manage academic records</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Student Selection */}
          <div className="lg:col-span-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm h-[calc(100vh-200px)] flex flex-col">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Select Student</h2>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search name..." 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                value={search}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {filteredStudents.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedStudent?.id === s.id 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${selectedStudent?.id === s.id ? 'bg-indigo-500' : 'bg-gray-100 text-gray-500'}`}>
                    {s.full_name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">{s.full_name}</p>
                    <p className={`text-xs ${selectedStudent?.id === s.id ? 'text-indigo-200' : 'text-gray-400'}`}>{s.class_name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Marks Entry Form */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-gray-900 uppercase">
                  {selectedStudent ? `Grading: ${selectedStudent.full_name}` : 'Result Details'}
                </h2>
                {selectedStudent && <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{selectedStudent.class_name}</span>}
              </div>

              <div className="space-y-6">
                {/* Exam Name */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2 mb-1 block">Exam Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mid-Term Examination 2024" 
                    className="w-full bg-gray-50 border-none rounded-xl px-5 py-4 font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    required
                  />
                </div>

                {/* Dynamic Subjects */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end mb-2 px-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Subjects & Marks</label>
                    <button type="button" onClick={addSubject} className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline">
                      <Plus size={14}/> ADD SUBJECT
                    </button>
                  </div>
                  
                  {results.map((res, index) => (
                    <div key={index} className="flex gap-3 items-center group animate-fade-in-up">
                      <div className="bg-gray-50 p-3 rounded-xl text-gray-400">
                        <BookOpen size={20} />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Subject (e.g. Math)" 
                        className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-indigo-500"
                        value={res.subject}
                        onChange={(e) => handleSubjectChange(index, 'subject', e.target.value)}
                        required
                      />
                      <input 
                        type="number" 
                        placeholder="Marks" 
                        className="w-24 bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-center focus:ring-2 focus:ring-indigo-500"
                        value={res.marks}
                        onChange={(e) => handleSubjectChange(index, 'marks', e.target.value)}
                        required
                      />
                      <span className="text-gray-300 font-bold">/</span>
                      <input 
                        type="number" 
                        placeholder="Max" 
                        className="w-20 bg-white border border-gray-200 rounded-xl px-2 py-3 text-xs text-center text-gray-400"
                        value={res.max_marks}
                        onChange={(e) => handleSubjectChange(index, 'max_marks', e.target.value)}
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => removeSubject(index)} 
                        className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-indigo-900 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-black transition-all transform hover:-translate-y-1 flex justify-center items-center gap-2"
                  >
                    {loading ? 'Uploading...' : <><Save size={20} /> Publish Result</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadResult;
