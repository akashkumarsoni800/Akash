import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  User, Phone, MapPin, Calendar, Award, 
  CreditCard, BookOpen, ChevronLeft, Printer, RefreshCw 
} from 'lucide-react';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [fees, setFees] = useState([]);
  const [results, setResults] = useState([]); // Corrected from marks
  const [attendance, setAttendance] = useState({ present: 0, total: 0 });

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      // 1. Basic Info - Fetching registration_no and photo_url too
      const { data: std, error } = await supabase.from('students').select('*').eq('id', id).single();
      if (error) throw error;
      setStudent(std);

      // 2. Fees History
      const { data: feeData } = await supabase.from('fees').select('*').eq('student_id', id).order('created_at', { ascending: false });
      setFees(feeData || []);

      // 3. Results (Previously you were calling 'marks' table)
      const { data: resData } = await supabase
        .from('results')
        .select('*, exams(title)')
        .eq('student_id', id)
        .order('uploaded_at', { ascending: false });
      setResults(resData || []);

      // 4. Attendance
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

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <RefreshCw className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="font-black uppercase tracking-widest text-gray-400">Loading Student File...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm border border-indigo-50">
            <ChevronLeft size={16}/> Back to Dashboard
          </button>
          <button onClick={() => window.print()} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
            <Printer size={16}/> Print Report
          </button>
        </div>

        {/* --- MAIN PROFILE HEADER --- */}
        <div className="bg-indigo-900 rounded-[3.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-10">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              {/* Profile Photo */}
              <div className="w-32 h-32 rounded-[2.5rem] bg-white/10 border-4 border-white/20 overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-md">
                 {student.photo_url ? (
                   <img src={student.photo_url} className="w-full h-full object-cover" alt="Student" />
                 ) : (
                   <User size={60} className="text-white/30" />
                 )}
              </div>
              <div>
                <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Verified Student</span>
                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mt-3">{student.full_name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                   <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 tracking-wider uppercase">Class: {student.class_name}</div>
                   <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 tracking-wider uppercase italic">Roll: {student.roll_no}</div>
                   <div className="bg-indigo-500/40 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 tracking-wider uppercase italic">Reg: {student.registration_no || 'N/A'}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center min-w-[180px] shadow-inner">
              <p className="text-[10px] font-black uppercase text-indigo-200 mb-2 tracking-widest italic">Attendance Rate</p>
              <p className="text-5xl font-black tracking-tighter">
                {attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0}%
              </p>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-[80px]"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN: PERSONAL DATA --- */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-50">
              <h3 className="font-black uppercase text-[11px] text-gray-400 tracking-widest mb-8 flex items-center gap-2">
                <FileText size={16} className="text-indigo-600"/> Student Dossier
              </h3>
              <div className="space-y-6">
                <InfoItem icon={User} label="Father's Name" value={student.father_name} />
                <InfoItem icon={Phone} label="Contact Support" value={student.contact_number || 'N/A'} />
                <InfoItem icon={Calendar} label="Date of Birth" value={student.date_of_birth || 'N/A'} />
                <InfoItem icon={MapPin} label="Residential Address" value={student.address} />
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-50">
              <h3 className="font-black uppercase text-[11px] text-gray-400 tracking-widest mb-6">Engagement Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-6 rounded-3xl text-center border border-indigo-100">
                  <p className="text-2xl font-black text-indigo-900">{attendance.present}</p>
                  <p className="text-[9px] font-black uppercase text-indigo-400 mt-1 italic tracking-tighter">Days In</p>
                </div>
                <div className="bg-rose-50 p-6 rounded-3xl text-center border border-rose-100">
                  <p className="text-2xl font-black text-rose-600">{attendance.total - attendance.present}</p>
                  <p className="text-[9px] font-black uppercase text-rose-400 mt-1 italic tracking-tighter">Absents</p>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: FEES & ACADEMICS --- */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Academic Results Section */}
            <div className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-50 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <h3 className="font-black uppercase text-[11px] tracking-widest text-gray-800 flex items-center gap-2">
                   <Award size={18} className="text-indigo-600"/> Academic Performance
                </h3>
              </div>
              <div className="p-8">
                 {results.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {results.map((r: any) => (
                       <div key={r.id} className="bg-[#fcfdfe] border border-gray-100 p-6 rounded-[2rem] hover:border-indigo-200 transition-all group">
                         <div className="flex justify-between items-start mb-4">
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{r.exams?.title || 'Examination'}</p>
                              <p className="font-black text-gray-900 text-lg uppercase tracking-tighter">{r.status || 'REPORTED'}</p>
                           </div>
                           <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg shadow-indigo-100">{r.percentage?.toFixed(1)}%</div>
                         </div>
                         <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <span className="text-[10px] font-bold text-gray-400 uppercase italic">Grand Total</span>
                            <span className="font-black text-indigo-900 text-xl">{r.total_marks} Marks</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-10 opacity-30 italic font-black uppercase tracking-widest">No Exam Records Found</div>
                 )}
              </div>
            </div>

            {/* Fees History Section */}
            <div className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-50 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black uppercase text-[11px] tracking-widest text-gray-800 flex items-center gap-2">
                   <CreditCard size={18} className="text-indigo-600"/> Finance Record
                </h3>
              </div>
              <div className="overflow-x-auto p-4">
                <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase italic">
                      <th className="px-6 py-2">Billing Month</th>
                      <th className="px-6 py-2">Amount Paid</th>
                      <th className="px-6 py-2 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((f: any) => (
                      <tr key={f.id} className="bg-gray-50/50 group hover:bg-indigo-50/30 transition-all rounded-3xl">
                        <td className="px-6 py-5 rounded-l-[1.5rem] font-black text-gray-900 uppercase text-sm">{f.month}</td>
                        <td className="px-6 py-5 font-black text-indigo-600">₹{f.total_amount}</td>
                        <td className="px-6 py-5 rounded-r-[1.5rem] text-right">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${f.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {fees.length === 0 && <p className="p-10 text-center text-xs font-black text-gray-300 uppercase italic tracking-[0.2em]">Transaction history empty.</p>}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const InfoItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-start gap-4">
    <div className="bg-gray-50 p-3 rounded-2xl text-indigo-600"><Icon size={18}/></div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">{label}</p>
      <p className="font-bold text-gray-900 text-sm">{value || 'N/A'}</p>
    </div>
  </div>
);

export default StudentProfile;
