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
  const { id } = useParams(); // URL se aane wali ID (e.g. 30)
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
      console.log("Searching for ID:", id);

      // 1. Basic Info Fetching - Pehle student dhoondo
      // Isme hum check kar rahe hain ki URL wali ID, database ki 'id' ya 'roll_no' se match kare
      const { data: std, error: stdErr } = await supabase
        .from('students')
        .select('*')
        .or(`id.eq.${id},roll_no.eq.${id}`)
        .maybeSingle();
      
      if (stdErr) throw stdErr;
      
      if (!std) {
        console.error("Student not found in DB");
        setStudent(null);
        setLoading(false);
        return;
      }

      setStudent(std);
      const dbId = std.id; // Database ki asli internal ID

      // 2. Fees History - Use dbId instead of URL id
      const { data: feeData, error: feeErr } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', dbId)
        .order('created_at', { ascending: false });
      
      if (!feeErr) setFees(feeData || []);

      // 3. Results
      const { data: resData, error: resErr } = await supabase
        .from('results')
        .select('*, exams(title)')
        .eq('student_id', dbId)
        .order('uploaded_at', { ascending: false });
      
      if (!resErr) setResults(resData || []);

      // 4. Attendance
      const { data: att } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', dbId);
        
      if (att) {
        setAttendance({
          present: att.filter(a => a.status === 'Present').length,
          total: att.length
        });
      }
    } catch (err: any) {
      console.error("Fetch error details:", err);
      toast.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <RefreshCw className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="font-black uppercase tracking-widest text-gray-400 italic">ASM Profile Syncing...</p>
    </div>
  );

  if (!student) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-10">
       <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center border border-red-50">
          <div className="text-6xl mb-6">🔍</div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Student Not Found</h2>
          <p className="text-gray-400 font-bold mt-2 uppercase text-xs tracking-widest">The ID "{id}" does not exist in records.</p>
          <button onClick={() => navigate(-1)} className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Go Back</button>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        
        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm border border-indigo-50">
            <ChevronLeft size={16}/> Back to Control
          </button>
          <button onClick={() => window.print()} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
            <Printer size={16}/> Download Report
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
                <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Verified Student</span>
                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mt-3">{student.full_name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                   <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 tracking-wider uppercase">Class: {student.class_name}</div>
                   <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 tracking-wider uppercase italic">Roll No: {student.roll_no}</div>
                   <div className="bg-indigo-500/40 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 tracking-wider uppercase italic">Reg: {student.registration_no || 'N/A'}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center min-w-[180px] shadow-inner">
              <p className="text-[10px] font-black uppercase text-indigo-200 mb-2 tracking-widest italic">Attendance</p>
              <p className="text-5xl font-black tracking-tighter">
                {attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50 h-fit">
            <h3 className="font-black uppercase text-[11px] text-gray-400 tracking-widest mb-8 flex items-center gap-2">
              <FileText size={16} className="text-indigo-600"/> Personal Info
            </h3>
            <div className="space-y-6">
              <InfoRow icon={User} label="Father's Name" value={student.father_name} />
              <InfoRow icon={Phone} label="Contact Number" value={student.contact_number || 'N/A'} />
              <InfoRow icon={Calendar} label="Date of Birth" value={student.date_of_birth || 'N/A'} />
              <InfoRow icon={MapPin} label="Home Address" value={student.address} />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* Fees Table */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-gray-50 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center gap-2">
                 <CreditCard size={18} className="text-indigo-600"/>
                 <h3 className="font-black uppercase text-[11px] tracking-widest text-gray-800">Fees History</h3>
              </div>
              <div className="overflow-x-auto p-4">
                {fees.length > 0 ? (
                   <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-[10px] font-black text-gray-400 uppercase italic">
                        <th className="px-6 py-2">Billing Month</th>
                        <th className="px-6 py-2">Amount Paid</th>
                        <th className="px-6 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.map((f: any) => (
                        <tr key={f.id} className="bg-gray-50/50 hover:bg-white transition-all rounded-3xl group border border-transparent hover:border-indigo-100">
                          <td className="px-6 py-5 rounded-l-[1.5rem] font-black text-gray-900 uppercase text-sm">{f.month}</td>
                          <td className="px-6 py-5 font-black text-indigo-600">₹{Number(f.total_amount).toLocaleString()}</td>
                          <td className="px-6 py-5 rounded-r-[1.5rem] text-right">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${f.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              {f.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                   <div className="p-10 text-center flex flex-col items-center opacity-30 italic">
                      <CreditCard size={40} className="mb-2"/>
                      <p className="font-black text-xs uppercase tracking-widest">No fee transactions found.</p>
                   </div>
                )}
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-gray-50 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center gap-2 bg-gray-50/30">
                 <Award size={18} className="text-indigo-600"/>
                 <h3 className="font-black uppercase text-[11px] tracking-widest text-gray-800">Academic Records</h3>
              </div>
              <div className="p-8">
                 {results.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {results.map((r: any) => (
                       <div key={r.id} className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm hover:border-indigo-200 transition-all">
                         <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{r.exams?.title}</p>
                         <p className={`font-black text-lg ${r.status === 'PASS' ? 'text-emerald-600' : 'text-rose-600'}`}>{r.status}</p>
                         <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-50">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Score: {r.percentage?.toFixed(1)}%</span>
                            <span className="font-black text-indigo-900">₹{r.total_marks} Marks</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <p className="text-center py-6 text-gray-400 italic">No exams recorded yet.</p>
                 )}
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
    <div className="bg-gray-50 p-3 rounded-2xl text-indigo-600 shadow-sm border border-gray-100"><Icon size={18}/></div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-wider">{label}</p>
      <p className="font-bold text-gray-900 text-sm">{value || 'N/A'}</p>
    </div>
  </div>
);

export default StudentProfile;
