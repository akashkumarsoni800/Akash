import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
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
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [waSearch, setWaSearch] = useState('');
  const [classFilterWa, setClassFilterWa] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef<any>(null);

 // ✅ 1. Persistent Data Hooks
 const { data: students = [], isLoading: stdLoading } = useGetAllStudents();
 const { data: feeHeads = [], isLoading: headsLoading } = useGetFeeHeads();
 const { data: feeStats = { totalPending: 0, totalCollected: 0, overdue: 0, collectionRate: 0 }, isLoading: statsLoading } = useGetFeeStats();
 const { data: recentPayments = [], isLoading: paymentsLoading } = useGetRecentPayments();
 const { data: pendingReminders = [], isLoading: remLoading } = useGetFeeReminders(remindMonth, showAllMonths);

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
   setFeeValues(Object.fromEntries(feeHeads.map((h: any) => [h.id, 0])));
  }
 }, [feeHeads]);

 // ✅ Real Scanner Logic
 useEffect(() => {
    if (showScanner) {
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        scanner.render((decodedText) => {
          const matched = students.find((s: any) => 
            s.roll_no?.toString() === decodedText || 
            s.student_id?.toString() === decodedText
          );

          if (matched) {
            setSelectedStudent(matched.student_id);
            toast.success(`Scanned: ${matched.full_name}`);
            setShowScanner(false);
            scanner.clear().catch(console.error);
          } else {
            toast.error("Student not found for this code");
          }
        }, (error) => {
          // console.warn(error);
        });

        scannerRef.current = scanner;
      }, 300);

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
      };
    }
  }, [showScanner, students]);

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
     student_id: selectedStudent, 
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
    if (!student) return toast.error("Student record not linked. Please re-assign this fee.");
    if (!student.contact_number) return toast.error(`No contact number found for ${student.full_name}`);

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
    toast.success(`Sending ${classStudents.length} reminders to Class ${classFilterWa}...`);
  };

 return (
  <div className="min-h-screen bg-white text-slate-900 font-sans tracking-tight">
   <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-10 md:py-20">
    
    {/* --- HEADER --- */}
    <div className="flex flex-col md:flex-row items-center justify-between mb-20 gap-10">
     <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex items-center gap-4 mb-4">
       <span className="w-10 h-10 rounded-[5px] bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
        <Wallet size={20} />
       </span>
       <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase">
        Fee Management
       </h1>
      </div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-3">
       Financial Records & Reminders <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      </p>
     </motion.div>

     <div className="flex items-center gap-4">
      <div className="text-right mr-4 hidden md:block">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">System Health</p>
        <p className="text-[10px] font-black text-emerald-600 uppercase">Secure & Encrypted</p>
      </div>
      <button className="premium-button-admin flex items-center gap-2 bg-slate-900 text-white border-none shadow-2xl hover:scale-105 active:scale-95 tracking-widest uppercase">
       <Plus size={20} /> 
       <span>Manage Heads</span>
      </button>
     </div>
    </div>

    {/* --- MAIN GRID --- */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
     
     <div className="lg:col-span-2 space-y-12">
      
       {/* 🟡 1. ASSIGN FEE FORM */}
       <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-10 md:p-14 relative overflow-hidden"
       >
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-blue-50 rounded-[5px] flex items-center justify-center text-blue-600">
             <Plus size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase">Assign New Fee</h2>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-[5px] border border-slate-100">
           <button 
            onClick={() => setBulkMode(false)}
            className={`px-6 py-3 rounded-[5px] text-[10px] font-black uppercase tracking-widest transition-all ${!bulkMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
           >
            Student
           </button>
           <button 
            onClick={() => setBulkMode(true)}
            className={`px-6 py-3 rounded-[5px] text-[10px] font-black uppercase tracking-widest transition-all ${bulkMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
           >
            Bulk Class
           </button>
          </div>
        </div>

        <form onSubmit={handleAssignFee} className="space-y-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">
             {bulkMode ? 'Target Class' : 'Target Student'}
            </label>
            <div className="relative group">
              {bulkMode ? (
                <select 
                  className="premium-input w-full appearance-none pr-10"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">Choose Class...</option>
                  {Array.from(new Set(students.map((s: any) => s.class_name))).map((cls: any) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              ) : (
                <select 
                  className="premium-input w-full appearance-none pr-10"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  <option value="">Choose Student...</option>
                  {students.map((s: any) => (
                    <option key={s.student_id} value={s.student_id}>{s.full_name} ({s.roll_no})</option>
                  ))}
                </select>
              )}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-blue-500 transition-colors">
                <ChevronDown size={18} />
              </div>
            </div>
           </div>

           <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Billing Month</label>
            <input 
             type="month" 
             className="premium-input w-full"
             value={month}
             onChange={(e) => setMonth(e.target.value)}
            />
           </div>
          </div>

          <div className="p-10 bg-slate-50/50 rounded-[5px] border border-slate-100 shadow-inner">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-10 text-center">Standard Fee Heads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {feeHeads.map((head: any) => (
              <div key={head.id} className="space-y-3 group/item">
               <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black text-slate-600 group-hover/item:text-blue-600 transition-colors uppercase">{head.name}</label>
                <div className="flex gap-4 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <button type="button" onClick={() => deleteFeeHeadMutation.mutate(head.id)} className="text-rose-400 hover:text-rose-600">
                    <Trash2 size={12} />
                  </button>
                </div>
               </div>
               <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">₹</span>
                <input 
                 type="number" 
                 placeholder="0.00"
                 className="premium-input w-full pl-10"
                 value={feeValues[head.id] || ''}
                 onChange={(e) => handleFeeValueChange(head.id, e.target.value)}
                />
               </div>
              </div>
             ))}
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
              <div className="premium-card p-10 flex flex-col items-center gap-10 w-full max-w-xl">
                 <div className="w-full flex justify-between items-center mb-4 text-white">
                   <h2 className="text-xl font-black uppercase">Real-Time ID Scanner</h2>
                   <button onClick={() => setShowScanner(false)} className="text-slate-400 hover:text-white uppercase font-black text-xs">Close</button>
                 </div>
                 
                 <div id="reader" className="w-full max-w-sm rounded-[5px] overflow-hidden border-2 border-slate-700 shadow-2xl relative bg-black min-h-[300px]">
                   <div className="absolute inset-0 pointer-events-none z-10">
                     <div className="w-full h-full border-[30px] border-slate-900/40"></div>
                     <div className="animate-scan-line"></div>
                   </div>
                 </div>

                 <div className="text-center p-6 bg-slate-800 rounded-[5px] border border-slate-700 w-full">
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-3">Scanning Active</p>
                   <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed text-center px-4">Place the Student ID card (QR code or Barcode) in the center of the viewfinder.</p>
                 </div>

                 <div className="flex items-center gap-4 text-slate-500 font-bold text-[8px] uppercase tracking-widest bg-slate-900 px-6 py-3 rounded-full">
                    <CheckCircle size={10} className="text-emerald-500" /> Auto-lookup enabled
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

          <div className="flex flex-wrap items-center gap-4">
             <div className="flex bg-slate-50 p-1.5 rounded-[5px] border border-slate-100">
               <button 
                onClick={() => setShowAllMonths(false)}
                className={`px-5 py-2.5 rounded-[5px] text-[9px] font-black uppercase tracking-widest transition-all ${!showAllMonths ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
               >
                This Month
               </button>
               <button 
                onClick={() => setShowAllMonths(true)}
                className={`px-5 py-2.5 rounded-[5px] text-[9px] font-black uppercase tracking-widest transition-all ${showAllMonths ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
               >
                Show All
               </button>
             </div>
             <button 
              onClick={handleBulkReminders}
              disabled={pendingReminders.length === 0}
              className="px-8 py-4 bg-emerald-600 text-white rounded-[5px] font-black text-[10px] tracking-widest uppercase hover:bg-slate-900 transition-all shadow-xl shadow-emerald-50 disabled:opacity-30 flex items-center gap-3 animate-bounce-short"
             >
              <Zap size={14} /> Send pending reminders
             </button>
          </div>
        </div>

        {/* Search & Class Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Search student in reminders list..."
              className="premium-input w-full pl-16 py-5 bg-slate-50 border-transparent hover:bg-white"
              value={waSearch}
              onChange={(e) => setWaSearch(e.target.value)}
            />
          </div>
          <div className="relative group">
            <select 
              className="premium-input w-full appearance-none pr-10 bg-slate-50 border-transparent"
              value={classFilterWa}
              onChange={(e) => setClassFilterWa(e.target.value)}
            >
              <option value="">Filter by Class...</option>
              {Array.from(new Set(students.map((s: any) => s.class_name))).map((cls: any) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-blue-500">
              <Filter size={16} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Class-wise Broadcast Button */}
          {classFilterWa && (
             <button 
              onClick={handleClassBulkReminders}
              className="w-full py-4 mb-4 bg-slate-900 text-white rounded-[5px] font-black text-[10px] tracking-widest uppercase hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 border-2 border-slate-800"
             >
               <Send size={14} /> Broadcast to Class {classFilterWa}
             </button>
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
                    {fee.students?.class_name || '??'}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm leading-none uppercase">{fee.students?.full_name || 'Unknown Student'}</h4>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">
                      Amount: ₹{fee.total_amount} • {fee.month} 
                      {!fee.students && <span className="text-rose-500 ml-2 font-black italic">[Record Unlinked]</span>}
                    </p>
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
            <div className="py-16 text-center bg-slate-50/50 rounded-[5px] border-2 border-dashed border-slate-100 flex flex-col items-center gap-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <MessageSquare size={32} />
              </div>
              <div>
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  No reminders for {showAllMonths ? 'the entire school' : remindMonth}
                </p>
                {!showAllMonths && feeStats.totalPending > 0 && (
                  <button 
                    onClick={() => setShowAllMonths(true)}
                    className="mt-6 px-10 py-4 bg-emerald-600 text-white rounded-[5px] font-black text-[10px] tracking-widest uppercase hover:bg-slate-900 transition-all shadow-xl animate-bounce-short"
                  >
                    Show all {feeStats.totalPending} pending payments across all months
                  </button>
                )}
              </div>
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
