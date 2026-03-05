import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  User, Phone, MapPin, Calendar, Award, 
  CreditCard, BookOpen, ChevronLeft, Printer, RefreshCw,
  FileText 
} from 'lucide-react';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState({ present: 0, total: 0 });

  useEffect(() => {
    if (id) fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // 1. Basic Info Fetching
      const { data: std, error: stdErr } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
      
      if (stdErr) throw stdErr;
      setStudent(std);

      // 2. Fees History Fetching - (यहाँ पक्का करें कि student_id सही है)
      const { data: feeData, error: feeErr } = await supabase
        .from('fees')
        .select('id, month, total_amount, status, created_at')
        .eq('student_id', id) // यह ID URL से आ रही है
        .order('created_at', { ascending: false });
      
      if (feeErr) {
        console.error("Fee Fetch Error:", feeErr);
      } else {
        setFees(feeData || []);
      }

      // 3. Results Fetching
      const { data: resData, error: resErr } = await supabase
        .from('results')
        .select('*, exams(title)')
        .eq('student_id', id)
        .order('uploaded_at', { ascending: false });
      
      if (!resErr) setResults(resData || []);

      // 4. Attendance Fetching
      const { data: att } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', id);
        
      if (att) {
        setAttendance({
          present: att.filter(a => a.status === 'Present').length,
          total: att.length
        });
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error("Could not load student data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <RefreshCw className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="font-black uppercase tracking-widest text-gray-400 italic">Syncing Profile Data...</p>
    </div>
  );

  if (!student) return <div className="p-20 text-center font-bold text-red-500">Student not found.</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        
        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm border border-indigo-50">
            <ChevronLeft size={16}/> Back to List
          </button>
          <button onClick={() => window.print()} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-black transition-all">
            <Printer size={16}/> Print Report
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-indigo-900 rounded-[3.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-10">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="w-32 h-32 rounded-[2.5rem] bg-white/10 border-4 border-white/20 overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-md">
                 {student.photo_url ? (
                   <img src={student.photo_url} className="w-full h-full object-cover" alt="Student" />
                 ) : (
                   <User size={60} className="text-white/30" />
                 )}
              </div>
              <div>
                <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Verified Account</span>
                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mt-3">{student.full_name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                   <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 tracking-wider uppercase">Class: {student.class_name}</div>
                   <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 tracking-wider uppercase italic">Roll No: {student.roll_no}</div>
                   <div className="bg-indigo-500/40 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 tracking-wider uppercase italic">Reg: {student.registration_no || 'N/A'}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center min-w-[180px] shadow-inner">
              <p className="text-[10px] font-black uppercase text-indigo-200 mb-2 tracking-widest italic">Current Attendance</p>
              <p className="text-5xl font-black tracking-tighter">
                {attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info Card */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50 h-fit">
            <h3 className="font-black uppercase text-[11px] text-gray-400 tracking-widest mb-8 flex items-center gap-2">
              <FileText size={16} className="text-indigo-600"/> Student Dossier
            </h3>
            <div className="space-y-6">
              <InfoRow icon={User} label="Father's Name" value={student.father_name} />
              <InfoRow icon={Phone} label="Contact Support" value={student.contact_number || 'Not Provided'} />
              <InfoRow icon={Calendar} label="Date of Birth" value={student.date_of_birth || 'N/A'} />
              <InfoRow icon={MapPin} label="Address" value={student.address} />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* 📈 Academic Table */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-gray-50 overflow-hidden">
              <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
                 <Award size={18} className="text-indigo-600"/>
                 <h3 className="font-black uppercase text-[11px] tracking-widest text-gray-800">Academic Progress</h3>
              </div>
              <div className="p-8">
                 {results.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {results.map((r: any) => (
                       <div key={r.id} className="bg-gray-50 border border-gray-100 p-6 rounded-[2rem] hover:border-indigo-200 transition-all">
                         <p className="text-[9px] font-black text-gray-400 uppercase">{r.exams?.title}</p>
                         <p className={`font-black text-lg ${r.status === 'PASS' ? 'text-emerald-600' : 'text-rose-600'}`}>{r.status}</p>
                         <div className="mt-4 flex justify-between items-center border-t pt-4 border-white">
                            <span className="text-[10px] font-bold text-gray-400">SCORE: {r.percentage?.toFixed(1)}%</span>
                            <span className="font-black text-indigo-900">₹{r.total_marks}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <p className="text-center text-gray-400 italic">No academic records found.</p>
                 )}
              </div>
            </div>

            {/* 💰 Fees Table - Logic Fixed Here */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-gray-50 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-indigo-600"/>
                    <h3 className="font-black uppercase text-[11px] tracking-widest text-gray-800">Finance Record</h3>
                 </div>
                 <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase">
                    Total: {fees.length}
                 </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-2 p-4">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase italic">
                      <th className="px-6 py-2">Billing Month</th>
                      <th className="px-6 py-2">Amount Paid</th>
                      <th className="px-6 py-2 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.length > 0 ? (
                      fees.map((f: any) => (
                        <tr key={f.id} className="bg-gray-50/50 hover:bg-white transition-all rounded-3xl group border border-transparent hover:border-indigo-100">
                          <td className="px-6 py-5 rounded-l-[1.5rem] font-black text-gray-900 uppercase text-sm">{f.month}</td>
                          <td className="px-6 py-5 font-black text-indigo-600">₹{Number(f.total_amount).toLocaleString()}</td>
                          <td className="px-6 py-5 rounded-r-[1.5rem] text-right">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${f.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              {f.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-10">
                          <div className="flex flex-col items-center opacity-30">
                            <CreditCard size={40} className="mb-2" />
                            <p className="font-black text-xs uppercase tracking-widest">No assigned fees found for this student.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-start gap-4">
    <div className="bg-gray-50 p-3 rounded-2xl text-indigo-600"><Icon size={18}/></div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{label}</p>
      <p className="font-bold text-gray-900 text-sm">{value || 'N/A'}</p>
    </div>
  </div>
);

export default StudentProfile;
