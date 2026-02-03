import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';

const UploadResult = () => {
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [exams, setExams] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  // Selection States
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  // Marks State
  const [marksData, setMarksData] = useState<Record<string, string>>({});

  // Additional States for UX
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // 1. LOAD DATA (Debug Mode ON)
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch Exams
        const { data: examsData } = await supabase.from('exams').select('*');
        if (examsData) setExams(examsData);

        // Fetch Students
        const { data: studentsData, error } = await supabase
          .from('students')
          .select('*') // Sab kuch mangwa rahe hain
          .order('full_name', { ascending: true });

        if (error) throw error;

        if (studentsData) {
          console.log("Raw Student Data:", studentsData); // Console me check karein
          setAllStudents(studentsData);
          
          // --- CLASS EXTRACT LOGIC (Improved) ---
          // Hum check karenge ki class ka data kahan chupa hai
          const extractedClasses = studentsData
            .map(s => s.class_name || s.Class_Name || s.Class || s.standard) // Alag alag naam try karein
            .filter(c => c !== null && c !== undefined && c !== '') // Sirf bhare hue classes lein
            .map(c => String(c).trim()); // Space hatayein

          // Duplicate hatana
          const uniqueClasses = [...new Set(extractedClasses)];
          
          console.log("Found Classes:", uniqueClasses); // Dekhein kya mila
          
          if (uniqueClasses.length === 0) {
            toast.warning("Students mil gaye, par unki Class nahi mili. Database check karein.");
          }
          
          setClasses(uniqueClasses.sort());
        }

      } catch (error: any) {
        console.error("Error loading data:", error);
        toast.error("Data load nahi hua: " + error.message);
      }
    };
    loadData();
  }, []);

  // 2. Filter Students
  const filteredStudents = selectedClass
    ? allStudents.filter(s => {
        // Match karne ke liye wahi logic lagayein
        const sClass = s.class_name || s.Class_Name || s.Class || s.standard;
        return String(sClass).trim() === selectedClass;
      })
    : [];

  // 3. Find Exam
  const currentExam = exams.find(e => e.id === selectedExamId);

  // 4. Handle Marks
  const handleMarkChange = (subject: string, value: string) => {
    setMarksData(prev => ({ ...prev, [subject]: value }));
  };

  // 5. Calculate Preview
  const calculatePreview = () => {
    if (!currentExam || !selectedStudentId) return null;

    let totalObtained = 0;
    let totalSubjects = 0;
    const subjectMarks: Record<string, number> = {};

    Object.entries(marksData).forEach(([sub, val]) => {
      const mark = Number(val) || 0;
      subjectMarks[sub] = mark;
      totalObtained += mark;
      totalSubjects++;
    });

    const percentage = totalSubjects > 0 ? (totalObtained / (totalSubjects * 100)) * 100 : 0;
    const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F';

    return {
      student: allStudents.find(s => s.id === selectedStudentId),
      exam: currentExam,
      subjectMarks,
      totalObtained,
      percentage: percentage.toFixed(2),
      grade,
    };
  };

  // 6. Handle Preview
  const handlePreview = () => {
    const data = calculatePreview();
    if (!data) {
      toast.error("Please fill all required fields to preview.");
      return;
    }
    setPreviewData(data);
    setShowPreview(true);
  };

  // 7. Save Result
  const handleSaveResult = async () => {
    if (!selectedExamId || !selectedStudentId) {
      toast.error("Please select Exam, Class and Student!");
      return;
    }

    setLoading(true);
    try {
      const data = calculatePreview();
      if (!data) throw new Error("Invalid data for saving.");

      const resultPayload = {
        exam_id: selectedExamId,
        student_id: selectedStudentId,
        marks: data.subjectMarks,
        total_marks: data.totalObtained,
        percentage: data.percentage,
        grade: data.grade, // Added grade
      };

      const { error } = await supabase.from('results').insert([resultPayload]);

      if (error) throw error;
      
      toast.success("Result Uploaded Successfully! 🏆");
      setMarksData({});
      setSelectedStudentId('');
      setShowPreview(false);
      setPreviewData(null);

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to upload result: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">📤 Upload Student Result</h1>
      
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-5xl border border-gray-200">
        
        {/* Filters Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-6 border-b pb-2">Select Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Exam Select */}
            <div>
              <label className="block font-medium mb-2 text-gray-700">📚 Select Exam</label>
              <select 
                className="w-full border border-gray-300 p-3 rounded-lg bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={selectedExamId}
                onChange={(e) => { setSelectedExamId(e.target.value); setMarksData({}); setShowPreview(false); }}
              >
                <option value="">-- Choose Exam --</option>
                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
              </select>
            </div>

            {/* Class Select */}
            <div>
              <label className="block font-medium mb-2 text-gray-700">🏫 Filter by Class</label>
              <select 
                className="w-full border border-gray-300 p-3 rounded-lg bg-green-50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                value={selectedClass}
                onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudentId(''); setShowPreview(false); }}
              >
                <option value="">-- Choose Class --</option>
                {classes.length > 0 ? (
                  classes.map((cls, idx) => <option key={idx} value={cls}>{cls}</option>)
                ) : (
                  <option disabled>No Classes Found</option>
                )}
              </select>
            </div>

            {/* Student Select */}
            <div>
              <label className="block font-medium mb-2 text-gray-700">👨‍🎓 Select Student</label>
              <select 
                className="w-full border border-gray-300 p-3 rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                value={selectedStudentId}
                onChange={(e) => { setSelectedStudentId(e.target.value); setShowPreview(false); }}
                disabled={!selectedClass}
              >
                <option value="">
                  {selectedClass ? "-- Choose Student --" : "Select Class First"}
                </option>
                {filteredStudents.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.full_name} (Roll: {st.roll_no || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Subjects Input Section */}
        {currentExam && selectedStudentId ? (
          <div className="mb-8 border-t pt-6">
            <h3 className="font-bold text-lg text-blue-900 mb-4 bg-gray-100 p-3 rounded-lg">
              📝 Enter Marks for: {currentExam.title}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.isArray(currentExam.subjects) && currentExam.subjects.map((sub: string) => (
                <div key={sub} className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-bold text-gray-600 mb-2">{sub}</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    className="w-full border border-gray-300 p-2 rounded text-center font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={marksData[sub] || ''}
                    onChange={(e) => handleMarkChange(sub, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handlePreview}
                className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-yellow-600 transition"
              >
                👁️ Preview Result
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-400 border-2 border-dashed rounded-lg mb-6 bg-gray-50">
            {!selectedExamId ? "👈 Please Select an Exam" : "👈 Please Select Class & Student"}
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && previewData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">📊 Result Preview</h3>
              <div className="space-y-2">
                <p><strong>Student:</strong> {previewData.student.full_name}</p>
                <p><strong>Exam:</strong> {previewData.exam.title}</p>
                <p><strong>Total Marks:</strong> {previewData.totalObtained}</p>
                <p><strong>Percentage:</strong> {previewData.percentage}%</p>
                <p><strong>Grade:</strong> {previewData.grade}</p>
                <div>
                  <strong>Subject Marks:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {Object.entries(previewData.subjectMarks).map(([sub, mark]) => (
                      <li key={sub}>{sub}: {mark}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex justify-end mt-6 space-x-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveResult}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {loading ? 'Saving...' : 'Confirm & Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {!showPreview && (
          <button
            onClick={handleSaveResult}
            disabled={loading || !currentExam || !selectedStudentId}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </div>
            ) : (
              '💾 Save Result'
            )}
          </button>
        )}

      </div>
    </div>
  );
};

export default UploadResult;
