import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const CreateExam = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  
  // Subjects Management
  const [currentSubject, setCurrentSubject] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);

  // Subject Add karne ka function
  const handleAddSubject = () => {
    if (!currentSubject.trim()) return;
    if (subjects.includes(currentSubject)) {
      toast.error("Ye subject pehle se add hai!");
      return;
    }
    setSubjects([...subjects, currentSubject]);
    setCurrentSubject(''); // Input clear karo
  };

  // Subject Delete karne ka function
  const removeSubject = (sub: string) => {
    setSubjects(subjects.filter(s => s !== sub));
  };

  // Final Save Function
  const handleCreateExam = async () => {
    if (!examTitle || subjects.length === 0) {
      toast.error("Please enter Exam Name and at least one Subject.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('exams')
        .insert([
          {
            title: examTitle,
            exam_date: examDate,
            subjects: subjects // Array as JSONB save hoga
          }
        ]);

      if (error) throw error;

      toast.success("Exam Created Successfully! 🎉");
      navigate('/admin/dashboard');

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to create exam.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">📝 Create New Exam</h2>

        {/* Exam Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">Exam Name</label>
            <input 
              type="text" 
              placeholder="e.g. Half Yearly 2026"
              className="w-full border p-2 rounded mt-1"
              value={examTitle}
              onChange={e => setExamTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Date</label>
            <input 
              type="date" 
              className="w-full border p-2 rounded mt-1"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
            />
          </div>
        </div>

        <hr className="my-4"/>

        {/* Subject Adder Section */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Add Subjects</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter Subject (e.g. Math)"
              className="flex-1 border p-2 rounded"
              value={currentSubject}
              onChange={e => setCurrentSubject(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddSubject()}
            />
            <button 
              onClick={handleAddSubject}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold"
            >
              + Add
            </button>
          </div>

          {/* Added Subjects List */}
          <div className="mt-4 flex flex-wrap gap-2">
            {subjects.map((sub, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                {sub}
                <button onClick={() => removeSubject(sub)} className="text-red-500 hover:text-red-700 font-bold">×</button>
              </span>
            ))}
          </div>
          {subjects.length === 0 && <p className="text-sm text-gray-400 mt-2">No subjects added yet.</p>}
        </div>

        {/* Submit Button */}
        <button 
          onClick={handleCreateExam}
          disabled={loading}
          className="w-full mt-8 bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Exam Structure'}
        </button>
      </div>
    </div>
  );
};

export default CreateExam;
