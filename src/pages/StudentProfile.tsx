import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "sonner";
import {
  User, Phone, MapPin, CreditCard, ChevronLeft, 
  Printer, RefreshCw, AlertCircle, Download
} from "lucide-react";

const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState({ present: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // 🔥 SUPABASE JOIN QUERY - Foreign Key के साथ
  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id || isNaN(Number(id))) {
        throw new Error("Invalid Student ID format");
      }

      const studentIdNum = Number(id);
      console.log("🔍 Fetching student with JOIN:", studentIdNum);

      // ✅ SINGLE JOIN QUERY - सब कुछ एक query में
      const { data, error: joinError } = await supabase
        .from("students")
        .select(`
          *,
          fees!inner(student_id, id, month, total_amount, status, created_at),
          results!inner(student_id, id, marks_obtained, total_marks, grade),
          attendance!inner(student_id, status)
        `)
        .eq("student_id", studentIdNum)
        .single();

      if (joinError) {
        console.log("JOIN failed, using fallback...");
        // Fallback - separate queries (100% safe)
        await fetchSeparate(studentIdNum);
        return;
      }

      // ✅ JOIN Success - unpack data
      if (data) {
        setStudent(data);
        setFees(data.fees || []);
        setResults(data.results || []);
        
        const attRecords = data.attendance || [];
        setAttendance({
          present: attRecords.filter((a: any) => a.status === "Present").length,
          total: attRecords.length
        });
        
        toast.success(`✅ Profile loaded: ${data.full_name}`);
      }

    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 🔄 FALLBACK - Separate queries (अगर JOIN fail हो)
  const fetchSeparate = async (studentIdNum: number) => {
    const [
      { data: studentData },
      { data: feeData },
      { data: resultData },
      { data: attData }
    ] = await Promise.all([
      supabase.from("students").select("*").eq("student_id", studentIdNum).single(),
      supabase.from("fees").select("*").eq("student_id", studentIdNum),
      supabase.from("results").select("*").eq("student_id", studentIdNum),
      supabase.from("attendance").select("status").eq("student_id", studentIdNum)
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
    }
  }, [id, fetchStudentData]);

  // 💰 Calculations
  const attendanceRate = attendance.total > 0 
    ? Math.round((attendance.present / attendance.total) * 100) 
    : 0;
  
  const totalFees = fees.reduce((sum, f) => sum + Number(f.total_amount || 0), 0);
  const paidFees = fees.filter(f => f.status === "Paid").reduce((sum, f) => sum + Number(f.total_amount || 0), 0);
  const dueFees = Math.max(0, totalFees - paidFees);

  const exportCSV = () => {
    if (!student) return;
    const csv = [
      [student.full_name, `ID: ${student.student_id}`],
      [],
      ["Total Fees", `₹${totalFees.toLocaleString()}`, "Paid", `₹${paidFees.toLocaleString()}`],
      ["Due", `₹${dueFees.toLocaleString()}`],
      [],
      ["Fee Details"],
      ["Month", "Amount", "Status"],
      ...fees.map(f => [f.month || "N/A", Number(f.total_amount || 0).toLocaleString(), f.status || "Pending"])
    ].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_${student.student_id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div className="text-center">
        <RefreshCw className="animate-spin mx-auto mb-6 text-indigo-600" size={56} />
        <p className="text-2xl font-bold text-gray-700">Loading Student Profile</p>
        <p className="text-indigo-600 font-mono mt-2">ID: {id}</p>
      </div>
    </div>
  );

  // Error
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-red-50 to-slate-50">
      <AlertCircle size={80} className="text-red-400 mb-8" />
      <h1 className="text-4xl font-black text-gray-900 mb-6">Error</h1>
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-2xl">
        <p className="text-xl text-gray-800 mb-6">{error}</p>
        <div className="grid grid-cols-2 gap-4 text-sm mb-8">
          <div><strong>ID:</strong> <code>{id}</code></div>
          <div><strong>Route:</strong> <code>/students/:id</code></div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate("/students")} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700">
            Students List
          </button>
          <button onClick={fetchStudentData} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-green-700">
            Retry
          </button>
        </div>
      </div>
    </div>
  );

  // Not Found
  if (!student) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-yellow-50 to-slate-50">
      <AlertCircle size={80} className="text-yellow-400 mb-8 opacity-60" />
      <h1 className="text-4xl font-black text-gray-900 mb-6">Student Not Found</h1>
      <p className="text-2xl text-gray-600 mb-8">
        ID <code className="bg-gray-200 px-6 py-2 rounded-xl font-mono text-xl">{id}</code>
      </p>
      <button onClick={() => navigate("/students")} className="bg-indigo-600 text-white px-16 py-4 rounded-3xl font-black text-lg hover:bg-indigo-700">
        View All Students
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-12">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl font-bold text-indigo-600 shadow-lg hover:shadow-xl transition-all"
          >
            <ChevronLeft size={20} /> Back
          </button>
          <div className="flex gap-3">
            <button onClick={exportCSV} className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-700">
              <Download size={18} /> CSV
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black">
              <Printer size={18} /> Print
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-10 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
            <div className="w-32 h-32 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              {student.photo_url ? (
                <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <User size={48} className="text-indigo-600" />
              )}
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
                {student.full_name}
              </h1>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <div className="bg-indigo-100 px-6 py-3 rounded-xl font-bold">
                  Class: {student.class_name || "N/A"}
                </div>
                <div className="bg-emerald-100 px-6 py-3 rounded-xl font-bold">
                  Roll: {student.roll_no || "N/A"}
                </div>
                <div className="bg-gray-100 px-6 py-3 rounded-xl font-bold">
                  ID: {student.student_id}
                </div>
              </div>
            </div>
            <div className="bg-indigo-600 text-white p-8 rounded-2xl text-center min-w-[200px]">
              <p className="text-sm font-bold uppercase tracking-wide mb-4">Attendance</p>
              <p className={`text-5xl font-black ${attendanceRate >= 75 ? 'text-emerald-300' : 'text-yellow-300'}`}>
                {attendanceRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <h3 className="font-black text-xl mb-6 pb-4 border-b">Student Info</h3>
              <InfoItem icon={User} label="Student ID" value={student.student_id} />
              <InfoItem icon={User} label="Father" value={student.father_name} />
              <InfoItem icon={Phone} label="Phone" value={student.contact_number} />
              <InfoItem icon={MapPin} label="Address" value={student.address} />
            </div>
          </div>

          {/* Fees Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <CreditCard size={32} className="text-indigo-600" />
                <h3 className="font-black text-2xl">Financial Summary</h3>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <StatCard title="Total" value={`₹${totalFees.toLocaleString()}`} />
                <StatCard title="Paid" value={`₹${paidFees.toLocaleString()}`} color="text-green-600" />
                <StatCard title="Due" value={`₹${dueFees.toLocaleString()}`} color={dueFees > 0 ? "text-red-600" : "text-green-600"} />
              </div>

              {fees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-4 text-left font-bold text-sm uppercase">Month</th>
                        <th className="px-6 py-4 text-left font-bold text-sm uppercase">Amount</th>
                        <th className="px-6 py-4 text-right font-bold text-sm uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.map((fee: any) => (
                        <tr key={fee.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-semibold">{fee.month || "N/A"}</td>
                          <td className="px-6 py-4 font-bold text-indigo-600">
                            ₹{Number(fee.total_amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                              fee.status === "Paid" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {fee.status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No fee records found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helpers
const InfoItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-4 p-4 hover:bg-indigo-50 rounded-xl transition-colors">
    <div className="bg-indigo-100 p-3 rounded-xl">
      <Icon size={20} className="text-indigo-600" />
    </div>
    <div>
      <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-gray-900 text-lg">{value || "—"}</p>
    </div>
  </div>
);

const StatCard = ({ title, value, color = "text-indigo-600" }: any) => (
  <div className="bg-gray-50 p-6 rounded-2xl text-center shadow hover:shadow-lg transition-all">
    <p className="text-sm font-bold uppercase tracking-wide text-gray-600 mb-3">{title}</p>
    <p className={`text-3xl font-black ${color}`}>{value}</p>
  </div>
);

export default StudentProfile;
