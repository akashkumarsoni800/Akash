import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useGetAllApprovedStudents, 
  useGetAllExams, 
  useAddResult 
} from '../hooks/useQueries'; // Path '../' hi rahega
import { toast } from 'sonner';

const UploadResult = () => {
  const navigate = useNavigate();
  const { data: students } = useGetAllApprovedStudents();
  const { data: exams } = useGetAllExams();
  const { mutate: addResult, isPending } = useAddResult();

  const [formData, setFormData] = useState({
    examId: '',
    studentId: '',
    marks: '',
    remarks: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.examId || !formData.studentId || !formData.marks) {
      toast.error("Please select Exam, Student and enter Marks");
      return;
    }

    addResult({
      examId: parseInt(formData.examId),
      studentId: parseInt(formData.studentId),
      marks: parseInt(formData.marks),
      remarks: formData.remarks
    }, {
      onSuccess: () => {
        setFormData({ ...formData, studentId: '', marks: '', remarks: '' });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl p-8 border-t-4 border-indigo-600">
        <h2 className="text-2xl font-bold mb-6 text-indigo-900">Upload Student Marks</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
            <select className="w-full p-2 border rounded bg-white" value={formData.examId} onChange={(e) => setFormData({...formData, examId: e.target.value})}>
              <option value="">-- Choose Exam --</option>
              {exams?.map((exam: any) => (
                <option key={exam.id} value={exam.id}>{exam.exam_name} ({exam.subject})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
            <select className="w-full p-2 border rounded bg-white" value={formData.studentId} onChange={(e) => setFormData({...formData, studentId: e.target.value})}>
              <option value="">-- Choose Student --</option>
              {students?.map((stu: any) => (
                <option key={stu.id} value={stu.id}>{stu.full_name} (Class: {stu.class_name})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks Obtained</label>
              <input type="number" className="w-full p-2 border rounded" placeholder="e.g. 85" value={formData.marks} onChange={(e) => setFormData({...formData, marks: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <input type="text" className="w-full p-2 border rounded" placeholder="Good" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} />
            </div>
          </div>
          <button type="submit" disabled={isPending} className="w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700 transition">
            {isPending ? 'Saving...' : 'Save Result'}
          </button>
          <button type="button" onClick={() => navigate('/admin/dashboard')} className="w-full text-gray-500 text-sm hover:underline mt-2">
            Back to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadResult;