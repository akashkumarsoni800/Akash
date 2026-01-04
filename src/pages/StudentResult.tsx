import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const StudentResult = () => {
  const navigate = useNavigate();
  
  // --- STATE VARIABLES ---
  const [loading, setLoading] = useState(false);
  // Input me ab 3 cheezein lenge
  const [inputs, setInputs] = useState({ name: '', fatherName: '', className: '' });
  const [studentData, setStudentData] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  // --- SEARCH FUNCTION ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validation: Teeno fields bharna zaroori hai
    if (!inputs.name || !inputs.fatherName || !inputs.className) {
      toast.error("Please fill all fields (Name, Father's Name, Class)!");
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      setResults([]);
      setStudentData(null);

      // 2. Student Search Query
      const { data: student, error: studentError } = await supabase
        .from('students')
        // Roll number bhi select kar rahe hain (agar column hoga to dikhega)
        .select('id, full_name, class_name, parent_name, roll_number') 
        .eq('class_name', inputs.className) // Class Match
        .ilike('full_name', inputs.name.trim()) // Name Match (Case Insensitive)
        .ilike('parent_name', inputs.fatherName.trim()) // Father Name Match
        .maybeSingle();

      if (studentError) throw studentError;

      if (!student) {
        toast.error("Student not found! Check spelling carefully.");
        return;
      }

      setStudentData(student);

      // 3. Result Fetch Query
      const { data: resultData, error: resultError } = await supabase
        .from('results')
        .select(`
          *,
          exams (
            exam_name,
            subject,
            total_marks
          )
        `)
        .eq('student_id', student.id);

      if (resultError) throw resultError;

      if (resultData) {
        setResults(resultData);
        toast.success("Result Found! 🎉");
      }

    } catch (error: any) {
      console.error("Error fetching result:", error);
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/student/dashboard')} 
        className="mb-6 flex items-center gap-2 text-blue-600 font-bold hover:underline"
      >
        ← Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">📑 Check Your Result</h1>
          <p className="text-gray-500">Enter your details exactly as per school records</p>
        </div>

        {/* --- SEARCH FORM (3 Inputs) --- */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 mb-8">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            {/* 1. Name Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Student Name</label>
              <input 
                type="text" 
                placeholder="Ex: Rohan Kumar"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                value={inputs.name}
                onChange={(e) => setInputs({...inputs, name: e.target.value})}
              />
            </div>

            {/* 2. Father Name Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Father's Name</label>
              <input 
                type="text" 
                placeholder="Ex: Suresh Kumar"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                value={inputs.fatherName}
                onChange={(e) => setInputs({...inputs, fatherName: e.target.value})}
              />
            </div>

            {/* 3. Class Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Class</label>
              <select 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={inputs.className}
                onChange={(e) => setInputs({...inputs, className: e.target.value})}
              >
                <option value="">Select</option>
                <option value="9th">9th</option>
                <option value="10th">10th</option>
                <option value="11th">11th</option>
                <option value="12th">12th</option>
              </select>
            </div>

            {/* Search Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Searching..." : "🔍 Search"}
            </button>
          </form>
        </div>

        {/* --- RESULT SECTION --- */}
        {searched && !loading && studentData && (
          <div className="animate-fade-in-up">
            
            {/* 🎓 STUDENT INFORMATION CARD */}
            <div className="bg-blue-900 text-white rounded-t-xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
              
              {/* Left: Avatar & Name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white text-blue-900 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-blue-200">
                  {studentData.full_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{studentData.full_name}</h2>
                  <p className="text-blue-200 text-sm">S/o {studentData.parent_name}</p>
                </div>
              </div>

              {/* Right: Academic Info */}
              <div className="flex gap-8 text-center bg-blue-800 p-3 rounded-lg bg-opacity-50">
                <div>
                  <p className="text-xs text-blue-300 uppercase">Class</p>
                  <p className="text-xl font-bold">{studentData.class_name}</p>
                </div>
                <div className="border-l border-blue-600 pl-8">
                  <p className="text-xs text-blue-300 uppercase">Roll No</p>
                  {/* Agar database me roll_number nahi hai to ID dikhayega */}
                  <p className="text-xl font-bold">{studentData.roll_number || studentData.id}</p>
                </div>
              </div>

            </div>

            {/* 📊 MARKS TABLE */}
            <div className="bg-white rounded-b-xl shadow-lg border-x border-b border-gray-200 p-6">
              
              {results.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-gray-400">Student found, but no exam results uploaded yet.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                          <th className="p-4 border-b">Exam</th>
                          <th className="p-4 border-b">Subject</th>
                          <th className="p-4 border-b text-center">Max Marks</th>
                          <th className="p-4 border-b text-center">Obtained</th>
                          <th className="p-4 border-b text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700">
                        {results.map((res: any) => (
                          <tr key={res.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-medium text-xs text-gray-500 uppercase">{res.exams?.exam_name}</td>
                            <td className="p-4 font-bold text-blue-900">{res.exams?.subject}</td>
                            <td className="p-4 text-center text-gray-500">{res.exams?.total_marks || 100}</td>
                            <td className="p-4 text-center font-bold text-xl text-gray-800">
                              {res.marks_obtained}
                            </td>
                            <td className="p-4 text-center font-medium text-sm">
                              {res.remarks || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Grand Total */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg flex justify-between items-center border border-blue-100">
                    <span className="text-blue-900 font-bold uppercase text-sm tracking-wide">Grand Total</span>
                    <div className="text-right">
                       <span className="text-3xl font-extrabold text-blue-900">
                         {results.reduce((sum, r) => sum + Number(r.marks_obtained), 0)}
                       </span>
                       <span className="text-gray-500 text-sm"> / {results.reduce((sum, r) => sum + Number(r.exams?.total_marks || 100), 0)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default StudentResult;
