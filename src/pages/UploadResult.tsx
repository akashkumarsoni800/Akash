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

  // 5. Save Result
  const handleSaveResult = async () => {
    if (!selectedExamId || !selectedStudentId) {
      toast.error("Please select Exam, Class and Student!");
      return;
    }

    setLoading(true);
    try {
      let totalObtained = 0;
      let totalSubjects = 0;
      
      Object.values(marksData).forEach(val => {
        totalObtained += Number(val) || 0;
        totalSubjects++;
      });
      
      const percentage = totalSubjects > 0 ? (totalObtained / (totalSubjects * 100)) * 100 : 0;

      const resultPayload = {
        exam_id: selectedExamId,
        student_id: selectedStudentId,
        marks: marksData,
        total_marks: totalObtained,
        percentage: percentage.toFixed(2)
      };

      const { error } = await supabase.from('results').insert([resultPayload]);

      if (error) throw error;
      
      toast.success("Result Uploaded Successfully! 🏆");
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
      
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* Exam Select */}
          <div>
            <label className="block font-bold mb-2 text-gray-700">Select Exam</label>
            <select 
              className="w-full border p-2 rounded bg-blue-50"
              value={selectedExamId}
              onChange={(e) => { setSelectedExamId(e.target.value); setMarksData({}); }}
            >
              <option value="">-- Choose Exam --</option>
              {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
            </select>
          </div>

          {/* Class Select */}
          <div>
            <label className="block font-bold mb-2 text-gray-700">Filter by Class</label>
            <select 
              className="w-full border p-2 rounded bg-green-50"
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudentId(''); }}
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
            <label className="block font-bold mb-2 text-gray-700">Select Student</label>
            <select 
              className="w-full border p-2 rounded disabled:bg-gray-100"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
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

        {/* Subjects Input */}
        {currentExam && selectedStudentId ? (
          <div className="mb-6 border-t pt-6">
            <h3 className="font-bold text-lg text-blue-900 mb-4 bg-gray-100 p-2 rounded">
              Marks for: {currentExam.title}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.isArray(currentExam.subjects) && currentExam.subjects.map((sub: string) => (
                <div key={sub}>
                  <label className="block text-sm font-bold text-gray-600 mb-1">{sub}</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full border p-2 rounded text-center font-bold"
                    value={marksData[sub] || ''}
                    onChange={(e) => handleMarkChange(sub, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-400 border-2 border-dashed rounded mb-4 bg-gray-50">
            {!selectedExamId ? "👈 Please Select an Exam" : "👈 Please Select Class & Student"}
          </div>
        )}

        <button
          onClick={handleSaveResult}
          disabled={loading || !currentExam || !selectedStudentId}
          className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 disabled:bg-gray-400 shadow-lg"
        >
          {loading ? 'Uploading...' : '💾 Save Result'}
        </button>

      </div>
    </div>
  );
};

export default UploadResult;
