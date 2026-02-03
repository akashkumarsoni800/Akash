import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { FileUp, Search, UserCircle } from 'lucide-react';

const UploadResult = () => {
  const [loading, setLoading] = useState(false);
  const [students, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [examName, setExamName] = useState('');
  const [results, setResults] = useState([{ subject: '', marks: '', max_marks: '100' }]);

  useEffect(() => {
    const getStudents = async () => {
      const { data } = await supabase.from('students').select('*').eq('is_approved', 'approved');
      setAllStudents(data || []);
      setFilteredStudents(data || []);
    };
    getStudents();
  }, []);

  const handleSearch = (term) => {
    setSearch(term);
    const filtered = students.filter(s => s.full_name.toLowerCase().includes(term.toLowerCase()));
    setFilteredStudents(filtered);
  };

  const addSubjectField = () => setResults([...results, { subject: '', marks: '', max_marks: '100' }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!selectedStudent) return toast.error("Select a student first!");
    
    setLoading(true);
    const { error } = await supabase.from('results').insert({
      student_id: selectedStudent.id,
      exam_name: examName,
      marks_data: results,
      uploaded_at: new Date()
    });

    setLoading(false);
    if (!error) {
      toast.success("Result Published!");
      setResults([{ subject: '', marks: '', max_marks: '100' }]);
      setSelectedStudent(null);
    } else {
        toast.error(error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
          <FileUp size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Academic Results</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Publish New Performance Report</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Student Selector */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH STUDENT..." 
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 text-xs font-black uppercase focus:ring-2 focus:ring-indigo-600 transition"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
            {filteredStudents.map(s => (
              <button 
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition ${selectedStudent?.id === s.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-800 hover:bg-gray-100'}`}
              >
                <UserCircle size={20} />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase leading-none">{s.full_name}</p>
                  <p className={`text-[8px] font-bold ${selectedStudent?.id === s.id ? 'text-white/60' : 'text-gray-400'}`}>CLASS: {s.class_name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Marks Entry */}
        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Exam Title</label>
            <input 
              required
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 mt-1 font-bold"
              placeholder="e.g. Final Examination 2026"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Subject-wise Marks</p>
            {results.map((res, idx) => (
              <div key={idx} className="flex gap-2 animate-in fade-in">
                <input 
                  placeholder="Sub"
                  className="w-1/2 bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold"
                  onChange={(e) => {
                    const newRes = [...results];
                    newRes[idx].subject = e.target.value;
                    setResults(newRes);
                  }}
                />
                <input 
                  placeholder="Marks"
                  className="w-1/4 bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold"
                  onChange={(e) => {
                    const newRes = [...results];
                    newRes[idx].marks = e.target.value;
                    setResults(newRes);
                  }}
                />
                <input 
                  placeholder="Max"
                  className="w-1/4 bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold"
                  value={res.max_marks}
                  onChange={(e) => {
                    const newRes = [...results];
                    newRes[idx].max_marks = e.target.value;
                    setResults(newRes);
                  }}
                />
              </div>
            ))}
            <button 
              type="button" 
              onClick={addSubjectField}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black text-gray-400 uppercase hover:bg-gray-50 transition"
            >
              + Add Another Subject
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-3xl uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] transition"
          >
            {loading ? 'PUBLISHING...' : 'CONFIRM & UPLOAD'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadResult;
