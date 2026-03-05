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

      // 1. सबसे पहले Student की पूरी जानकारी निकालो
      const { data: std, error: stdErr } = await supabase
        .from('students')
        .select('*')
        .eq('id', id) 
        .single();
      
      if (stdErr) throw stdErr;
      if (!std) return setLoading(false);
      setStudent(std);

      // ✅ ट्रिक: हम student_id को 3 तरीके से चेक करेंगे ताकि डेटा हर हाल में आए
      const { data: feeData, error: feeErr } = await supabase
        .from('fees')
        .select('*')
        .or(`student_id.eq.${id},student_id.eq."${id}"`) // Number और String दोनों चेक करेगा
        .order('created_at', { ascending: false });
      
      if (!feeErr) {
        setFees(feeData || []);
        console.log("Fees Found:", feeData);
      }

      // 3. Results Fetching
      const { data: resData } = await supabase
        .from('results')
        .select('*, exams(title)')
        .or(`student_id.eq.${id},student_id.eq."${id}"`);
      
      if (resData) setResults(resData);

      // 4. Attendance Summary
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
      console.error("Database Error:", err.message);
      toast.error("Sync Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <RefreshCw className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="font-black uppercase tracking-widest text-gray-400 italic">Connecting ASM DB...</p>
    </div>
  );

  if (!student) return <div className="p-20 text-center font-black text-red-500">No Record Found for ID: {id}</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans italic-labels">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate(-1)} className="bg-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm border border-indigo-50">
            ← Control Panel
          </button>
          <button onClick={() => window.print()} className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
            <Printer size={16}/> Print Ledger
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-indigo-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden mb-10 border-b-[10px] border-indigo-500">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-8">
              <div className="w-32 h-32 rounded-[2.5rem] bg-white/10 border-4 border-white/20 overflow-hidden shadow-inner flex items-center justify-center backdrop-blur-md">
                 {student.photo_url ? <img src={student.photo_url} className="w-full h-full object-cover" alt="" /> : <User size={50} className="opacity-20" />}
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">{student.full_name}</h1>
                <div className="flex gap-3 mt-4">
                   <span className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase">Class {student.class_name}</span>
                   <span className="bg-emerald-500 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-lg">Roll {student.roll_no}</span>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center min-w-[180px]">
              <p className="text-[10px] font-black uppercase text-indigo-200 mb-1">Attendance</p>
              <p className="text-5xl font-black tracking-tighter">{attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0}%</p>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
              <h3 className="font-black uppercase text-[11px] text-gray-400 tracking-[0.2em] mb-8 flex items-center gap-2 italic">Student Dossier</h3>
              <div className="space-y-6">
                <InfoItem icon={User} label="Guardian" value={student.father_name} />
                <InfoItem icon={Phone} label="Contact" value={student.contact_number} />
                <InfoItem icon={Calendar} label="DOB" value={student.date_of_birth} />
                <InfoItem icon={MapPin} label="Address" value={student.address} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* 💰 Fees History */}
            <div className="bg-white rounded-[3.5rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                 <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><CreditCard size={18}/></div>
                    <h3 className="font-black uppercase text-xs tracking-widest text-gray-800 italic">Fee Transactions</h3>
                 </div>
                 <span className="font-black text-[10px] text-gray-400 uppercase">Records: {fees.length}</span>
              </div>
              <div className="p-6">
                {fees.length > 0 ? (
                   <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-[10px] font-black text-gray-400 uppercase italic">
                        <th className="px-6 py-2">Billing Cycle</th>
                        <th className="px-6 py-2">Amount Paid</th>
                        <th className="px-6 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.map((f: any) => (
                        <tr key={f.id} className="bg-gray-50/80 hover:bg-white hover:shadow-xl transition-all duration-300 rounded-[2rem] group border border-transparent hover:border-indigo-100">
                          <td className="px-6 py-6 rounded-l-[2rem] font-black text-gray-900 uppercase text-xs italic">{f.month || 'Monthly Fee'}</td>
                          <td className="px-6 py-6 font-black text-indigo-600 text-lg">₹{Number(f.total_amount).toLocaleString()}</td>
                          <td className="px-6 py-6 rounded-r-[2rem] text-right">
                            <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${f.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600 animate-pulse'}`}>
                              {f.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                   <div className="py-20 text-center opacity-20 flex flex-col items-center">
                      <CreditCard size={60} className="mb-4" />
                      <p className="font-black uppercase text-sm italic tracking-widest">No matching ledger entries.</p>
                   </div>
                )}
              </div>
            </div>

            {/* Academic Results */}
            <div className="bg-white rounded-[3.5rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center gap-3">
                 <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><Award size={18}/></div>
                 <h3 className="font-black uppercase text-xs tracking-widest text-gray-800 italic">Academic Performance</h3>
              </div>
              <div className="p-10">
                 {results.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {results.map((r: any) => (
                       <div key={r.id} className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-[2.5rem] hover:shadow-2xl hover:bg-white transition-all">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{r.exams?.title}</p>
                          <p className={`text-2xl font-black italic mt-1 ${r.status === 'PASS' ? 'text-emerald-600' : 'text-rose-600'}`}>{r.status}</p>
                          <div className="mt-6 flex justify-between items-end border-t pt-6 border-indigo-100/50">
                             <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase italic">Grand Total</p>
                                <p className="text-xl font-black text-indigo-900">₹{r.total_marks}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[9px] font-black text-gray-400 uppercase italic">Percentage</p>
                                <p className="text-xl font-black text-indigo-900">{r.percentage?.toFixed(1)}%</p>
                             </div>
                          </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <p className="text-center py-10 opacity-20 font-black uppercase text-xs italic tracking-widest">Reports pending evaluation.</p>
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
    <div className="bg-gray-50 p-4 rounded-2xl text-indigo-600 shadow-sm border border-gray-100"><Icon size={20}/></div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1 italic">{label}</p>
      <p className="font-bold text-gray-900 text-sm tracking-tight">{value || 'N/A'}</p>
    </div>
  </div>
);

export default StudentProfile;
