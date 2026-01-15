import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [fees, setFees] = useState([]);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState({ present: 0, total: 0 });

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      // 1. Basic Info
      const { data: std, error } = await supabase.from('students').select('*').eq('id', id).single();
      if (error) throw error;
      setStudent(std);

      // 2. Fees
      const { data: feeData } = await supabase.from('fees').select('*').eq('student_id', id).order('created_at', { ascending: false });
      setFees(feeData || []);

      // 3. Marks (Assuming 'exams' join)
      const { data: markData } = await supabase.from('marks').select('*, exams(exam_name)').eq('student_id', id);
      setMarks(markData || []);

      // 4. Attendance Summary
      const { data: att } = await supabase.from('attendance').select('status').eq('student_id', id);
      if (att) {
        setAttendance({
          present: att.filter(a => a.status === 'Present').length,
          total: att.length
        });
      }
    } catch (err: any) {
      toast.error("Profile not found");
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black uppercase tracking-tighter text-blue-900">ASM Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12 notranslate">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        
        {/* Navigation & Actions */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="bg-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 border border-gray-100 shadow-sm hover:text-blue-900 transition"
          >
            ← Back to Control
          </button>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-blue-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg">🖨️ Print Report</button>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-blue-900 rounded-[40px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-8">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="bg-blue-500/30 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">Student Profile</span>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mt-4 leading-none">
                {student.full_name}
              </h1>
              <p className="text-blue-200 font-bold mt-2 uppercase tracking-widest text-sm">
                Class: {student.class_name} • Roll No: {student.id.toString().slice(-4)}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[32px] border border-white/20 text-center min-w-[160px]">
              <p className="text-[10px] font-black uppercase opacity-60 mb-1">Attendance</p>
              <p className="text-4xl font-black">
                {attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0}%
              </p>
            </div>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Personal Info & Attendance */}
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
              <h3 className="font-black uppercase text-[10px] text-gray-400 tracking-widest mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-blue-900 uppercase">Guardian Phone</p>
                  <p className="font-bold text-gray-800">{student.contact_number || 'Not Provided'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-900 uppercase">Status</p>
                  <span className="inline-block bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black mt-1">ACTIVE</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
              <h3 className="font-black uppercase text-[10px] text-gray-400 tracking-widest mb-6">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <p className="text-xl font-black text-gray-800">{attendance.present}</p>
                  <p className="text-[8px] font-black uppercase text-gray-400">Days Present</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <p className="text-xl font-black text-gray-800">{fees.length}</p>
                  <p className="text-[8px] font-black uppercase text-gray-400">Fee Records</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Fees & Marks */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Fees Table */}
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black uppercase text-[10px] tracking-widest text-gray-800">Fee Payment History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase">
                      <th className="p-4">Month</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {fees.map((f: any) => (
                      <tr key={f.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 font-bold text-gray-800">{f.month}</td>
                        <td className="p-4 font-black text-blue-900">₹{f.total_amount}</td>
                        <td className="p-4 text-right">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${f.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {fees.length === 0 && <p className="p-8 text-center text-xs font-bold text-gray-400 italic">No fee history available.</p>}
              </div>
            </div>

            {/* Academic Section */}
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black uppercase text-[10px] tracking-widest text-gray-800">Academic Marks</h3>
              </div>
              <div className="p-6">
                 {marks.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {marks.map((m: any) => (
                       <div key={m.id} className="border border-gray-100 p-4 rounded-2xl flex justify-between items-center">
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{m.exams?.exam_name || 'Exam'}</p>
                            <p className="font-black text-gray-800">{m.marks_obtained} Marks</p>
                         </div>
                         <div className="text-right">
                            <p className="text-xs font-black text-blue-900">{((m.marks_obtained / m.total_marks) * 100).toFixed(0)}%</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <p className="text-center text-xs font-bold text-gray-400 italic py-4">No academic data reported yet.</p>
                 )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
