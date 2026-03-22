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
  const [uploading, setUploading] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState({ present: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ FIX 1: URL ID Check
      if (!id || id === "undefined" || id === "null") {
        throw new Error("Student ID missing in URL");
      }

      const studentIdNum = Number(id);
      if (isNaN(studentIdNum)) {
        throw new Error(`Invalid ID format: "${id}" is not a number`);
      }

      console.log("🔍 Fetching student:", studentIdNum);

      // ✅ FIX 2: SAFE PARALLEL FETCHING (Avoids ambiguous join relationships)
      const [
        { data: studentData, error: studentError },
        { data: feesData },
        { data: resultsData },
        { data: attendanceData }
      ] = await Promise.all([
        supabase.from("students").select("*").eq("student_id", studentIdNum).maybeSingle(),
        supabase.from("fees").select("id, month, total_amount, status, created_at").eq("student_id", studentIdNum),
        supabase.from("results").select("id, marks_obtained, total_marks, grade").eq("student_id", studentIdNum),
        supabase.from("attendance").select("status").eq("student_id", studentIdNum)
      ]);

      if (studentError) throw studentError;

      if (!studentData) {
        setStudent(null);
        setError("Student not found in database.");
        return;
      }

      // ✅ Success - Populate States
      setStudent(studentData);
      setFees(feesData || []);
      setResults(resultsData || []);
      
      const attRecords = attendanceData || [];
      setAttendance({
        present: attRecords.filter((a: any) => a.status === "Present").length,
        total: attRecords.length
      });
      
      toast.success(`Profile loaded: ${studentData.full_name}`);

    } catch (err: any) {
      console.error("Critical Error:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchStudentData();
  }, [id, fetchStudentData]);

  // Photo Upload Handler
  const uploadPhoto = async (event: any) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;
      
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from("student-photos").upload(filePath, file);
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from("student-photos").getPublicUrl(filePath);
      const newPhotoUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("students")
        .update({ photo_url: newPhotoUrl })
        .eq("student_id", Number(id));
        
      if (updateError) throw updateError;
      
      setStudent((prev: any) => ({ ...prev, photo_url: newPhotoUrl }));
      toast.success("Photo updated successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  // Calculations
  const attendanceRate = attendance.total > 0 
    ? Math.round((attendance.present / attendance.total) * 100) 
    : 0;
  
  const totalFees = fees.reduce((sum, f) => sum + Number(f.total_amount || 0), 0);
  const paidFees = fees.filter(f => f.status === "Paid").reduce((sum, f) => sum + Number(f.total_amount || 0), 0);
  const dueFees = Math.max(0, totalFees - paidFees);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <RefreshCw className="animate-spin mx-auto mb-4 text-indigo-600" size={48} />
        <p className="font-black uppercase tracking-widest text-gray-400 italic">Syncing ASM Database...</p>
      </div>
    </div>
  );

  if (error || !student) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center bg-[#f8fafc]">
      <AlertCircle size={80} className="text-rose-500 mb-6 opacity-20" />
      <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Profile Error</h1>
      <p className="text-gray-400 mt-2 font-medium">{error || "Record Not Found"}</p>
      <div className="flex gap-4 mt-8">
        <button onClick={() => navigate(-1)} className="bg-gray-200 text-gray-700 px-8 py-3 rounded-2xl font-bold italic">Go Back</button>
        <button onClick={() => navigate("/admin/dashboard")} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg">Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Top Header */}
        <div className="flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase text-indigo-600 shadow-sm border border-indigo-50 hover:shadow-md transition-all tracking-widest">
            <ChevronLeft size={16} /> Back to Dashboard
          </button>
          <button onClick={() => window.print()} className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center gap-2 tracking-widest">
            <Printer size={16} /> Print Report
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-indigo-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden border-b-[10px] border-indigo-500/30">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <label className="relative group w-32 h-32 rounded-[2.5rem] bg-white/10 border-4 border-white/20 overflow-hidden flex items-center justify-center backdrop-blur-md cursor-pointer hover:border-white/50 transition-all">
                {uploading ? (
                  <RefreshCw className="animate-spin text-white" size={30} />
                ) : student.photo_url ? (
                  <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User size={60} className="text-white/20" />
                )}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold uppercase tracking-widest mt-1">Upload</span>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={uploadPhoto} disabled={uploading} />
              </label>
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
              <p className={`text-6xl font-black tracking-tighter ${attendanceRate >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {attendanceRate}%
              </p>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* Content Section */}
        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* Info Sidebar */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50">
              <h3 className="font-black uppercase text-[11px] text-gray-400 tracking-widest mb-8 flex items-center gap-2 italic">Student Dossier</h3>
              <InfoItem icon={User} label="Student ID" value={student.student_id} />
              <InfoItem icon={User} label="Father Name" value={student.father_name} />
              <InfoItem icon={Phone} label="Contact Support" value={student.contact_number} />
              <InfoItem icon={MapPin} label="Address" value={student.address} />
            </div>
          </div>

          {/* Fees Main */}
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
                  <StatCard title="Due" value={`₹${dueFees.toLocaleString()}`} color={dueFees > 0 ? "text-rose-600" : "text-emerald-600"} />
                </div>

                <div className="overflow-x-auto">
                  {fees.length === 0 ? (
                    <div className="py-12 text-center opacity-20 italic font-black uppercase text-xs tracking-widest">No matching ledger entries.</div>
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
                        {fees.map((fee: any) => (
                          <tr key={fee.id} className="bg-gray-50/80 hover:bg-white transition-all rounded-[1.5rem] group border border-transparent hover:border-indigo-100 shadow-sm">
                            <td className="px-6 py-5 rounded-l-[1.5rem] font-black text-gray-900 uppercase text-xs italic">{fee.month || "Current"}</td>
                            <td className="px-6 py-5 font-black text-indigo-600 text-lg">₹{Number(fee.total_amount).toLocaleString()}</td>
                            <td className="px-6 py-5 rounded-r-[1.5rem] text-right">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${fee.status === "Paid" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600 animate-pulse"}`}>
                                {fee.status || "Pending"}
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

// Sub-components
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
    <p className={`text-xl md:text-2xl font-black ${color} tracking-tighter leading-none`}>{value}</p>
  </div>
);

export default StudentProfile;
