import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';

const UploadResult = () => {
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // Selection States
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  // Dynamic Marks State
  const [marksData, setMarksData] = useState<Record<string, string>>({});

  // 1. Load Data (Exams & Students)
  useEffect(() => {
    const loadData = async () => {
      const { data: examsData } = await supabase.from('exams').select('*');
      const { data: studentsData } = await supabase.from('students').select('*');
      
      if (examsData) setExams(examsData);
      if (studentsData) setStudents(studentsData);
    };
    loadData();
  }, []);

  // 2. Find Selected Exam (Subject list nikalne ke liye)
  const currentExam = exams.find(e => e.id === selectedExamId);

  // 3. Handle Mark Input Change
  const handleMarkChange = (subject: string, value: string) => {
    setMarksData(prev => ({ ...prev, [subject]: value }));
  };

  // 4. Save Result
  const handleSaveResult = async () => {
    if (!selectedExamId || !selectedStudentId) {
      toast.error("Select Student and Exam first!");
      return;
    }

    setLoading(true);
    try {
      // Calculate Total & Percentage
      let totalObtained = 0;
      let totalSubjects = 0;
      
      // Marks ko number me convert karke total nikalo
      Object.values(marksData).forEach(val => {
        totalObtained += Number(val) || 0;
        totalSubjects++;
      });
      
      // Assuming 100 marks per subject
      const percentage = totalSubjects > 0 ? (totalObtained / (totalSubjects * 100)) * 100 : 0;

      const resultPayload = {
        exam_id: selectedExamId,
        student_id: selectedStudentId,
        marks: marksData, // JSON save hoga { "Math": "90", "Eng": "80" }
        total_marks: totalObtained,
        percentage: percentage.toFixed(2)
      };

      const { error } = await supabase.from('results').insert([resultPayload]);

      if (error) throw error;
      
      toast.success("Result Uploaded Successfully! 🏆");
      // Reset logic (Optional)
      setMarksData({});
      setSelectedStudentId('');

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to upload result.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">📤 Upload Student Result</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-3xl">
        
        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block font-bold mb-2">Select Exam</label>
            <select 
              className="w-full border p-2 rounded"
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setMarksData({}); // Naya exam select karne par marks reset
              }}
            >
              <option value="">-- Choose Exam --</option>
              {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-bold mb-2">Select Student</label>
            <select 
              className="w-full border p-2 rounded"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">-- Choose Student --</option>
              {students.map(st => <option key={st.id} value={st.id}>{st.full_name} ({st.class_name})</option>)}
            </select>
          </div>
        </div>

        {/* DYNAMIC SUBJECT INPUTS */}
        {currentExam ? (
          <div className="mb-6 border-t pt-4">
            <h3 className="font-bold text-lg text-blue-900 mb-4">Enter Marks for: {currentExam.title}</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Exam ke andar jo subjects save the, unka loop */}
              {Array.isArray(currentExam.subjects) && currentExam.subjects.map((sub: string) => (
                <div key={sub}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{sub}</label>
                  <input
                    type="number"
                    placeholder="Marks"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                    value={marksData[sub] || ''}
                    onChange={(e) => handleMarkChange(sub, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-6 text-gray-400 border-2 border-dashed rounded mb-4">
            Please select an Exam to see subjects.
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSaveResult}
          disabled={loading || !currentExam}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Uploading...' : 'Save Result'}
        </button>

      </div>
    </div>
  );
};

export default UploadResult;
