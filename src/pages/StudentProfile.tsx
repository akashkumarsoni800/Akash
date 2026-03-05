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
  const { id } = useParams(); // URL से आने वाली ID (जैसे 30)
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

      // 1. Student Info Fetch - ID को Number में बदल कर भेजें
      const { data: std, error: stdErr } = await supabase
        .from('students')
        .select('*')
        .eq('id', parseInt(id || '0')) 
        .single();
      
      if (stdErr) throw stdErr;
      setStudent(std);

      // 2. Fees History Fetch - ID को String में बदल कर भेजें (यही असली समस्या थी)
      // आपकी फोटो के अनुसार 'student_id' और 'total_amount' कॉलम इस्तेमाल किए हैं
      const { data: feeData, error: feeErr } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', String(id)) // <-- Type Mismatch Fix: Number to String
        .order('created_at', { ascending: false });
      
      if (feeErr) {
        console.error("Fee error:", feeErr.message);
      } else {
        setFees(feeData || []);
      }

      // 3. Results Fetch (If table exists)
      const { data: resData } = await supabase
        .from('results')
        .select('*, exams(title)')
        .eq('student_id', String(id)) 
        .order('uploaded_at', { ascending: false });
      
      if (resData) setResults(resData);

      // 4. Attendance
      const { data: att } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', String(id));
        
      if (att) {
        setAttendance({
          present: att.filter(a => a.status === 'Present').length,
          total: att.length
        });
      }

    } catch (err: any) {
      console.error("Critical Fetch Error:", err.message);
      toast.error("Profile load failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
      <RefreshCw className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="font-black uppercase tracking-widest text-gray-400 italic">Syncing Records...</p>
    </div>
  );

  if (!student) return <div className="p-20 text-center font-black text-red-500">No Student Found with ID {id}</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        
        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm border border-indigo-50">
            <ChevronLeft size={16}/> Back
          </button>
          <button onClick={() => window.print()} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
            <Printer size={16}/> Print Report
          </button>
        </div>

        {/* Header Section */}
        <div className="bg-indigo-900 rounded-[3.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-10">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 rounded-[2.5rem] bg-white/10 border-4 border-white/20 overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-md">
                 {student.photo_url ? (
                   <img src={student.photo_url} className="w-full h-full object-cover" alt="Student" />
                 ) : (
                   <User size={60} className="text-white/30" />
                 )}
              </div>
              <div className="text-center md:text-left">
                <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Active Record</span>
                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mt-3">{student.full_name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                   <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 tracking-wider uppercase">Grade: {student.class_name}</div>
                   <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 tracking-wider uppercase italic">Roll No: {student.roll_no}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center min-w-[180px] shadow-inner">
              <p className="text-[10px] font-black uppercase text-indigo-200 mb-2 tracking-widest">Attendance</p>
              <p className="text-5xl font-black tracking-tighter">
                {attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0}%
              </p>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-[80px]"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info Panel */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50 h-fit">
            <h3 className="font-black uppercase text-[11px] text-gray-400 tracking-widest mb-8 flex items-center gap-2">
              <FileText size={16} className="text-indigo-600"/> Personal Dossier
            </h3>
            <div className="space-y-6">
              <InfoItem icon={User} label="Father's Name" value={student.father_name} />
              <InfoItem icon={Phone} label="Contact" value={student.contact_number || 'N/A'} />
              <InfoItem icon={Calendar} label="D.O.B" value={student.date_of_birth || 'N/A'} />
              <InfoItem icon={MapPin} label="Home Address" value={student.address} />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* 💰 Fees Ledger - Fixed as per Image */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-gray-50 overflow-hidden">
              <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-indigo-600"/>
                    <h3 className="font-black uppercase text-[11px] tracking-widest text-gray-800">Financial Record</h3>
                 </div>
                 <span className="bg-white px-4 py-1 rounded-full text-[10px] font-black text-indigo-600 shadow-sm border border-indigo-50">TXNS: {fees.length}</span>
              </div>
              <div className="p-4">
                {fees.length > 0 ? (
                   <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-[10px] font-black text-gray-400 uppercase italic">
                        <th className="px-6 py-2">Billing Month</th>
                        <th className="px-6 py-2">Amount</th>
                        <th className="px-6 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.map((f: any) => (
                        <tr key={f.id} className="bg-gray-50/50 hover:bg-white transition-all rounded-3xl group border border-transparent hover:border-indigo-100 shadow-sm">
                          <td className="px-6 py-5 rounded-l-[1.5rem] font-black text-gray-900 uppercase text-sm">{f.month || 'General'}</td>
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
                   <div className="py-20 text-center flex flex-col items-center opacity-30 italic">
                      <CreditCard size={50} className="mb-4 text-gray-300"/>
                      <p className="font-black text-sm uppercase tracking-widest">No fee data linked to Student ID {id}</p>
                   </div>
                )}
              </div>
            </div>

            {/* Exam Progress */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-gray-50 overflow-hidden">
              <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
                 <Award size={18} className="text-indigo-600"/>
                 <h3 className="font-black uppercase text-[11px] tracking-widest text-gray-800">Academic History</h3>
              </div>
              <div className="p-8">
                 {results.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {results.map((r: any) => (
                       <div key={r.id} className="bg-gray-50 border border-gray-100 p-6 rounded-[2.2rem] hover:border-indigo-200 transition-all">
                         <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{r.exams?.title}</p>
                         <p className={`font-black text-lg ${r.status === 'PASS' ? 'text-emerald-600' : 'text-rose-600'}`}>{r.status}</p>
                         <div className="mt-4 pt-4 border-t border-white flex justify-between">
                            <span className="text-[10px] font-bold text-gray-400">SCORE: {r.percentage?.toFixed(1)}%</span>
                            <span className="font-black text-indigo-900">{r.total_marks} Marks</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <p className="text-center py-6 text-gray-400 italic font-bold text-xs uppercase tracking-widest">No reports available.</p>
                 )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-start gap-4">
    <div className="bg-gray-50 p-3 rounded-2xl text-indigo-600 shadow-sm"><Icon size={18}/></div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-wider">{label}</p>
      <p className="font-bold text-gray-900 text-sm">{value || 'Not Provided'}</p>
    </div>
  </div>
);

export default StudentProfile;
