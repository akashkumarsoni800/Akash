import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { toast } from "sonner";
import {
 User, Phone, MapPin, ChevronLeft, Printer, RefreshCw, AlertCircle, Download, 
  CreditCard, ShieldCheck, Zap, Info, 
  Star, Layout, Camera, Fingerprint,
  ArrowUpRight, ArrowDownRight, Wallet,
  CalendarDays, BookOpen, GraduationCap, Award, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StudentICard from "../../components/shared/StudentICard";

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

   if (!id || id === "undefined" || id === "null") {
    throw new Error("Student ID missing in URL");
   }

   const studentIdNum = Number(id);
   if (isNaN(studentIdNum)) {
    throw new Error(`Invalid ID format: "${id}" is not a number`);
   }

   const [
    { data: studentData, error: studentError },
    { data: feesData, error: feesError },
    { data: resultsData, error: resultsError },
    { data: attendanceData, error: attendanceError }
   ] = await Promise.all([
    supabase.from("students").select("*").eq("student_id", studentIdNum).maybeSingle(),
    supabase.from("fees").select("*").eq("student_id", studentIdNum).order('updated_at', { ascending: false }),
    supabase.from("results").select("*, exams(title)").eq("student_id", studentIdNum).order('uploaded_at', { ascending: false }),
    supabase.from("attendance").select("status").eq("student_id", studentIdNum)
   ]);

   if (studentError) throw studentError;
   if (feesError) console.error("Fees fetch error:", feesError);
   if (resultsError) console.error("Results fetch error:", resultsError);
   if (attendanceError) console.error("Attendance fetch error:", attendanceError);

   if (!studentData) {
    setStudent(null);
    setError("Student not found in database.");
    return;
   }

   setStudent(studentData);
   setFees(feesData || []);
   setResults(resultsData || []);
   
   const att = attendanceData || [];
   setAttendance({
    present: att.filter((a: any) => a.status === "Present").length,
    total: att.length
   });
   
   toast.success(`Profile Paid: ${studentData.full_name}`);

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

    const { error: updateError } = await supabase.rpc('update_student_profile_photo', {
      target_student_id: Number(id),
      new_photo_url: newPhotoUrl
    });
    
   if (updateError) throw updateError;
   
   setStudent((prev: any) => ({ ...prev, photo_url: newPhotoUrl }));
   toast.success("Biometric capture successful!");
  } catch (e: any) {
   console.error("Upload Error Details:", e);
   toast.error(`Capture Failed: ${e.message}`);
  } finally {
   setUploading(false);
  }
 };

 const attendanceRate = attendance.total > 0 
  ? Math.round((attendance.present / attendance.total) * 100) 
  : 0;
 
 const totalFees = fees.reduce((sum, f) => sum + Number(f.total_amount || 0), 0);
 const paidFees = fees.filter(f => f.status === "Paid").reduce((sum, f) => sum + Number(f.total_amount || 0), 0);
 const dueFees = Math.max(0, totalFees - paidFees);

 if (loading && !student) return (
   <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
    <div className="relative">
      <RefreshCw size={60} className="animate-spin text-purple-600/20"/>
      <Fingerprint size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-600" />
    </div>
    <p className="font-black  text-slate-400 text-[10px] mt-8 text-center px-10">Loading Profile...</p>
   </div>
 );

 if (error || !student) return (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-12 text-center">
   <div className="w-32 h-32 bg-rose-50 rounded-[5px] flex items-center justify-center text-rose-500 mb-10 shadow-inner">
     <AlertCircle size={60} />
   </div>
   <h1 className="text-5xl font-black text-slate-900  uppercase"> Error</h1>
   <p className="text-slate-400 mt-4 font-black tracking-widest text-xs">{error || "Student not found"}</p>
   <div className="flex gap-6 mt-12">
    <button onClick={() => navigate(-1)} className="bg-white border border-slate-200 text-slate-900 px-10 py-5 rounded-[5px] font-black text-[10px] tracking-widest shadow-sm hover:shadow-2xl active:scale-95 tracking-widest transition-all ">Go Back</button>
    <button onClick={() => navigate("/admin/dashboard")} className="bg-slate-900 text-white px-10 py-5 rounded-[5px] font-black text-[10px] tracking-widest shadow-2xl hover:bg-indigo-600 transition-all ">Dashboard</button>
   </div>
  </div>
 );

 return (
  <div className="min-h-screen bg-slate-50 py-12 px-1 md:px-2 pb-32 font-inter">
   <div className="max-w-full mx-auto space-y-12">
    
    {/* --- TOP ACTIONS --- */}
    <div className="flex justify-between items-center no-print">
     <div className="flex gap-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-4 bg-white border border-slate-100 px-8 py-5 rounded-[5px] font-black text-[10px] text-slate-900 shadow-sm hover:shadow-2xl active:scale-95 tracking-widest transition-all ">
       <ChevronLeft size={18} /> Back
      </button>
      <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-5 rounded-[5px] font-black text-[10px] shadow-2xl flex items-center gap-4 hover:bg-indigo-600 transition-all ">
       <Printer size={18} /> Print Profile
      </button>
     </div>
     <div className="bg-white px-6 py-3 rounded-full border border-slate-100 shadow-sm flex items-center gap-3">
       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
       <p className="text-[10px] font-black text-slate-400 tracking-widest "> Live</p>
     </div>
    </div>

    {/* --- PROFILE TERMINAL --- */}
    <motion.div 
     initial={{ opacity: 0, scale: 0.95 }}
     animate={{ opacity: 1, scale: 1 }}
     className="bg-indigo-950 rounded-[5px] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border-b-[12px] border-indigo-600/30 group"
    >
     <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500 opacity-10 blur-[100px] rounded-full -mr-40 -mt-40 transition-transform duration-[5s] group-hover:scale-110 pointer-events-none"></div>
     
     <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
      <div className="flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
       <label className="relative group w-48 h-48 rounded-[5px] bg-white/5 border-[6px] border-white/10 overflow-hidden flex items-center justify-center backdrop-blur-md cursor-pointer hover:border-indigo-400/50 hover:shadow-[0_0_50px_rgba(129,140,248,0.3)] transition-all flex-shrink-0">
        {uploading ? (
         <RefreshCw className="animate-spin text-white" size={40} />
        ) : student.photo_url ? (
         <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover transition-all duration-700" />
        ) : (
         <User size={80} className="text-white/10" />
        )}
        <div className="absolute inset-0 bg-indigo-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
         <Camera size={30} className="text-indigo-400" />
         <span className="text-white text-[9px] font-black  mt-3">Update Photo</span>
        </div>
        <input type="file" className="hidden" accept="image/*" onChange={uploadPhoto} disabled={uploading} />
       </label>
       
       <div className="space-y-6">
        <div className="inline-flex items-center gap-3 bg-emerald-500/20 text-emerald-400 px-6 py-2 rounded-full border border-emerald-500/30 shadow-lg backdrop-blur-md">
          <ShieldCheck size={14} />
          <span className="text-[10px] font-black  ">Verified Student</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black  leading-none uppercase">{student.full_name}</h1>
        <div className="flex flex-wrap justify-center md:justify-start gap-5">
          <div className="bg-white/5 px-6 py-2.5 rounded-[5px] text-[11px] font-black border border-white/5  flex items-center gap-3"><BookOpen size={14} className="text-indigo-400" /> Class: {student.class_name}</div>
          <div className="bg-white/5 px-6 py-2.5 rounded-[5px] text-[11px] font-black border border-white/5  flex items-center gap-3"><GraduationCap size={14} className="text-indigo-400" /> Roll: {student.roll_no}</div>
        </div>
       </div>
      </div>

      <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[5px] border border-white/10 text-center min-w-[280px] shadow-2xl relative overflow-hidden group/stat transition-all hover:bg-white/10">
       <div className="absolute inset-0 bg-indigo-500/5 group-hover/stat:bg-indigo-500/10 transition-colors"></div>
       <p className="text-[11px] font-black text-indigo-300 mb-4  relative z-10 leading-none">Attendance Rate</p>
       <p className={`text-8xl font-black relative z-10 leading-none transition-colors duration-500 ${attendanceRate >= 75 ? 'text-emerald-400 group-hover/stat:text-emerald-300' : 'text-rose-400 group-hover/stat:text-rose-300'}`}>
        {attendanceRate}%
       </p>
       <div className="mt-8 flex items-center justify-center gap-3 relative z-10">
         <CalendarDays size={14} className="text-indigo-400" />
         <p className="text-[9px] font-black text-indigo-300/40 tracking-widest ">Attendance Data</p>
       </div>
      </div>
     </div>
    </motion.div>

    {/* --- CONTENT SEGMENTATION --- */}
    <div className="grid lg:grid-cols-5 gap-10">
     
     {/* --- LEFT: DOSSIER SIDEBAR --- */}
     <div className="lg:col-span-2 space-y-10">
      <motion.div 
       initial={{ opacity: 0, x: -20 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ delay: 0.2 }}
       className="bg-white rounded-[5px] p-12 shadow-sm border border-slate-100 space-y-12 relative overflow-hidden group"
      >
       <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
       <div className="flex items-center gap-5 relative z-10 border-b border-slate-50 pb-10">
         <div className="w-12 h-12 bg-slate-900 rounded-[5px] flex items-center justify-center text-white shadow-2xl active:scale-95 tracking-widest">
          <Fingerprint size={24} />
         </div>
         <h3 className="font-black text-[12px] text-slate-900  uppercase">Student Details</h3>
       </div>
       
       <div className="space-y-10 relative z-10">
        <DossierItem icon={User} label="School ID" value={student.student_id} />
        <DossierItem icon={User} label="Father's Name" value={student.father_name} />
        <DossierItem icon={Phone} label="Contact Number" value={student.contact_number} />
        <DossierItem icon={MapPin} label="Home Address" value={student.address} />
       </div>

       <div className="pt-8 border-t border-slate-50 opacity-30 flex items-center justify-center gap-3">
         <ShieldCheck size={14} />
         <p className="text-[8px] font-black  ">Secure Data </p>
       </div>
      </motion.div>

      {/* IDENTITY CARD TERMINAL */}
      <motion.div 
       initial={{ opacity: 0, x: -20 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ delay: 0.3 }}
       className="bg-white rounded-[5px] shadow-sm border border-slate-100 overflow-hidden group"
      >
        <div className="p-10 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
         <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-indigo-900 rounded-[5px] flex items-center justify-center text-white shadow-lg"><CreditCard size={20}/></div>
           <h3 className="font-black text-[10px] text-slate-900 uppercase">Student ID Card</h3>
         </div>
         <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[8px] font-black tracking-widest ">ASM-001-ST</div>
        </div>
        <div className="p-12 flex justify-center bg-slate-50/50 backdrop-blur-sm relative overflow-hidden">
         <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors"></div>
         <div className="relative z-10 scale-90 md:scale-100 transition-transform group-hover:scale-[1.02] duration-700">
          <StudentICard student={student} />
         </div>
        </div>
        <div className="px-10 py-6 bg-white border-t border-slate-50 flex justify-center">
         <button className="text-[9px] font-black text-indigo-600 hover:text-indigo-900 transition-colors">Update Photo →</button>
        </div>
      </motion.div>
     </div>

     {/* --- RIGHT: FINANCIAL & RESULTS --- */}
     <div className="lg:col-span-3 space-y-10">
       <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-[5px] shadow-sm border border-slate-100 overflow-hidden group"
       >
        <div className="p-12 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
          <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
             <Wallet size={28}/>
           </div>
           <div className="space-y-1">
             <h3 className="font-black text-[14px] text-slate-900 leading-none uppercase">Financial<br/><span className="text-indigo-600 uppercase">Summary</span></h3>
             <p className="text-[8px] font-black text-slate-400 tracking-widest leading-none">Fee Summary</p>
           </div>
          </div>
          <div className="flex gap-4">
           <button className="w-12 h-12 bg-slate-50 rounded-[5px] flex items-center justify-center text-slate-400 border border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Download size={20} /></button>
          </div>
        </div>
        
        <div className="p-12 space-y-12">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <MiniStatCard label="Total Fees" value={`₹${totalFees.toLocaleString()}`} icon={BookOpen} color="slate" />
          <MiniStatCard label="Total Paid" value={`₹${paidFees.toLocaleString()}`} icon={ArrowUpRight} color="emerald" />
          <MiniStatCard label="Balance Due" value={`₹${dueFees.toLocaleString()}`} icon={ArrowDownRight} color={dueFees > 0 ? "rose" : "emerald"} />
         </div>

         <div className="space-y-6">
          <div className="flex items-center justify-between px-6 border-b border-slate-50 pb-4">
            <p className="text-[10px] font-black text-slate-300  ">Recent Fee Records</p>
          </div>
          
          <div className="space-y-4">
           {fees.length === 0 ? (
            <div className="py-24 text-center opacity-10">
             <CreditCard size={80} className="mx-auto mb-6 text-slate-500" />
             <p className="font-black text-xs ">No Fee Records Found</p>
            </div>
           ) : (
            fees.map((fee: any) => (
             <div key={fee.id} className="bg-slate-50/50 hover:bg-white transition-all rounded-[5px] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-transparent hover:border-indigo-100 hover:shadow-2xl active:scale-95 tracking-widest group/row">
               <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white rounded-[5px] flex items-center justify-center text-slate-300 group-hover/row:text-indigo-600 border border-slate-100 shadow-sm transition-colors font-black text-xs ">
                  {fee.month ? fee.month.charAt(0) : 'C'}
                 </div>
                 <div>
                   <p className="text-[9px] font-black text-slate-400 tracking-widest mb-1">Month</p>
                   <h4 className="font-black text-slate-900 text-lg ">{fee.month || "Current Cycle"}</h4>
                 </div>
                </div>
                <div className="flex items-center gap-12">
                 <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 tracking-widest mb-1">Amount</p>
                   <p className="font-black text-indigo-600 text-2xl  leading-none">₹{Number(fee.total_amount).toLocaleString()}</p>
                 </div>
                 <span className={`px-6 py-2.5 rounded-[5px] text-[10px] font-black  shadow-sm border transition-all ${
                   fee.status === "Paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100 animate-pulse"
                 }`}>
                   {fee.status || "Pending"}
                 </span>
                </div>
              </div>
             ))
            )}
           </div>
          </div>
         </div>
        </motion.div>

        {/* --- ACADEMIC PERFORMANCE --- */}
        <motion.div 
         initial={{ opacity: 0, y: 30 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.5 }}
         className="bg-white rounded-[5px] shadow-sm border border-slate-100 overflow-hidden group"
        >
         <div className="p-12 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
           <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-200">
              <GraduationCap size={28}/>
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-[14px] text-slate-900 leading-none uppercase">Academic<br/><span className="text-emerald-600 uppercase">Performance</span></h3>
              <p className="text-[8px] font-black text-slate-400 tracking-widest leading-none">Exam Results</p>
            </div>
           </div>
         </div>
         
         <div className="p-12 space-y-8">
           {results.length === 0 ? (
            <div className="py-24 text-center opacity-10">
             <Award size={80} className="mx-auto mb-6 text-slate-500" />
             <p className="font-black text-xs ">No Result Records Found</p>
            </div>
           ) : (
            results.map((res: any) => (
             <div key={res.id} className="bg-slate-50/50 hover:bg-white transition-all rounded-[5px] p-10 border border-transparent hover:border-emerald-100 hover:shadow-2xl active:scale-95 tracking-widest group/res">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-4">
                 <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
                  <p className="text-[10px] font-black text-slate-400 tracking-widest ">{res.exams?.title || "Exam Name"}</p>
                 </div>
                 <h4 className="text-3xl font-black text-slate-900 ">{Math.round(res.percentage || 0)}% Aggregate Score</h4>
                </div>
                
                <div className="flex items-center gap-8">
                 <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 tracking-widest mb-1">Status</p>
                  <span className={`px-6 py-2 rounded-[5px] text-[10px] font-black border ${
                   res.status === 'PASS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                   {res.status}
                  </span>
                 </div>
                 <div className="w-px h-12 bg-slate-100 hidden md:block" />
                 <button className="p-4 bg-white border border-slate-100 rounded-[5px] text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                  <ArrowRight size={20} />
                 </button>
                </div>
               </div>
               
               <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                {(res.marks_data as any[])?.slice(0, 4).map((m: any, i: number) => (
                 <div key={i} className="bg-white/50 p-4 rounded-[5px] border border-slate-50">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter truncate">{m.subject}</p>
                  <p className="text-lg font-black text-slate-900">{m.marks}/{m.max_marks}</p>
                 </div>
                ))}
               </div>
             </div>
            ))
           )}
         </div>
        </motion.div>
      </div>
     </div>
    </div>
   </div>
 );
};

// Sub-components
const DossierItem = ({ icon: Icon, label, value }: any) => (
 <div className="flex items-start gap-6 group/item">
  <div className="bg-slate-50 p-4 rounded-[5px] text-slate-300 group-hover/item:bg-indigo-50 group-hover/item:text-indigo-600 transition-all border border-slate-50 shadow-inner">
    <Icon size={22} />
  </div>
  <div className="space-y-1">
   <p className="text-[9px] font-black text-slate-300  group-hover/item:text-indigo-400 transition-colors leading-none">{label}</p>
   <p className="font-black text-slate-900 text-md tracking-tight ">{value || "Restricted Info"}</p>
  </div>
 </div>
);

const MiniStatCard = ({ label, value, icon: Icon, color }: any) => {
  const colorMap = {
   slate: "text-slate-400 bg-slate-50 border-slate-100 font-black",
   emerald: "text-emerald-500 bg-emerald-50 border-emerald-100 font-black",
   rose: "text-rose-500 bg-rose-50 border-rose-100 font-black"
  };

  return (
   <div className={`p-8 rounded-[5px] border ${colorMap[color as keyof typeof colorMap]} shadow-inner space-y-4 group hover:shadow-2xl active:scale-95 tracking-widest transition-all duration-500`}>
     <div className="flex items-center justify-between">
      <Icon size={16} className="opacity-40 group-hover:scale-110 transition-transform" />
      <div className={`w-1.5 h-1.5 rounded-full ${color === 'emerald' ? 'bg-emerald-500' : color === 'rose' ? 'bg-rose-500' : 'bg-slate-300'}`} />
     </div>
     <div className="space-y-1">
      <p className="text-[9px] font-black  opacity-40 leading-none">{label}</p>
      <p className="text-2xl font-black  leading-none ">{value}</p>
     </div>
   </div>
  );
};

export default StudentProfile;
