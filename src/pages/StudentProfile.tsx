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
  const { id } = useParams(); // URL वाली ID (जैसे 30)
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

      // 1. ✅ FIX: अब हम 'id' की जगह 'student_id' कॉलम में सर्च करेंगे
      const { data: std, error: stdErr } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', Number(id)) // आपने टेबल में नाम बदल दिया है
        .maybeSingle();
      
      if (stdErr) throw stdErr;
      
      if (!std) {
        setStudent(null);
        setLoading(false);
        return;
      }
      setStudent(std);

      // 2. Fees History - String/Number mismatch से बचने के लिए .or इस्तेमाल किया है
      const { data: feeData, error: feeErr } = await supabase
        .from('fees')
        .select('*')
        .or(`student_id.eq.${id},student_id.eq."${id}"`) 
        .order('created_at', { ascending: false });
      
      if (!feeErr) setFees(feeData || []);

      // 3. Results
      const { data: resData } = await supabase
        .from('results')
        .select('*, exams(title)')
        .or(`student_id.eq.${id},student_id.eq."${id}"`);
      
      if (resData) setResults(resData);

      // 4. Attendance
      const { data: att } = await supabase
        .from('attendance')
        .select('status')
        .or(`student_id.eq.${id},student_id.eq."${id}"`);
        
      if (att) {
        setAttendance({
          present: att.filter(a => a.status === 'Present').length,
          total: att.length
        });
      }

    } catch (err: any) {
      console.error("Fetch Error:", err.message);
      toast.error("Profile load failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <RefreshCw className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="font-black uppercase tracking-widest text-gray-400">Loading Student Files...</p>
    </div>
  );

  if (!student) return <div className="p-20 text-center font-black text-rose-500 uppercase">Student with ID:{id} Not Found In Records</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase text-indigo-600 shadow-sm border border-indigo-50">
            <ChevronLeft size={16}/> Back
          </button>
          <button onClick={() => window.print()} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl flex items-center gap-2">
            <Printer size={16}/> Print Report
          </button>
        </div>

        {/* Header Card */}
        <div className="bg-indigo-900 rounded-[3.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-10">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-8">
              <div className="w-32 h-32 rounded-[2.5rem] bg-white/10 border-4 border-white/20 overflow-hidden flex items-center justify-center">
                 {student.photo_url ? (
                   <img src={student.photo_url} className="w-full h-full object-cover" alt="" />
                 ) : (
                   <User size={60} className="text-white/30" />
                 )}
              </div>
              <div className="text-center md:text-left">
                <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase shadow-lg">Verified Student</span>
                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mt-3 leading-none">{student.full_name}</h1>
                <div className="flex gap-3 mt-4">
                   <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 uppercase">Grade: {student.class_name}</div>
                   <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 uppercase italic">Roll: {student.roll_no}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center min-w-[180px]">
              <p className="text-[10px] font-black uppercase text-indigo-200 mb-2 italic">Attendance Rate</p>
              <p className="text-5xl font-black tracking-tighter">
                {attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50 h-fit">
            <h3 className="font-black uppercase text-[11px] text-gray-400 tracking-widest mb-8 flex items-center gap-2 italic">Dossier Information</h3>
            <div className="space-y-6">
              <InfoItem icon={User} label="Father's Name" value={student.father_name} />
              <InfoItem icon={Phone} label="Contact Support" value={student.contact_number} />
              <InfoItem icon={MapPin} label="Residential Address" value={student.address} />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* 💰 Fees Ledger Table */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center gap-2 bg-gray-50/30">
                 <CreditCard size={18} className="text-indigo-600"/>
                 <h3 className="font-black uppercase text-[11px] tracking-widest text-gray-800">Financial History</h3>
              </div>
              <div className="p-4 overflow-x-auto">
                {fees.length > 0 ? (
                   <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-[10px] font-black text-gray-400 uppercase italic">
                        <th className="px-6 py-2">Billing Cycle</th>
                        <th className="px-6 py-2">Amount Paid</th>
                        <th className="px-6 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.map((f: any) => (
                        <tr key={f.id} className="bg-gray-50/50 hover:bg-white transition-all rounded-3xl border border-transparent hover:border-indigo-100 shadow-sm">
                          <td className="px-6 py-5 rounded-l-[1.5rem] font-black text-gray-900 uppercase text-xs italic">{f.month || 'Monthly'}</td>
                          <td className="px-6 py-5 font-black text-indigo-600 text-lg">₹{Number(f.total_amount).toLocaleString()}</td>
                          <td className="px-6 py-5 rounded-r-[1.5rem] text-right">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${f.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600 animate-pulse'}`}>
                              {f.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                   <p className="p-10 text-center text-gray-400 italic font-bold">No matching ledger entries for ID {id}.</p>
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
    <div className="bg-gray-50 p-3 rounded-2xl text-indigo-600 shadow-sm border border-gray-100"><Icon size={18}/></div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{label}</p>
      <p className="font-bold text-gray-900 text-sm">{value || 'N/A'}</p>
    </div>
  </div>
);

export default StudentProfile;
