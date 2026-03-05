import React, { useState, useEffect, useCallback } from "react";
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
  AlertCircle,
  Download
} from "lucide-react";

const StudentProfile = () => {
  const { id } = useParams<{ id: string }>(); // ✅ Type-safe params
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState({ present: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // ✅ Fixed: Robust ID validation + memoized fetch
  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ FIXED: Comprehensive ID validation
      if (!id) {
        throw new Error("Student ID is required");
      }

      const studentIdNum = parseInt(id, 10);
      if (isNaN(studentIdNum) || studentIdNum <= 0) {
        throw new Error(`Invalid Student ID format: "${id}". Please use a valid numeric ID.`);
      }

      console.log(`🔍 Fetching student ID: ${studentIdNum}`);

      /* -----------------------------
      1. FETCH STUDENT (SINGLE)
      ------------------------------*/
      const { data: std, error: stdErr } = await supabase
        .from("students")
        .select(`
          *,
          class:class_id (
            class_name
          )
        `)
        .eq("student_id", studentIdNum)
        .maybeSingle();

      if (stdErr) {
        console.error("❌ Student fetch error:", stdErr);
        throw new Error(`Student fetch failed: ${stdErr.message}`);
      }

      if (!std) {
        console.warn("⚠️ Student not found:", studentIdNum);
        setStudent(null);
        setFees([]);
        setResults([]);
        setAttendance({ present: 0, total: 0 });
        return;
      }

      setStudent(std);

      /* -----------------------------
      2. PARALLEL FETCH: Fees, Results, Attendance
      ------------------------------*/
      const [
        { data: feeData = [], error: feeErr },
        { data: resultData = [], error: resultErr },
        { data: attData = [], error: attErr }
      ] = await Promise.allSettled([
        supabase
          .from("fees")
          .select("*")
          .eq("student_id", studentIdNum)
          .order("created_at", { ascending: false }),
        
        supabase
          .from("results")
          .select("*, exams(title)")
          .eq("student_id", studentIdNum)
          .order("exam_date", { ascending: false }),
        
        supabase
          .from("attendance")
          .select("status")
          .eq("student_id", studentIdNum)
      ]);

      // ✅ Safe data assignment with error handling
      if (feeErr) console.error("Fees error:", feeErr);
      setFees(Array.isArray(feeData) ? feeData : []);

      if (resultErr) console.error("Results error:", resultErr);
      setResults(Array.isArray(resultData) ? resultData : []);

      if (attErr) console.error("Attendance error:", attErr);
      
      const attRecords = Array.isArray(attData) ? attData : [];
      setAttendance({
        present: attRecords.filter((a: any) => a.status === "Present").length,
        total: attRecords.length
      });

      toast.success(`Profile loaded for ${std.full_name}`);

    } catch (err: any) {
      console.error("🚨 Critical Error:", err);
      setError(err.message || "Failed to load student profile");
      toast.error(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ✅ Fixed useEffect dependency
  useEffect(() => {
    if (id) {
      fetchStudentData();
    } else {
      setError("No Student ID provided");
      setLoading(false);
    }
  }, [id, fetchStudentData]);

  // ✅ Enhanced calculations with safe defaults
  const attendanceRate = attendance.total > 0 
    ? Math.round((attendance.present / attendance.total) * 100) 
    : 0;
  
  const totalFees = fees.reduce((sum, f) => sum + Number(f.total_amount || 0), 0);
  const paidFees = fees
    .filter((f) => f.status === "Paid")
    .reduce((sum, f) => sum + Number(f.total_amount || 0), 0);
  const dueFees = Math.max(0, totalFees - paidFees); // ✅ Prevent negative due

  // ✅ CSV Export function
  const exportToCSV = () => {
    const csvContent = [
      ["Student Report", student?.full_name],
      [],
      ["Fee Details"],
      ["Month", "Amount", "Status"],
      ...fees.map(f => [f.month || "N/A", `₹${Number(f.total_amount).toLocaleString()}`, f.status])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Student_${student?.student_id}_${student?.full_name.replace(/\s+/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  /* -----------------------------
  LOADING SCREEN
  -----------------------------*/
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-50">
        <RefreshCw className="animate-spin text-indigo-600 mb-6" size={48} />
        <p className="text-lg font-black uppercase tracking-widest text-gray-500">Loading Student Profile...</p>
        <p className="text-sm text-gray-400 mt-2">Syncing with ASM Database</p>
      </div>
    );
  }

  /* -----------------------------
  ERROR SCREEN
  -----------------------------*/
  if (error || !id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-gradient-to-br from-rose-50 to-slate-50">
        <AlertCircle size={96} className="text-rose-400 mb-8 drop-shadow-lg" />
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-widest mb-4">
          Invalid Request
        </h2>
        <p className="text-xl md:text-2xl font-bold text-gray-600 mb-2 max-w-md">
          {error || "Student ID not provided"}
        </p>
        <p className="text-gray-500 mb-8 max-w-lg">
          Please check the Student ID and try again. ID must be a valid number (e.g., 12345).
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-3xl font-black uppercase text-sm tracking-widest shadow-2xl transition-all duration-300"
          >
            ← Go Back
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="border-2 border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 px-12 py-4 rounded-3xl font-black uppercase text-sm tracking-widest shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* -----------------------------
  NOT FOUND SCREEN
  -----------------------------*/
  if (!student) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-gradient-to-br from-slate-50 to-gray-50">
        <AlertCircle size={96} className="text-amber-400 mb-8 drop-shadow-lg opacity-60" />
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-widest mb-4">
          Student Not Found
        </h2>
        <p className="text-xl md:text-2xl font-bold text-gray-600 mb-8 max-w-md">
          ID <span className="font-mono bg-gray-100 px-4 py-2 rounded-xl text-indigo-600 font-black">{id}</span> 
          does not exist
        </p>
        <button 
          onClick={() => navigate(-1)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-16 py-5 rounded-3xl font-black uppercase text-sm tracking-widest shadow-2xl transition-all duration-300"
        >
          ← Back to Students
        </button>
      </div>
    );
  }

  /* -----------------------------
  MAIN PROFILE UI
  -----------------------------*/
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* 🧭 NAVIGATION BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-3xl text-xs font-black uppercase tracking-widest text-indigo-700 shadow-xl border border-indigo-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <div className="flex gap-3">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button 
              onClick={() => window.print()} 
              className="bg-gradient-to-r from-gray-900 to-slate-900 hover:from-indigo-900 hover:to-slate-900 text-white px-8 py-3 rounded-3xl text-xs font-black uppercase tracking-widest shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-2"
            >
              <Printer size={16} />
              Print Report
            </button>
          </div>
        </div>

        {/* 🎨 HEADER HERO */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-8 lg:p-12 text-white shadow-3xl relative overflow-hidden mb-12 border-4 border-indigo-500/20">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left flex-1">
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl bg-white/20 border-4 border-white/30 overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-xl ring-2 ring-white/20">
                {student.photo_url ? (
                  <img 
                    src={student.photo_url} 
                    className="w-full h-full object-cover" 
                    alt={`${student.full_name}'s photo`}
                    loading="lazy"
                  />
                ) : (
                  <User size={64} className="text-white/40" />
                )}
              </div>
              <div className="max-w-md">
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl inline-block mb-4">
                  ✅ Verified Student
                </span>
                <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-[-0.05em] leading-none bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
                  {student.full_name}
                </h1>
                <div className="flex flex-wrap gap-3 mt-6">
                  <div className="bg-white/20 backdrop-blur-xl px-5 py-3 rounded-2xl text-xs font-black border border-white/20 tracking-widest uppercase">
                    📚 Class: {student.class_name || "N/A"}
                  </div>
                  <div className="bg-white/20 backdrop-blur-xl px-5 py-3 rounded-2xl text-xs font-black border border-white/20 tracking-widest uppercase">
                    🆔 Roll: {student.roll_no || "N/A"}
                  </div>
                  <div className="bg-white/20 backdrop-blur-xl px-5 py-3 rounded-2xl text-xs font-black border border-white/20 tracking-widest uppercase">
                    👤 ID: {student.student_id}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-2xl p-10 lg:p-12 rounded-3xl border border-white/20 text-center min-w-[220px] shadow-2xl">
              <p className="text-xs font-black uppercase text-indigo-200 mb-4 tracking-widest">📊 Attendance</p>
              <p className={`text-5xl lg:text-7xl font-black tracking-[-0.1em] bg-gradient-to-r ${
                attendanceRate >= 75 ? 'from-emerald-400 to-emerald-200' : 
                attendanceRate >= 50 ? 'from-amber-400 to-amber-200' : 
                'from-rose-400 to-rose-200'
              } bg-clip-text text-transparent`}>
                {attendanceRate}%
              </p>
              <p className="text-xs text-indigo-200 mt-2 opacity-80">
                {attendance.present}/{attendance.total} days
              </p>
            </div>
          </div>
        </div>

        {/* 📊 MAIN CONTENT GRID */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* 📋 STUDENT INFO SIDEBAR */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50 sticky top-24">
              <h3 className="font-black uppercase text-xs text-gray-500 tracking-widest mb-8 flex items-center gap-3 italic border-b border-gray-100 pb-4">
                📁 Student Dossier
              </h3>
              <InfoItem icon={User} label="Student ID" value={student.student_id} />
              <InfoItem icon={User} label="Father's Name" value={student.father_name} />
              <InfoItem icon={Phone} label="Contact Number" value={student.contact_number} />
              <InfoItem icon={MapPin} label="Address" value={student.address} />
              {student.dob && <InfoItem icon={MapPin} label="Date of Birth" value={new Date(student.dob).toLocaleDateString()} />}
            </div>
          </div>

          {/* 💰 FINANCIAL MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Financial Summary Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
              <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-4 rounded-2xl text-white shadow-2xl">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase text-sm tracking-widest text-gray-900 italic">
                      💳 Financial Summary
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Fee ledger & payment status</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-6 mb-12">
                  <StatCard 
                    title="Total Fees" 
                    value={`₹${totalFees.toLocaleString()}`}
                    icon="📊"
                  />
                  <StatCard 
                    title="Paid" 
                    value={`₹${paidFees.toLocaleString()}`}
                    color="text-emerald-600 bg-emerald-50/80"
                    icon="✅"
                  />
                  <StatCard 
                    title="Balance Due" 
                    value={`₹${dueFees.toLocaleString()}`}
                    color={dueFees > 0 ? "text-rose-600 bg-rose-50/80" : "text-emerald-600 bg-emerald-50/80"}
                    icon={dueFees > 0 ? "⚠️" : "🎉"}
                  />
                </div>

                {/* Fees Table */}
                <div className="overflow-x-auto">
                  {fees.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                      <CreditCard className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-2xl font-black text-gray-400 uppercase tracking-wider mb-2">
                        No Fee Records
                      </p>
                      <p className="text-gray-500 italic">Student has no fee transactions yet.</p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-inner bg-white/50">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                          <tr>
                            <th className="px-8 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Billing Period</th>
                            <th className="px-8 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Amount</th>
                            <th className="px-8 py-5 text-right text-xs font-black text-gray-700 uppercase tracking-wider">Status</th>
                            <th className="px-8 py-5 text-right text-xs font-black text-gray-700 uppercase tracking-wider">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fees.map((fee: any) => (
                            <tr 
                              key={fee.id} 
                              className="group hover:bg-indigo-50/50 transition-all duration-200 border-b border-gray-100 last:border-b-0"
                            >
                              <td className="px-8 py-6 font-bold text-gray-900 text-sm uppercase">
                                {fee.month || fee.session || "Current"}
                              </td>
                              <td className="px-8 py-6">
                                <span className="text-2xl font-black text-indigo-600 tracking-tight">
                                  ₹{Number(fee.total_amount).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <span className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg ${
                                  fee.status === "Paid" 
                                    ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-200" 
                                    : "bg-rose-100 text-rose-800 border-2 border-rose-200 animate-pulse"
                                }`}>
                                  {fee.status || "Pending"}
                                </span>
                              </td>
                              <td className="px-8 py-6 text-right text-xs text-gray-500">
                                {fee.created_at ? new Date(fee.created_at).toLocaleDateString() : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 📈 RESULTS SECTION (Bonus Feature) */}
            {results.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8">
                <h4 className="font-black uppercase text-sm tracking-widest text-gray-900 mb-6 flex items-center gap-3 italic">
                  📊 Exam Results ({results.length} exams)
                </h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.slice(0, 6).map((result: any) => (
                    <div key={result.id} className="p-6 rounded-2xl border border-gray-200 hover:shadow-xl transition-all bg-gradient-to-br from-white to-blue-50">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                        {result.exams?.title || "Exam"}
                      </p>
                      <p className="text-3xl font-black text-indigo-600 tracking-tight">
                        {result.marks_obtained || 0}/{result.total_marks || 100}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {result.grade || result.result || "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
                {results.length > 6 && (
                  <p className="text-center text-sm text-gray-500 mt-6 italic">
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

/* -----------------------------
HELPER COMPONENTS
-----------------------------*/
interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number | undefined;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 py-3 px-2 -m-2 rounded-2xl group hover:bg-indigo-50/50 transition-all duration-200 hover:scale-[1.02]">
    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-3 rounded-2xl text-indigo-600 shadow-lg border border-indigo-200 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-all">
      <Icon size={20} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="font-bold text-gray-900 text-base tracking-tight truncate">
        {value || <span className="italic text-gray-400">Not provided</span>}
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
  <div className="group bg-white/50 p-8 rounded-3xl text-center border-2 border-gray-200/50 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 backdrop-blur-sm hover:bg-white/80">
    <div className="text-2xl mb-3 opacity-75 group-hover:scale-110 transition-transform">{icon}</div>
    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">{title}</p>
    <p className={`text-3xl lg:text-4xl font-black ${color} tracking-[-0.05em] leading-none`}>
      {value}
    </p>
  </div>
);

export default StudentProfile;
