import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "sonner";
import {
  User, Phone, MapPin, CreditCard, ChevronLeft, 
  Printer, RefreshCw, AlertCircle, Download,
  Calendar, Award, GraduationCap
} from "lucide-react";

const StudentProfile = () => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState({ present: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // 🔥 JOIN QUERY के साथ FULL DATA FETCH
  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id || isNaN(Number(id)) || Number(id) <= 0) {
        throw new Error(`Invalid Student ID: "${id}"`);
      }

      const studentIdNum = Number(id);
      console.log("🔍 JOIN Query - Fetching Student:", studentIdNum);

      // 🔥 SINGLE JOIN QUERY - सब कुछ एक साथ!
      const { data, error: fetchError } = await supabase
        .from("students")
        .select(`
          *,
          class:class_id(class_name),
          
          fees!student_id (
            id, month, session, total_amount, status, 
            created_at, payment_date, remarks
          ),
          
          results!student_id (
            id, marks_obtained, total_marks, percentage, 
            grade, result, exam_date, subject,
            exams!inner(title, exam_type)
          ),
          
          attendance!student_id (
            id, status, date, period
          )
        `)
        .eq("student_id", studentIdNum)
        .single();

      if (fetchError) {
        console.error("🚨 JOIN Error:", fetchError);
        // Fallback - separate queries
        await fallbackFetch(studentIdNum);
        return;
      }

      if (!data) {
        setStudent(null);
        toast.warning(`Student #${studentIdNum} not found`);
        return;
      }

      // ✅ Data unpack
      setStudent(data);
      setFees(data.fees || []);
      setResults(data.results || []);
      
      const attRecords = data.attendance || [];
      setAttendance({
        present: attRecords.filter((a: any) => a.status === "Present").length,
        total: attRecords.length
      });

      toast.success(`✅ Loaded: ${data.full_name}`);

    } catch (err: any) {
      console.error("🚨 Error:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 🔄 FALLBACK - अगर JOIN fail हो जाए
  const fallbackFetch = async (studentIdNum: number) => {
    const [
      { data: studentData },
      { data: feeData = [] },
      { data: resultData = [] },
      { data: attData = [] }
    ] = await Promise.all([
      supabase.from("students").select("*").eq("student_id", studentIdNum).single(),
      supabase.from("fees").select("*").eq("student_id", studentIdNum),
      supabase.from("results").select("*").eq("student_id", studentIdNum),
      supabase.from("attendance").select("*").eq("student_id", studentIdNum)
    ]);

    setStudent(studentData || null);
    setFees(feeData || []);
    setResults(resultData || []);
    setAttendance({
      present: (attData || []).filter((a: any) => a.status === "Present").length,
      total: attData?.length || 0
    });
  };

  useEffect(() => {
    if (id) {
      fetchStudentData();
    } else {
      setError("No Student ID in URL");
      setLoading(false);
    }
  }, [id, fetchStudentData]);

  // 💰 Financial Calculations
  const totalFees = fees.reduce((sum, f) => sum + Number(f.total_amount || 0), 0);
  const paidFees = fees.filter(f => f.status === "Paid").reduce((sum, f) => sum + Number(f.total_amount || 0), 0);
  const dueFees = Math.max(0, totalFees - paidFees);
  const attendanceRate = attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0;

  // 📊 CSV Export
  const exportToCSV = () => {
    if (!student) return;
    const csv = [
      [`Student Report - ${student.full_name}`, `ID: ${student.student_id}`],
      [],
      ["📊 Financial Summary"],
      ["Total Fees", `₹${totalFees.toLocaleString()}`, "Due", `₹${dueFees.toLocaleString()}`],
      [],
      ["📋 Fee Details"],
      ["Month", "Amount", "Status", "Payment Date"],
      ...fees.map(f => [f.month || "N/A", `₹${Number(f.total_amount).toLocaleString()}`, f.status || "Pending", f.payment_date || ""])
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_${student.student_id}_${student.full_name.replace(/[^a-z0-9]/gi, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 🔄 UI States
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-50">
      <div className="text-center p-8">
        <RefreshCw className="animate-spin mx-auto mb-6 text-indigo-600" size={56} />
        <p className="text-2xl font-black uppercase tracking-widest text-gray-700 mb-2">Loading Profile</p>
        <p className="text-indigo-600 font-mono bg-indigo-100 px-4 py-2 rounded-full inline-block">
          Student ID: {id || "Validating..."}
        </p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-rose-50 to-slate-50">
      <AlertCircle size={96} className="text-rose-400 mb-8 drop-shadow-2xl" />
      <h1 className="text-5xl font-black text-gray-900 uppercase tracking-widest mb-6">Error</h1>
      <div className="max-w-2xl bg-white/90 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-rose-100 mb-12">
        <p className="text-xl font-semibold text-gray-800 mb-6">{error}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-indigo-50 p-4 rounded-2xl">
            <strong>Path:</strong> <code>{location.pathname}</code>
          </div>
          <div className="bg-yellow-50 p-4 rounded-2xl">
            <strong>ID:</strong> <code>{id || "missing"}</code>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl">
            <strong>Route:</strong> <code>/students/:id</code>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <button onClick={() => navigate("/students")} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-3xl font-black uppercase tracking-widest shadow-2xl transition-all">
          📋 Students List
        </button>
        <button onClick={fetchStudentData} className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-4 rounded-3xl font-black uppercase tracking-widest shadow-2xl transition-all">
          🔄 Retry
        </button>
      </div>
    </div>
  );

  if (!student) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-amber-50 to-slate-50">
      <AlertCircle size={96} className="text-amber-400 mb-8 drop-shadow-2xl opacity-60" />
      <h1 className="text-5xl font-black text-gray-900 uppercase tracking-widest mb-4">Student Not Found</h1>
      <p className="text-2xl font-bold text-gray-600 mb-8 max-w-lg">
        ID <code className="bg-gray-200 px-6 py-3 rounded-2xl font-mono text-xl font-black text-indigo-600">{id}</code> 
        doesn't exist in database
      </p>
      <button onClick={() => navigate("/students")} className="bg-indigo-600 hover:bg-indigo-700 text-white px-20 py-6 rounded-3xl font-black uppercase tracking-widest text-lg shadow-2xl transition-all">
        👥 View All Students
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 🧭 Navigation */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <button 
            onClick={() => navigate(-1)}
            className="group flex items-center gap-3 bg-white/80 backdrop-blur-sm px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm text-indigo-700 shadow-2xl border border-indigo-100 hover:shadow-3xl hover:-translate-y-1 transition-all"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-3xl font-black uppercase text-sm tracking-widest shadow-2xl hover:shadow-3xl transition-all"
            >
              <Download size={18} /> Export CSV
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-gradient-to-r from-gray-900 to-slate-900 hover:from-indigo-900 text-white px-8 py-4 rounded-3xl font-black uppercase text-sm tracking-widest shadow-2xl hover:shadow-3xl transition-all flex items-center gap-2"
            >
              <Printer size={18} /> Print Report
            </button>
          </div>
        </div>

        {/* 🎨 Hero Header */}
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 rounded-3xl p-8 lg:p-12 text-white shadow-3xl mb-12 relative overflow-hidden border-4 border-indigo-400/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),transparent)]" />
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
            <div className="flex flex-col lg:flex-row items-center gap-8 flex-1">
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl bg-white/20 border-4 border-white/30 overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-xl">
                {student.photo_url ? (
                  <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User size={56} className="text-white/40" />
                )}
              </div>
              <div className="text-center lg:text-left">
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl inline-block mb-6">
                  ✅ Verified Student
                </span>
                <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-[-0.05em] leading-none bg-gradient-to-r from-white via-indigo-100 to-white bg-clip-text text-transparent">
                  {student.full_name}
                </h1>
                <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
                  <div className="bg-white/20 backdrop-blur-xl px-6 py-4 rounded-2xl text-sm font-black border border-white/30 tracking-widest uppercase flex items-center gap-2">
                    <GraduationCap size={18} />
                    {student.class_name || "N/A"}
                  </div>
                  <div className="bg-white/20 backdrop-blur-xl px-6 py-4 rounded-2xl text-sm font-black border border-white/30 tracking-widest uppercase flex items-center gap-2">
                    🆔 {student.roll_no || "N/A"}
                  </div>
                  <div className="bg-white/20 backdrop-blur-xl px-6 py-4 rounded-2xl text-sm font-black border border-white/30 tracking-widest uppercase flex items-center gap-2">
                    ID: {student.student_id}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Attendance Circle */}
            <div className="bg-white/20 backdrop-blur-2xl p-12 rounded-3xl border border-white/30 text-center min-w-[240px] shadow-2xl">
              <p className="text-sm font-black uppercase text-indigo-200 mb-6 tracking-widest flex items-center justify-center gap-2">
                📊 Attendance
              </p>
              <p className={`text-6xl lg:text-7xl font-black tracking-[-0.1em] ${
                attendanceRate >= 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-200' : 
                attendanceRate >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-200' : 
                'bg-gradient-to-r from-rose-400 to-rose-200'
              } bg-clip-text text-transparent`}>
                {attendanceRate}%
              </p>
              <p className="text-sm text-indigo-200 mt-4 opacity-90">
                {attendance.present}/{attendance.total} days
              </p>
            </div>
          </div>
        </div>

        {/* 📊 Content Grid */}
        <div className="grid lg:grid-cols-3 gap-10">
          {/* 📋 Student Info Sidebar */}
          <div className="space-y-8 lg:sticky lg:top-24">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/60">
              <h3 className="font-black uppercase text-lg text-gray-800 tracking-widest mb-8 flex items-center gap-3 pb-6 border-b-2 border-indigo-100">
                📁 Student Dossier
              </h3>
              <InfoItem icon={User} label="Student ID" value={student.student_id} />
              <InfoItem icon={User} label="Father's Name" value={student.father_name} />
              <InfoItem icon={Phone} label="Contact" value={student.contact_number} />
              <InfoItem icon={MapPin} label="Address" value={student.address} />
              {student.dob && (
                <InfoItem icon={Calendar} label="DOB" value={new Date(student.dob).toLocaleDateString()} />
              )}
            </div>
          </div>

          {/* 💰 Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Financial Summary */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-3xl p-10 border border-white/60 overflow-hidden">
              <div className="flex items-center gap-5 mb-10 pb-8 border-b-2 border-indigo-50">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-5 rounded-3xl text-white shadow-2xl">
                  <CreditCard size={28} />
                </div>
                <div>
                  <h3 className="font-black uppercase text-2xl tracking-widest text-gray-900">💳 Financial Summary</h3>
                  <p className="text-indigo-600 font-semibold mt-1">Fee payments & balance</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <StatCard title="Total Fees" value={`₹${totalFees.toLocaleString()}`} icon="📊" />
                <StatCard 
                  title="Paid" 
                  value={`₹${paidFees.toLocaleString()}`} 
                  color="text-emerald-600 bg-emerald-50/80" 
                  icon="✅" 
                />
                <StatCard 
                  title="Due" 
                  value={`₹${dueFees.toLocaleString()}`}
                  color={dueFees > 0 ? "text-rose-600 bg-rose-50/80" : "text-emerald-600 bg-emerald-50/80"}
                  icon={dueFees > 0 ? "⚠️" : "🎉"}
                />
              </div>

              {/* Fees Table */}
              <div className="overflow-x-auto">
                {fees.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gradient-to-br from-gray-50 to-indigo-50">
                    <CreditCard className="mx-auto mb-6 text-gray-400" size={64} />
                    <p className="text-3xl font-black text-gray-400 uppercase tracking-wider mb-2">No Fee Records</p>
                    <p className="text-gray-500 text-lg font-medium italic">Student has no fee transactions yet</p>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-gray-200/50 shadow-2xl overflow-hidden bg-white/60">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10">
                        <tr>
                          <th className="px-8 py-6 text-left text-sm font-black text-gray-800 uppercase tracking-widest">Billing Period</th>
                          <th className="px-8 py-6 text-left text-sm font-black text-gray-800 uppercase tracking-widest">Amount</th>
                          <th className="px-8 py-6 text-right text-sm font-black text-gray-800 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-6 text-right text-sm font-black text-gray-800 uppercase tracking-widest">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fees.map((fee: any) => (
                          <tr key={fee.id} className="group hover:bg-indigo-50/50 transition-all border-b border-gray-100/50 last:border-b-0">
                            <td className="px-8 py-8 font-black text-lg text-gray-900 uppercase group-hover:text-indigo-700">
                              {fee.month || fee.session || "Current"}
                            </td>
                            <td className="px-8 py-8">
                              <span className="text-3xl font-black text-indigo-600 tracking-tight">
                                ₹{Number(fee.total_amount).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-8 py-8 text-right">
                              <span className={`px-8 py-4 rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl transform transition-all group-hover:scale-105 ${
                                fee.status === "Paid" 
                                  ? "bg-emerald-500/90 text-white border-2 border-emerald-400 hover:bg-emerald-600" 
                                  : "bg-rose-100/80 text-rose-800 border-2 border-rose-200 animate-pulse"
                              }`}>
                                {fee.status || "Pending"}
                              </span>
                            </td>
                            <td className="px-8 py-8 text-right text-lg font-semibold text-gray-700">
                              {fee.created_at ? new Date(fee.created_at).toLocaleDateString('en-IN') : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* 📈 Results (Bonus) */}
            {results.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-3xl p-10 border border-white/60">
                <h3 className="font-black uppercase text-2xl tracking-widest text-gray-900 mb-10 flex items-center gap-4 pb-6 border-b-2 border-indigo-100">
                  🏆 Exam Results ({results.length})
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.slice(0, 6).map((result: any) => (
                    <div key={result.id} className="group p-8 rounded-3xl border border-gray-200 hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-300 transition-all bg-gradient-to-br from-white to-blue-50/50">
                      <div className="flex items-start justify-between mb-4">
                        <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">
                          {result.exams?.title || result.subject || "Exam"}
                        </p>
                        <Award className="text-yellow-500 group-hover:scale-110 transition-transform" size={24} />
                      </div>
                      <div className="text-4xl font-black text-indigo-600 tracking-tight mb-2">
                        {result.marks_obtained || 0}/{result.total_marks || "—"}
                      </div>
                      <p className="text-2xl font-black text-gray-800 mb-1">
                        {result.percentage ? `${result.percentage}%` : result.grade || result.result || "—"}
                      </p>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                        {result.exam_date ? new Date(result.exam_date).toLocaleDateString() : "—"}
                      </p>
                    </div>
                  ))}
                </div>
                {results.length > 6 && (
                  <p className="text-center text-lg text-gray-500 mt-10 italic font-semibold">
                    Showing 6 of {results.length} results
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 🛠️ Helper Components
interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: any;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value }) => (
  <div className="group flex items-start gap-4 py-4 px-4 -mx-4 rounded-3xl hover:bg-indigo-50/80 transition-all hover:scale-[1.02] hover:shadow-lg border border-transparent hover:border-indigo-200">
    <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-4 rounded-2xl text-white shadow-xl flex-shrink-0 mt-1 group-hover:scale-110 transition-all">
      <Icon size={22} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-black text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-xl font-bold text-gray-900 tracking-tight truncate">
        {value || <span className="italic text-gray-400 font-normal">Not provided</span>}
      </p>
    </div>
  </div>
);

interface StatCardProps {
  title: string;
  value: string;
  color?: string;
  icon?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color = "text-indigo-600", icon = "📈" }) => (
  <div className="group bg-white/60 backdrop-blur-sm p-10 rounded-3xl text-center border border-gray-200/50 shadow-2xl hover:shadow-3xl hover:-translate-y-3 transition-all duration-500 hover:bg-white/90">
    <div className="text-3xl mb-6 opacity-80 group-hover:scale-125 transition-transform duration-300">{icon}</div>
    <p className="text-sm font-black uppercase tracking-[0.3em] text-gray-600 mb-4">{title}</p>
    <p className={`text-4xl font-black ${color} tracking-[-0.08em] leading-none`}>{value}</p>
  </div>
);

export default StudentProfile;
