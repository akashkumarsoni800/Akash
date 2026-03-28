import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
 Plus, Search, Users, Calendar, ArrowRight,
 Wallet, Send, RefreshCw, Trash2, CheckCircle,
 ShieldCheck, Zap, Info, Star, ChevronRight, Layout, ChevronDown,
 MessageSquare, Clock, AlertTriangle, Filter, Camera
} from 'lucide-react';
import { 
  useGetAllStudents, 
  useGetFeeHeads, 
  useGetFeeStats, 
  useGetRecentPayments, 
  useGetFeeReminders,
  useAddFeeHead,
  useDeleteFeeHead,
  useAssignFees
} from '../../hooks/useQueries';

const ManageFees = () => {
 const [newHeadName, setNewHeadName] = useState('');
 const [selectedStudent, setSelectedStudent] = useState('');
 const [selectedClass, setSelectedClass] = useState('');
 const [month, setMonth] = useState('');
 const [feeValues, setFeeValues] = useState<any>({});
 const [bulkMode, setBulkMode] = useState(false);
  const [remindMonth, setRemindMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showNextMonthPrompt, setShowNextMonthPrompt] = useState(false);
  const [nextMonth, setNextMonth] = useState('');
  const [waSearch, setWaSearch] = useState('');
  const [classFilterWa, setClassFilterWa] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const webcamRef = useRef<any>(null);
  const [WebcamComp, setWebcamComp] = useState<any>(null);

 // ✅ 1. Persistent Data Hooks
 const { data: students = [], isLoading: stdLoading } = useGetAllStudents();
 const { data: feeHeads = [], isLoading: headsLoading } = useGetFeeHeads();
 const { data: feeStats = { totalPending: 0, totalCollected: 0, overdue: 0, collectionRate: 0 }, isLoading: statsLoading } = useGetFeeStats();
 const { data: recentPayments = [], isLoading: paymentsLoading } = useGetRecentPayments();
 const { data: pendingReminders = [], isLoading: remLoading } = useGetFeeReminders(remindMonth);

 // ✅ 2. Mutations
 const addFeeHeadMutation = useAddFeeHead();
 const deleteFeeHeadMutation = useDeleteFeeHead();
 const assignFeesMutation = useAssignFees();

 const [localLoading, setLocalLoading] = useState(false);
 const loading = stdLoading || headsLoading || statsLoading || paymentsLoading || localLoading;

 // Helper for total
 const totalAmountValue = Object.values(feeValues).reduce((sum: number, val: any) => 
  sum + Number(val || 0), 0);

 // Update initial fee values when heads load
 useEffect(() => {
  if (feeHeads.length > 0 && Object.keys(feeValues).length === 0) {
    const initialValues: any = {};
    feeHeads.forEach((h: any) => initialValues[h.id] = 0);
    setFeeValues(initialValues);
  }
  }, [feeHeads]);

  // ✅ Automated Next Month Check
  useEffect(() => {
    const checkNextMonth = async () => {
      const today = new Date();
      const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const nextMonthStr = `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1).toString().padStart(2, '0')}`;
      setNextMonth(nextMonthStr);

      const { count } = await supabase
        .from('fees')
        .select('*', { count: 'exact', head: true })
        .eq('month', nextMonthStr);
      
      if (count === 0) {
        setShowNextMonthPrompt(true);
      }
    };
    checkNextMonth();
    if (typeof window !== "undefined") {
      import("react-webcam").then((mod) => setWebcamComp(() => mod.default));
    }
  }, []);

 const handleAddFeeHead = async () => {
  if (!newHeadName) return toast.error("Enter fee head name");
  addFeeHeadMutation.mutate(newHeadName, {
    onSuccess: () => setNewHeadName('')
  });
 };

 const handleDeleteFeeHead = async (id: string) => {
  if (!window.confirm("Delete this fee head?")) return;
  deleteFeeHeadMutation.mutate(id);
 };

 const handleCloneLastMonthFees = async () => {
  if (!month) return toast.error("Select the target month first");
  
  const [year, mon] = month.split('-').map(Number);
  const prevDate = new Date(year, mon - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${(prevDate.getMonth() + 1).toString().padStart(2, '0')}`;

  if (!window.confirm(`Clone all pending fees from ${prevMonthStr} to ${month}?`)) return;

  try {
   setLocalLoading(true);
   const { data: prevFees, error: fetchError } = await supabase
    .from('fees')
    .select('student_id, fee_structure, total_amount')
    .eq('month', prevMonthStr);

   if (fetchError) throw fetchError;
   if (!prevFees || prevFees.length === 0) throw new Error(`No records found for ${prevMonthStr}`);

   const newFees = prevFees.map(f => ({
    student_id: f.student_id,
    month: month,
    fee_structure: f.fee_structure,
    total_amount: f.total_amount,
    status: 'Pending'
   }));

   assignFeesMutation.mutate(newFees);
  } catch (error: any) {
   toast.error("Cloning Failed: " + error.message);
  } finally {
   setLocalLoading(false);
  }
 };

  const handlePrepareNextMonth = async () => {
    if (!nextMonth) return;
    
    // Set target month to nextMonth and trigger clone
    setMonth(nextMonth);
    toast.info(`Preparing records for ${nextMonth}...`);
    
    // We can't easily wait for setMonth to reflect, so we use a small delay or pass it directly
    setTimeout(() => {
        handleCloneLastMonthFees(); 
        setShowNextMonthPrompt(false);
    }, 100);
  };

 const handleAssignFee = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!bulkMode && !selectedStudent) return toast.error("Please select a student");
  if (bulkMode && !selectedClass) return toast.error("Please select a class");
  if (!month) return toast.error("Please select a month");
  if (totalAmountValue <= 0) return toast.error("Total fee cannot be zero");

  try {
   let feesToInsert: any[] = [];
   
   if (bulkMode && selectedClass) {
    const classStudents = students.filter((s: any) => s.class_name === selectedClass);
    if (classStudents.length === 0) throw new Error("No students found in this class");

    feesToInsert = classStudents.map((student: any) => ({
     student_id: student.student_id,
     month,
     fee_structure: feeValues,
     total_amount: totalAmountValue,
     status: 'Pending'
    }));
   } else {
    feesToInsert = [{
     student_id: Number(selectedStudent), 
     month,
     fee_structure: feeValues,
     total_amount: totalAmountValue,
     status: 'Pending'
    }];
   }

   assignFeesMutation.mutate(feesToInsert, {
    onSuccess: () => {
      setSelectedStudent('');
      setMonth('');
      setFeeValues(Object.fromEntries(feeHeads.map((h: any) => [h.id, 0])));
    }
   });
  } catch (error: any) {
   toast.error("Assignment Failed: " + error.message);
  }
 };

 const handleFeeValueChange = (headId: string, value: string) => {
  setFeeValues({ ...feeValues, [headId]: value });
 };

 const handleSendReminder = (fee: any) => {
  const student = fee.students;
  if (!student?.contact_number) return toast.error("No contact number found");

  // ✅ Clean Phone Number (Remove non-digits and ensure 91 prefix)
  let phone = student.contact_number.replace(/\D/g, ''); 
  if (phone.length === 10) phone = `91${phone}`;
  else if (phone.length === 12 && phone.startsWith('91')) phone = phone;
  else if (phone.length > 10 && !phone.startsWith('91')) phone = `91${phone.slice(-10)}`;

  const breakdown = Object.entries(fee.fee_structure || {})
   .filter(([_, val]) => Number(val) > 0)
    .map(([headId, val]) => {
      const head = feeHeads.find((h: any) => h.id.toString() === headId.toString());
      return `• ${head ? head.name.toUpperCase() : 'FEE'}: ₹${val}`;
    })
   .join('%0A');

  const schoolName = localStorage.getItem('current_school_name') || 'Adarsh Shishu Mandir';
  const message = `*📄 FEE REMINDER - ${schoolName.toUpperCase()}*%0A%0A*Student:* ${student.full_name}%0A*Month:* ${fee.month}%0A%0A*PENDING BREAKDOWN:*%0A${breakdown}%0A%0A*TOTAL PAYABLE:* ₹${fee.total_amount}%0A*STATUS:* ${fee.status}%0A%0A_Please pay before the 10th of the month to avoid late fees._%0A_Thank you, Management_`;
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleBulkReminders = () => {
    if (!pendingReminders.length) return;
    pendingReminders.forEach((fee: any, idx: number) => {
      setTimeout(() => handleSendReminder(fee), idx * 1500);
    });
    toast.success(`Sending ${pendingReminders.length} reminders...`);
  };

  const handleClassBulkReminders = () => {
    if (!classFilterWa) return;
    const classStudents = students.filter((s: any) => s.class_name === classFilterWa);
    if (classStudents.length === 0) {
      toast.error(`No students found in Class ${classFilterWa}`);
      return;
    }
    
    classStudents.forEach((student: any, idx: number) => {
      setTimeout(() => {
        handleSendReminder({ 
          students: student, 
          total_amount: '---', 
          month: 'Adhoc', 
          status: 'Pending', 
          fee_structure: {} 
        });
      }, idx * 1500);
    });
    toast.success(`Broadcasting to ${classStudents.length} students in Class ${classFilterWa}...`);
  };

 if (loading && students.length === 0) {
  return (
   <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
     <div className="relative">
      <RefreshCw size={60} className="animate-spin text-blue-600/20"/>
      <Wallet size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
     </div>
     <p className="font-black  text-slate-400 text-[10px] mt-8 text-center px-10 uppercase">Loading Fees...</p>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-[var(--bg-main)] py-12 px-1 md:px-2 pb-32">
   <div className="max-w-full mx-auto space-y-12">
    
    {/* --- HEADER --- */}
    <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
       <h1 className="text-5xl md:text-7xl font-black text-slate-900  leading-none uppercase">
        Fee<br/>
        <span className="text-[var(--accent-admin)]">Management</span>
       </h1>
       <p className="text-slate-400 font-black text-[10px] mt-4 flex items-center justify-center md:justify-start gap-2 uppercase">
        <ShieldCheck size={12} className="text-[var(--accent-admin)]" /> Manage school fees and payments
       </p>
      </motion.div>

      <div className="flex bg-white p-2 rounded-[5px] border border-slate-100 shadow-sm relative z-20">
       <button 
        onClick={() => setBulkMode(false)} 
        className={`px-10 py-4 rounded-[5px] font-black text-[10px] tracking-widest transition-all uppercase ${!bulkMode ? 'bg-slate-900 text-white shadow-2xl active:scale-95 tracking-widest' : 'text-slate-400 hover:text-blue-600'}`}>
        Single 
       </button>
       <button 
        onClick={() => setBulkMode(true)} 
        className={`px-10 py-4 rounded-[5px] font-black text-[10px] tracking-widest transition-all uppercase ${bulkMode ? 'bg-slate-900 text-white shadow-2xl active:scale-95 tracking-widest' : 'text-slate-400 hover:text-blue-600'}`}>
        Whole Class
       </button>
      </div>
    </div>

    {/* --- MAIN INTERFACE --- */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
          {/* 🟢 AUTOMATION BANNER */}
        {showNextMonthPrompt && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10 p-8 bg-blue-600 rounded-[5px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-blue-200 border-none relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <Clock size={28} className="text-white" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-black uppercase tracking-tight">Quick Setup</h3>
                <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mt-1">Fees for {nextMonth} are not prepared yet.</p>
              </div>
            </div>
            <button 
              onClick={handlePrepareNextMonth}
              className="w-full md:w-auto px-10 py-4 bg-white text-blue-600 rounded-[5px] font-black text-[10px] tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-xl uppercase relative z-10"
            >
              Prepare {nextMonth} Records Now
            </button>
          </motion.div>
        )}

        {/* --- LEFT: MAIN ASSIGNMENT CONSOLE --- */}
     <div className="lg:col-span-2 space-y-10">
       {/* 🔵 FEE ASSIGNMENT FORM */}
       <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-10 md:p-14 relative overflow-hidden group"
       >
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 blur-3xl rounded-full -mr-40 -mt-40 transition-transform duration-[4s] group-hover:scale-110"></div>
        
        <form onSubmit={handleAssignFee} className="space-y-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-10 border-b border-slate-50">
           <div className="space-y-4 text-center md:text-left">
            <h2 className="text-4xl font-black text-slate-900  leading-none uppercase">
             Add Fee<br/>
             <span className="text-[var(--accent-admin)]">Record</span>
            </h2>
            <p className="text-[10px] font-black text-slate-400 tracking-widest leading-none mt-1 uppercase">Assign fees to students </p>
           </div>
           <div className="px-6 py-2.5 bg-blue-50 rounded-[5px] text-[10px] font-black text-blue-600 tracking-widest border border-blue-100 shadow-sm uppercase">
             Active
           </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400  ml-2 uppercase">Target Class/Candidate</label>
             <div className="relative group/input">
              <Users className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-400 transition-colors" size={20} />
              {bulkMode ? (
               <select className="premium-input pl-16 appearance-none uppercase" value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)}>
                 <option value="">Select Target Class</option>
                 {[...new Set(students.map((s: any) => s.class_name))].map((c: any) => <option key={c} value={c}>Class {c} Division</option>)}
               </select>
              ) : (
               <select className="premium-input pl-16 appearance-none uppercase" value={selectedStudent} onChange={(e)=>setSelectedStudent(e.target.value)}>
                 <option value="">Search Student</option>
                 {students.map((s: any) => <option key={s.student_id} value={s.student_id}>{s.full_name} — Roll #{s.roll_no}</option>)}
               </select>
              )}
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
             </div>
           </div>
           <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400  ml-2 uppercase">Select Month</label>
             <div className="relative group/input">
              <Calendar className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-400 transition-colors" size={20} />
              <input type="month" className="premium-input pl-16 uppercase" value={month} onChange={(e)=>setMonth(e.target.value)} required />
             </div>
           </div>
          </div>

          <div className="bg-slate-50/50 p-10 rounded-[5px] border border-slate-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 opacity-20 blur-3xl"></div>
           <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-6 relative z-10">
             <div className="w-10 h-10 bg-white rounded-[5px] flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
              <Plus size={20} />
             </div>
             <h3 className="text-[10px] font-black text-slate-400  leading-none uppercase">Fee Details</h3>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
              {feeHeads.map((head: any) => (
               <div key={head.id} className="bg-white p-6 rounded-[5px] flex justify-between items-center border border-slate-100 hover:border-blue-200 transition-all hover:shadow-2xl active:scale-95 tracking-widest hover:-translate-y-1 group/item relative">
                <span className="font-black text-[10px] text-slate-400 tracking-widest group-hover/item:text-blue-600 transition-colors uppercase">{head.name}</span>
                <div className="flex items-center gap-3">
                 <span className="text-slate-200 font-black text-[9px] uppercase">INR</span>
                 <input type="number" placeholder="0" className="w-24 text-right font-black text-slate-900 border-none focus:ring-0 text-xl bg-transparent uppercase" 
                  value={feeValues[head.id] || ''}
                  onChange={(e) => handleFeeValueChange(head.id, e.target.value)} />
                 <button type="button" onClick={() => handleDeleteFeeHead(head.id)} className="ml-2 p-1 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover/item:opacity-100">
                  <Trash2 size={12} />
                 </button>
                </div>
               </div>
              ))}
              {/* Add New Fee Head */}
              <div className="bg-blue-50/30 p-4 rounded-[5px] border border-dashed border-blue-200 flex gap-4 items-center">
                <input 
                  type="text" 
                  placeholder="New Fee Head..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase"
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeeHead();
                    }
                  }}
                />
                <button type="button" onClick={handleAddFeeHead} className="p-2 bg-blue-600 text-white rounded-[5px] hover:bg-slate-900 transition-colors shadow-lg active:scale-95">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button 
                type="button" 
                onClick={handleCloneLastMonthFees}
                className="px-6 py-3 border border-blue-100 rounded-[5px] text-[9px] font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 uppercase"
              >
                <RefreshCw size={14} /> COPY LAST MONTH'S DATA 
              </button>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[5px] shadow-2xl relative overflow-hidden group/btn flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover/btn:opacity-10 transition-opacity" />
           <div className="text-center md:text-left mb-0 relative z-10">
             <p className="text-[10px] font-black text-blue-400 mb-2 uppercase">Total Amount</p>
             <h2 className="text-5xl md:text-6xl font-black text-white leading-none uppercase">₹ {totalAmountValue.toLocaleString()}</h2>
           </div>
           <button disabled={loading} className="premium-button-admin bg-white text-slate-900 hover:bg-blue-600 hover:text-white border-none shadow-2xl active:scale-95 tracking-widest relative z-10 px-12 uppercase">
             {loading ? <RefreshCw size={24} className="animate-spin" /> : <ShieldCheck size={24} />}
             {loading ? 'Processing...' : 'Save Fee Record'}
           </button>
          </div>
        </form>
       </motion.div>

       {/* 🟡 4. QUICK SCAN HUB */}
       <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="premium-card p-10 bg-slate-900 text-white overflow-hidden group relative"
       >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/30 blur-3xl rounded-full transition-opacity group-hover:opacity-100 opacity-50"></div>
        <div className="flex items-center gap-6 mb-8 relative z-10">
          <div className="w-12 h-12 bg-blue-600 rounded-[5px] flex items-center justify-center text-white shadow-2xl">
           <Zap size={24} className="animate-pulse" />
          </div>
          <div>
           <h2 className="text-2xl font-black uppercase leading-none">Quick Lookup</h2>
           <p className="text-[9px] font-black text-blue-400 tracking-widest mt-1 uppercase">Scan or Search Student</p>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <p className="text-[10px] font-black text-slate-400 leading-relaxed uppercase">Instantly load student profile to assign fees or view records.</p>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setShowScanner(true)}
              className="flex-1 py-4 bg-blue-600 text-white rounded-[5px] font-black text-[10px] tracking-widest hover:bg-blue-500 transition-all shadow-xl uppercase flex items-center justify-center gap-2"
            >
              <Camera size={16} /> Open Scanner
            </button>
            <button className="flex-1 py-4 bg-white/10 text-white rounded-[5px] font-black text-[10px] tracking-widest hover:bg-white/20 transition-all uppercase">
              Manual ID Look
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showScanner && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-[5px] p-10 w-full max-w-xl shadow-2xl space-y-8 relative overflow-hidden">
                <div className="flex justify-between items-center text-slate-900">
                  <h3 className="text-2xl font-black uppercase">Scanning...</h3>
                  <button onClick={() => setShowScanner(false)} className="p-3 bg-slate-50 rounded-[5px] text-slate-400 hover:text-slate-600 transition-all">
                    <AlertTriangle size={24} className="text-rose-500" />
                  </button>
                </div>
                
                <div className="relative rounded-[5px] overflow-hidden bg-slate-100 shadow-inner aspect-video flex items-center justify-center text-slate-900">
                  {WebcamComp ? (
                    <WebcamComp
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full"
                    />
                  ) : (
                    <div className="text-slate-300 font-black animate-pulse uppercase text-xs">Initializing...</div>
                  )}
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-scan-line" />
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">Searching student in database...</p>
                  <button 
                    onClick={() => {
                      toast.success("Student Identified: Akash Soni");
                      setSelectedStudent('123'); // Example ID
                      setShowScanner(false);
                    }}
                    className="w-full py-6 bg-slate-900 text-white rounded-[5px] font-black tracking-widest text-xs shadow-2xl hover:bg-blue-600 transition-all uppercase"
                  >
                    Simulation: Found Student
                  </button>
                  <button onClick={() => setShowScanner(false)} className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors">Cancel Scan</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
       </motion.div>

       {/* 🟢 WHATSAPP REMINDERS HUB */}
       <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-10 md:p-14 relative overflow-hidden"
       >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-[5px] flex items-center justify-center text-emerald-600">
             <MessageSquare size={24} />
            </div>
            <div>
             <h2 className="text-3xl font-black text-slate-900 uppercase">WhatsApp Reminders</h2>
             <p className="text-[10px] font-black text-slate-300 tracking-widest leading-none uppercase">PENDING FEE ALERTS</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-10 bg-slate-50 p-6 rounded-[5px] border border-slate-100">
           <div className="flex-1 min-w-[200px] flex items-center gap-3 bg-white p-3 rounded-[5px] border border-slate-100 shadow-inner">
             <Filter size={16} className="text-emerald-500 ml-2" />
             <select 
               value={classFilterWa}
               onChange={(e) => setClassFilterWa(e.target.value)}
               className="w-full bg-transparent border-none text-[10px] font-black focus:ring-0 uppercase appearance-none"
             >
               <option value="">Choose Class for Bulk</option>
               {[...new Set(students.map((s: any) => s.class_name))].sort().map(c => (
                 <option key={c} value={c}>Class {c}</option>
               ))}
             </select>
           </div>
           
           {classFilterWa && (
             <button 
               onClick={handleClassBulkReminders}
               className="px-8 py-4 bg-slate-900 text-white rounded-[5px] text-[10px] font-black tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 uppercase shadow-xl animate-bounce-short"
             >
               <Send size={14} /> Send to All in Class {classFilterWa}
             </button>
           )}
 
           <div className="h-10 w-px bg-slate-200 mx-2 hidden md:block" />
 
           <div className="flex items-center gap-4 bg-white p-3 rounded-[5px] border border-slate-100 shadow-inner">
             <Calendar size={16} className="text-slate-400 ml-2" />
             <input 
               type="month" 
               className="bg-transparent border-none text-[10px] font-black focus:ring-0 uppercase" 
               value={remindMonth}
               onChange={(e) => setRemindMonth(e.target.value)}
             />
           </div>
 
           <button 
             onClick={handleBulkReminders}
             className="px-6 py-4 bg-emerald-600 text-white rounded-[5px] text-[10px] font-black tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 uppercase shadow-lg shadow-emerald-50 active:scale-95"
           >
             <Zap size={10} /> Send Pending ({pendingReminders.length})
           </button>
         </div>

        <div className="space-y-4">
          {/* ✅ 1. Quick Individual Reminder Search */}
          <div className="relative group/search mb-8">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/search:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by student name or roll number..."
              value={waSearch}
              onChange={(e) => setWaSearch(e.target.value)}
              className="premium-input text-sm pl-16 py-4 bg-slate-50 border-slate-100 hover:border-emerald-200 focus:border-emerald-400 focus:ring-emerald-50"
            />
          </div>

          {waSearch.length > 0 && (
            <div className="mb-10 space-y-4 max-h-64 overflow-y-auto no-scrollbar">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-4">Search Results (Found: {students.filter((s:any) => s.full_name?.toLowerCase().includes(waSearch.toLowerCase()) || s.roll_no?.includes(waSearch)).length})</p>
              {students.filter((s:any) => s.full_name?.toLowerCase().includes(waSearch.toLowerCase()) || s.roll_no?.includes(waSearch)).slice(0, 3).map((student: any) => (
                <div key={student.student_id} className="p-5 bg-white border border-emerald-100 rounded-[5px] flex items-center justify-between group/res hover:shadow-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[5px] bg-slate-50 flex items-center justify-center font-black text-xs text-slate-400">
                      {student.class_name}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm leading-none uppercase">{student.full_name}</h4>
                      <p className="text-[10px] font-black text-slate-400 mt-1 uppercase">Roll #{student.roll_no}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSendReminder({ students: student, total_amount: '---', month: 'Adhoc', status: 'Pending', fee_structure: {} })}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-[5px] font-black text-[10px] tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 uppercase"
                  >
                    <Send size={12} /> Remind Now
                  </button>
                </div>
              ))}
              {students.filter((s:any) => s.full_name?.toLowerCase().includes(waSearch.toLowerCase()) || s.roll_no?.includes(waSearch)).length === 0 && (
                <p className="text-[10px] font-black text-slate-300 text-center py-4 italic uppercase">No matching students found.</p>
              )}
            </div>
          )}

          {/* ✅ 2. Automated Pending Reminders List */}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-4">Pending Fee Alerts ({pendingReminders.length})</p>
          
          {remLoading ? (
            <div className="py-12 text-center bg-slate-50/50 rounded-[5px] border border-slate-100 flex flex-col items-center gap-4">
              <RefreshCw className="animate-spin text-emerald-500" size={24} />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Fetching pending fees...</p>
            </div>
          ) : pendingReminders.length > 0 ? (
            pendingReminders.map((fee: any) => (
              <div key={fee.id} className="p-6 bg-slate-50 rounded-[5px] flex flex-col sm:flex-row justify-between items-center group hover:bg-white hover:shadow-2xl active:scale-95 tracking-widest transition-all border border-transparent hover:border-emerald-100">
                <div className="flex items-center gap-6 mb-4 sm:mb-0">
                  <div className="w-10 h-10 rounded-[5px] bg-white border border-slate-100 flex items-center justify-center text-slate-300 font-bold text-xs uppercase">
                    {fee.students?.class_name}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm leading-none uppercase">{fee.students?.full_name}</h4>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">Amount: ₹{fee.total_amount} • {fee.month}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleSendReminder(fee)}
                  className="w-full sm:w-auto px-6 py-3 bg-white text-emerald-600 border border-emerald-100 rounded-[5px] font-black text-[10px] tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 uppercase"
                >
                  <Send size={14} /> SEND REMINDER
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center bg-slate-50/50 rounded-[5px] border-2 border-dashed border-slate-100">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic leading-none">No pending fees for this month summary.</p>
            </div>
          )}
        </div>
       </motion.div>
     </div>

     {/* --- RIGHT: INSIGHTS & STATS --- */}
     <div className="space-y-10">
       <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="premium-card p-12 relative overflow-hidden group"
       >
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/50 rounded-full blur-3xl opacity-50 transition-opacity duration-1000 group-hover:opacity-100"></div>
        <h3 className="text-[10px] font-black text-slate-300  mb-12 relative z-10 uppercase">
         Payment Summary
        </h3>
        <div className="space-y-8 relative z-10">
          <div className="p-8 bg-slate-50 rounded-[5px] border border-slate-100 shadow-sm relative overflow-hidden group/card hover:bg-slate-900 transition-all duration-700">
           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600 opacity-0 group-hover/card:opacity-10 blur-2xl transition-opacity"></div>
           <p className="text-[9px] font-black text-slate-400 group-hover/card:text-blue-400 tracking-widest mb-3 uppercase">Total Collected</p>
           <p className="text-4xl font-black text-slate-900 group-hover/card:text-white uppercase">₹{feeStats.totalCollected.toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
           <div className="p-6 bg-slate-50 rounded-[5px] border border-slate-100">
             <p className="text-[8px] font-black text-slate-400 tracking-widest mb-2 uppercase">Pending Payments</p>
             <p className="text-2xl font-black text-slate-900 uppercase">{feeStats.totalPending}</p>
           </div>
           <div className="p-6 bg-slate-50 rounded-[5px] border border-slate-100">
             <p className="text-[8px] font-black text-slate-400 tracking-widest mb-2 uppercase">Late Payments</p>
             <p className="text-2xl font-black text-rose-500 uppercase">{feeStats.overdue}</p>
           </div>
          </div>
        </div>
       </motion.div>

       <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="premium-card p-12 flex flex-col min-h-[500px] relative group"
       >
        <div className="flex items-center justify-between mb-12">
          <h3 className="text-[10px] font-black text-slate-300  uppercase">Recent Payments</h3>
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-200"></div>
        </div>
        <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
          {recentPayments.length > 0 ? recentPayments.map((p: any, idx: number) => (
           <motion.div 
            key={p.id} 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + idx * 0.1 }}
            className="p-6 bg-slate-50/50 rounded-[5px] border border-slate-50 flex justify-between items-center group/item hover:bg-white hover:shadow-2xl hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden"
           >
            <div className="flex items-center gap-5 relative z-10">
              <div className={`w-12 h-12 rounded-[5px] flex items-center justify-center transition-all ${p.status === 'Paid' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600 animate-pulse'}`}>
               {p.status === 'Paid' ? <CheckCircle size={20}/> : <RefreshCw size={20} className="animate-spin" />}
              </div>
              <div>
               <p className="font-black text-[12px] text-slate-800  leading-tight uppercase">{p.students?.full_name}</p>
               <p className="text-[9px] font-black text-slate-400 tracking-widest mt-1.5 uppercase">₹{p.total_amount} • {p.month}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-200 group-hover/item:text-blue-500 transition-transform group-hover/item:translate-x-1 relative z-10" />
           </motion.div>
          )) : (
           <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 py-20">
            <RefreshCw size={60} className="mb-6 animate-spin text-slate-300" />
            <p className="text-[10px] font-black tracking-widest uppercase">Awaiting ...</p>
           </div>
          )}
        </div>
        <button className="mt-10 py-5 bg-slate-50 rounded-[5px] text-[10px] font-black text-slate-400 tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-inner border border-slate-100 uppercase">
          View All Records →
        </button>
       </motion.div>
     </div>
    </div>
   </div>
  </div>
 );
};

export default ManageFees;
