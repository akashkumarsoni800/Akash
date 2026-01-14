import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [fees, setFees] = useState([]);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState({ present: 0, total: 0 });

  useEffect(() => {
    fetchStudentFullDetails();
  }, [id]);

  const fetchStudentFullDetails = async () => {
    // 1. Fetch Basic Info
    const { data: std } = await supabase.from('students').select('*').eq('id', id).single();
    setStudent(std);

    // 2. Fetch Fees
    const { data: feeData } = await supabase.from('fees').select('*').eq('student_id', id).order('month', { ascending: false });
    setFees(feeData || []);

    // 3. Fetch Marks (Exams)
    const { data: markData } = await supabase.from('marks').select('*, exams(exam_name)').eq('student_id', id);
    setMarks(markData || []);

    // 4. Fetch Attendance Summary
    const { data: att } = await supabase.from('attendance').select('status').eq('student_id', id);
    if (att) {
      setAttendance({
        present: att.filter(a => a.status === 'Present').length,
        total: att.length
      });
    }
  };

  if (!student) return <div className="p-20 text-center font-black">LOADING PROFILE...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 notranslate">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="mb-6 font-black text-xs uppercase text-blue-900 flex items-center gap-2">
          ← Back to Dashboard
        </button>

        {/* Header Card */}
        <div className="bg-blue-900 rounded-[32px] p-8 text-white mb-8 flex flex-col md:flex-row justify-between items-center shadow-2xl">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">{student.full_name}</h1>
            <p className="font-bold opacity-70">Class: {student.class_name} | ID: {student.id}</p>
          </div>
          <div className="mt-4 md:mt-0 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
            <p className="text-[10px] font-black uppercase">Attendance Rate</p>
            <p className="text-3xl font-black">
              {attendance.total > 0 ? ((attendance.present / attendance.total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Fee Section */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-black uppercase text-sm mb-4 flex items-center gap-2">💰 Fee History</h3>
            <div className="space-y-3">
              {fees.map((f: any) => (
                <div key={f.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="font-bold text-xs">{f.month}</span>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full ${f.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {f.status} - ₹{f.total_amount}
                  </span>
                </div>
              ))}
              {fees.length === 0 && <p className="text-gray-400 italic text-xs">No fee records found.</p>}
            </div>
          </div>

          {/* Exam/Marks Section */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-black uppercase text-sm mb-4 flex items-center gap-2">📊 Academic Performance</h3>
            <div className="space-y-3">
              {marks.map((m: any) => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="font-bold text-xs">{m.exams?.exam_name || 'Exam'}</span>
                  <span className="font-black text-blue-600">{m.marks_obtained} / {m.total_marks}</span>
                </div>
              ))}
              {marks.length === 0 && <p className="text-gray-400 italic text-xs">No exam records found.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
