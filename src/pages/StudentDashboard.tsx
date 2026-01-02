import React, { useState } from 'react';
import { useGetStudentResults } from '../hooks/useQueries';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const [studentId, setStudentId] = useState('');
  const [searchId, setSearchId] = useState<any>(null);

  // Hook tabhi chalega jab searchId set hoga
  const { data: results, isLoading } = useGetStudentResults(searchId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId) {
      setSearchId(studentId);
    } else {
      toast.error("Please enter a Student ID");
    }
  };

  // --- YAHAN SE CHANGES HAIN (Simple Div Wrapper) ---
  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="bg-blue-900 text-white p-6 rounded-t-lg text-center shadow-lg">
          <h1 className="text-2xl font-bold">Adarsh Shishu Mandir</h1>
          <p className="opacity-80">Student Result Portal</p>
        </div>

        {/* Search Box */}
        <div className="bg-white p-6 shadow-md border-b">
          <form onSubmit={handleSearch} className="flex gap-4 items-end justify-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter Student ID
              </label>
              <input 
                type="number" 
                placeholder="e.g. 1, 2, 3"
                className="p-2 border rounded w-40 text-center text-lg"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition h-11"
            >
              View Result
            </button>
          </form>
          <p className="text-xs text-center text-gray-500 mt-2">
            (Hint: Apni ID ke liye School Admin se sampark karein)
          </p>
        </div>

        {/* Results Area */}
        <div className="bg-white p-6 rounded-b-lg shadow-lg min-h-[300px]">
          {isLoading ? (
            <div className="text-center py-10">Loading Results...</div>
          ) : results && results.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
                Exam Performance
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="p-3 border">Exam Name</th>
                      <th className="p-3 border">Subject</th>
                      <th className="p-3 border text-center">Marks</th>
                      <th className="p-3 border text-center">Total</th>
                      <th className="p-3 border text-center">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((res: any) => (
                      <tr key={res.id} className="hover:bg-gray-50">
                        <td className="p-3 border font-medium">{res.exams?.exam_name}</td>
                        <td className="p-3 border">{res.exams?.subject}</td>
                        <td className="p-3 border text-center font-bold text-blue-700">
                          {res.marks_obtained}
                        </td>
                        <td className="p-3 border text-center text-gray-600">
                          {res.exams?.total_marks}
                        </td>
                        <td className="p-3 border text-center text-sm">
                          {res.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : searchId ? (
            <div className="text-center py-10 text-red-500">
              No results found for Student ID: {searchId}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              Enter your ID above to see results.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;