import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "sonner";
import {
  User,
  Phone,
  MapPin,
  CreditCard,
  ChevronLeft,
  Printer,
  RefreshCw,
  AlertCircle
} from "lucide-react";

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

      // ✅ NaN Fix: पक्का करें कि ID एक वैध नंबर है
      const studentIdNum = parseInt(id || "");
      if (isNaN(studentIdNum)) {
        throw new Error("Invalid Student ID format");
      }

      /* -----------------------------
      1. FETCH STUDENT
      ------------------------------*/
      const { data: std, error: stdErr } = await supabase
        .from("students")
        .select("*")
        .eq("student_id", studentIdNum)
        .maybeSingle();

      if (stdErr) throw stdErr;
      if (!std) {
        setStudent(null);
        setLoading(false);
        return;
      }
      setStudent(std);

      /* -----------------------------
      2. FETCH FEES, RESULTS & ATTENDANCE (Parallel Fetching)
      ------------------------------*/
      const [feeRes, resData, attData] = await Promise.all([
        supabase.from("fees").select("*").eq("student_id", studentIdNum).order("created_at", { ascending: false }),
        supabase.from("results").select("*, exams(title)").eq("student_id", studentIdNum),
        supabase.from("attendance").select("status").eq("student_id", studentIdNum)
      ]);

      if (feeRes.data) setFees(feeRes.data);
      if (resData.data) setResults(resData.data);
      if (attData.data) {
        setAttendance({
          present: attData.data.filter((a: any) => a.status === "Present").length,
          total: attData.data.length
        });
      }

    } catch (err: any) {
      console.error("Critical Error:", err.message);
      toast.error(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------
  LOADING & NOT FOUND SCREENS
  -------------------------------- */
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
      <RefreshCw className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="font-black uppercase tracking-widest text-gray-400 italic">Syncing ASM Database...</p>
    </div>
  );

  if (!student) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-[#f8fafc]">
      <AlertCircle size={80} className="text-rose-500 mb-6 opacity-20" />
      <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Record Not Found</h2>
      <p className="text-gray-400 mt-2 font-medium">Student ID {id} does not exist in our system.</p>
      <button onClick={() => navigate(-1)} className="mt-8 bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all">Go Back</button>
    </div>
  );

  /* --------------------------------
  CALCULATIONS
  -------------------------------- */
  const attendanceRate = attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0;
  const totalFees = fees.reduce((sum, f) => sum + Number(f.total_amount || 0), 0);
  const paidFees = fees.filter((f) => f.status === "Paid").reduce((sum, f) => sum + Number(f.total_amount || 0), 0);
  const dueFees = totalFees - paidFees;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        
        {/* NAVIGATION */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm border border-indigo-50 hover:shadow-md transition-all">
            <ChevronLeft size={16} /> Back to Dashboard
          </button>
          <button onClick={() => window.print()} className="bg-gray-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:bg-indigo-600 transition-all">
            <Printer size={16} /> Download Report
          </button>
        </div>

        {/* HEADER CARD */}
        <div className="bg-indigo-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-10 border-b-[10px] border-indigo-500/30">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="w-32 h-32 rounded-[2.5rem] bg-white/10 border-4 border-white/20 overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-md">
                {student.photo_url ? (
                  <img src={student.photo_url} className="w-full h-full object-cover" alt="Student" />
                ) : (
                  <User size={60} className="text-white/20" />
                )}
              </div>
              <div>
                <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Verified Student</span>
                <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mt-3 leading-none">{student.full_name}</h1>
                <div className="flex gap-4 mt-5">
                   <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 tracking-widest uppercase italic">Class: {student.class_name}</div>
                   <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 tracking-widest uppercase italic">Roll: {student.roll_no}</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center min-w-[200px] shadow-inner">
              <p className="text-[10px] font-black uppercase text-indigo-200 mb-2 tracking-widest italic">Attendance</p>
              <p className="text-6xl font-black tracking-tighter">{attendanceRate}%</p>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* CONTENT GRID */}
        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* SIDEBAR: INFO */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50">
              <h3 className="font-black uppercase text-[11px] text-gray-400 tracking-widest mb-8 flex items-center gap-2 italic">Student Dossier</h3>
              <InfoItem icon={User} label="Student ID" value={student.student_id} />
              <InfoItem icon={User} label="Father Name" value={student.father_name} />
              <InfoItem icon={Phone} label="Contact Support" value={student.contact_number} />
              <InfoItem icon={MapPin} label="Residential Address" value={student.address} />
            </div>
          </div>

          {/* MAIN: FINANCIAL */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[3rem] shadow-xl border border-gray-50 overflow-hidden">
              <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><CreditCard size={18}/></div>
                    <h3 className="font-black uppercase text-[11px] tracking-widest text-gray-800 italic">Financial Summary</h3>
                 </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-3 gap-6 mb-10">
                  <StatCard title="Total" value={`₹${totalFees.toLocaleString()}`} />
                  <StatCard title="Paid" value={`₹${paidFees.toLocaleString()}`} color="text-emerald-600" />
                  <StatCard title="Due" value={`₹${dueFees.toLocaleString()}`} color="text-rose-600" />
                </div>

                <div className="overflow-x-auto">
                  {fees.length === 0 ? (
                    <div className="py-10 text-center opacity-20 italic font-bold text-sm uppercase tracking-widest">No matching ledger entries.</div>
                  ) : (
                    <table className="w-full text-left border-separate border-spacing-y-3">
                      <thead>
                        <tr className="text-[10px] font-black text-gray-400 uppercase italic">
                          <th className="px-6 py-2">Billing Cycle</th>
                          <th className="px-6 py-2">Amount Paid</th>
                          <th className="px-6 py-2 text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fees.map((f) => (
                          <tr key={f.id} className="bg-gray-50/80 hover:bg-white transition-all rounded-[1.5rem] group border border-transparent hover:border-indigo-100 shadow-sm">
                            <td className="px-6 py-5 rounded-l-[1.5rem] font-black text-gray-900 uppercase text-xs italic">{f.month || "Current"}</td>
                            <td className="px-6 py-5 font-black text-indigo-600 text-lg">₹{Number(f.total_amount).toLocaleString()}</td>
                            <td className="px-6 py-5 rounded-r-[1.5rem] text-right">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${f.status === "Paid" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600 animate-pulse"}`}>
                                {f.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

/* --------------------------------
HELPERS
-------------------------------- */
const InfoItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-start gap-4 mb-6 last:mb-0">
    <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shadow-sm border border-indigo-100"><Icon size={18} /></div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">{label}</p>
      <p className="font-bold text-gray-900 text-sm tracking-tight">{value || "Not Provided"}</p>
    </div>
  </div>
);

const StatCard = ({ title, value, color = "text-indigo-600" }: any) => (
  <div className="bg-gray-50/50 p-6 rounded-[2rem] text-center border border-gray-100 shadow-inner">
    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 italic">{title}</p>
    <p className={`text-xl md:text-2xl font-black ${color} tracking-tighter`}>{value}</p>
  </div>
);

export default StudentProfile;
