import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Plus, Search, Users, Calendar, ArrowRight,
  Wallet, Send, RefreshCw, Trash2, CheckCircle,
  ShieldCheck, Zap, Info, Star, ChevronRight, Layout, ChevronDown,
  MessageSquare, Clock, AlertTriangle, Filter, Camera, X, CreditCard, User, LayoutDashboard, ScanLine, Brain
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const [autoToggled, setAutoToggled] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showHeadsModal, setShowHeadsModal] = useState(false); // ✅ NEW: for heads management
  const [scannedStudent, setScannedStudent] = useState<any>(null); // ✅ NEW: result of scan
  const [automation, setAutomation] = useState<{ isOpen: boolean; students: any[]; currentIndex: number }>({
    isOpen: false,
    students: [],
    currentIndex: 0
  });
  const [missingFees, setMissingFees] = useState<any[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

 // ✅ 1. Persistent Data Hooks
 const { data: students = [], isLoading: stdLoading } = useGetAllStudents();
 const { data: feeHeads = [], isLoading: headsLoading } = useGetFeeHeads();
 const { data: feeStats = { totalPending: 0, totalCollected: 0, overdue: 0, collectionRate: 0 }, isLoading: statsLoading } = useGetFeeStats();
 const { data: recentPayments = [], isLoading: paymentsLoading } = useGetRecentPayments();
  const { data: pendingReminders = [], isLoading: remLoading } = useGetFeeReminders(remindMonth, showAllMonths);

  // ✅ Auto-toggle to Show All if current month is empty to avoid confusion
  useEffect(() => {
    if (!remLoading && pendingReminders.length === 0 && !showAllMonths && !autoToggled) {
      setShowAllMonths(true);
      setAutoToggled(true);
    }
  }, [pendingReminders, remLoading, showAllMonths, autoToggled]);

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

  // ✅ 3. URL Param Selection
  useEffect(() => {
    const searchId = searchParams.get('search');
    if (searchId && students.length > 0) {
      const lowerSearch = searchId.toLowerCase();
      const matched = students.find((s: any) => 
        s.student_id?.toString().toLowerCase() === lowerSearch || 
        s.id?.toString().toLowerCase() === lowerSearch ||
        s.roll_no?.toString().toLowerCase() === lowerSearch
      );
      if (matched) {
        setSelectedStudent(matched.student_id);
        toast.success(`Selected student: ${matched.full_name}`);
      }
    }
  }, [searchParams, students]);

 // ✅ Real Scanner Logic — fetches from Supabase directly for reliability
 useEffect(() => {
    if (showScanner) {
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "reader",
          { fps: 15, qrbox: { width: 250, height: 250 } },
          false
        );

        scanner.render(async (decodedText) => {
          // 🛠️ Robust ID Extraction from URL or raw IDs
          let studentId = decodedText.trim();
          if (studentId.includes('/v/')) {
            studentId = studentId.split('/v/').pop()?.split(/[?#]/)[0].replace(/\/$/, '') || studentId;
          }

          setScanLoading(true);
          scanner.clear().catch(() => {});
          setShowScanner(false);

          try {
            const numericId = isNaN(Number(studentId)) ? null : Number(studentId);

            // Step 1: Try student_id as number (DB column is INTEGER)
            let { data, error } = numericId
              ? await supabase.from('students').select('*').eq('student_id', numericId).maybeSingle()
              : { data: null, error: null };

            // Step 2: Try student_id as string (fallback)
            if (!data && !error) {
              const r1b = await supabase.from('students').select('*').eq('student_id', studentId).maybeSingle();
              data = r1b.data; error = r1b.error;
            }

            // Step 3: Try roll_no
            if (!data && !error) {
              const r2 = await supabase.from('students').select('*').eq('roll_no', studentId).maybeSingle();
              data = r2.data; error = r2.error;
            }

            // Step 4: Try UUID id (fallback for old QR codes)
            if (!data && !error) {
              const r3 = await supabase.from('students').select('*').eq('id', studentId).maybeSingle();
              data = r3.data; error = r3.error;
            }

            if (data) {
              setScannedStudent(data);
              toast.success(`✅ Student found: ${data.full_name}`);
            } else {
              toast.error(`No student found for ID: ${studentId}`);
            }
          } catch (err: any) {
            toast.error('Scan failed: ' + err.message);
          } finally {
            setScanLoading(false);
          }
        }, () => {});

        scannerRef.current = scanner;
      }, 300);

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(() => {});
        }
      };
    }
  }, [showScanner]);

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
    // ✅ Try join first, then fallback to students array in memory
    let student = fee.students;
    if (!student?.full_name) {
      student = students.find((s: any) => 
        s.student_id?.toString() === fee.student_id?.toString() ||
        s.id?.toString() === fee.student_id?.toString()
      );
    }
    if (!student) return toast.error("Student record not linked. Re-assign this fee.");
    if (!student.contact_number) return toast.error(`No contact number for ${student.full_name}`);

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
   const message = `*📄 FEE REMINDER - ${schoolName.toUpperCase()}*%0A%0A*Student:* ${student.full_name}%0A*Class:* ${student.class_name}%0A*Month:* ${fee.month}%0A%0A*PENDING BREAKDOWN:*%0A${breakdown}%0A%0A*TOTAL PAYABLE:* ₹${fee.total_amount}%0A*STATUS:* ${fee.status}%0A%0A_Please pay before the 10th of the month to avoid late fees._%0A_Thank you, Management_`;
     window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const startSequentialReminders = () => {
    if (!pendingReminders.length) return;
    
    // ✅ Apply current UI filters to the sequential queue
    const targetStudents = pendingReminders
      .map((fee: any) => {
        const student = fee.students?.full_name ? fee.students : students.find((s: any) =>
          s.student_id?.toString() === fee.student_id?.toString() || s.id?.toString() === fee.student_id?.toString()
        );
        return { ...fee, _student: student };
      })
      .filter((fee: any) => !!fee._student?.contact_number)
      .filter((fee: any) => {
        const nameMatch = !waSearch || fee._student?.full_name?.toLowerCase().includes(waSearch.toLowerCase());
        const classMatch = !classFilterWa || fee._student?.class_name === classFilterWa;
        return nameMatch && classMatch;
      });

    if (targetStudents.length === 0) return toast.error("No students matching filters with valid phone numbers found");
    
    setAutomation({
      isOpen: true,
      students: targetStudents,
      currentIndex: 0
    });
  };

  const nextSequentialReminder = () => {
    const current = automation.students[automation.currentIndex];
    handleSendReminder(current);
    
    if (automation.currentIndex < automation.students.length - 1) {
      setAutomation(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    } else {
      setAutomation(prev => ({ ...prev, isOpen: false }));
      toast.success("✅ Sequence completed!");
    }
  };

  const handleSmartAutoAssign = async () => {
    if (!remindMonth) return toast.error("Please pick a month in the Reminders section first.");
    
    setLocalLoading(true);
    try {
      // 1. Find who ALREADY has fees for this month
      const { data: existingFees } = await supabase
        .from('fees')
        .select('student_id')
        .eq('month', remindMonth);
      
      const existingIds = new Set(existingFees?.map(f => f.student_id?.toString()));
      
      // 2. Identify missing students
      const missing = students.filter(s => !existingIds.has(s.student_id?.toString()));
      
      if (missing.length === 0) {
        toast.success("All students already have fee records for this month! 🎉");
        return;
      }

      const confirmed = window.confirm(`Found ${missing.length} students without fees for ${remindMonth}. Auto-assign using their last known fee structure?`);
      if (!confirmed) return;

      // 3. For each missing student, get their last recorded fee
      const newFees: any[] = [];
      
      for (const student of missing) {
        const { data: lastFee } = await supabase
          .from('fees')
          .select('fee_structure, total_amount')
          .eq('student_id', student.student_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastFee) {
          newFees.push({
            student_id: student.student_id,
            month: remindMonth,
            fee_structure: lastFee.fee_structure,
            total_amount: lastFee.total_amount,
            status: 'Pending'
          });
        }
      }

      if (newFees.length > 0) {
        assignFeesMutation.mutate(newFees);
      } else {
        toast.info("No previous fee history found for these students. Please assign manually.");
      }
    } catch (err: any) {
      toast.error("Auto-Assign failed: " + err.message);
    } finally {
      setLocalLoading(false);
    }
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
       <button 
        onClick={() => document.getElementById('assign-form')?.scrollIntoView({ behavior: 'smooth' })}
        className="premium-button-admin flex items-center gap-2 bg-blue-600 font-black text-white border-none shadow-2xl hover:scale-105 active:scale-95 tracking-widest uppercase px-8"
       >
        <Plus size={20} /> 
        <span>Add Fee</span>
       </button>
       <button 
        onClick={() => window.location.reload()}
        className="premium-button-admin flex items-center gap-2 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white border-none shadow-xl hover:scale-105 active:scale-95 tracking-widest uppercase px-6"
       >
        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
       </button>
       <button 
        onClick={() => setShowHeadsModal(true)}
        className="premium-button-admin flex items-center gap-2 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white border-none shadow-xl hover:scale-105 active:scale-95 tracking-widest uppercase px-6"
       >
        <LayoutDashboard size={20} /> 
        <span>Heads</span>
       </button>
      </div>
    </div>
    {/* --- MAIN GRID --- */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
     
     <div className="lg:col-span-2 space-y-12">
       
       {/* 🚀 AUTOMATION ADUKUL PANEL */}
       <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="premium-card p-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] shadow-2xl overflow-hidden group"
       >
        <div className="bg-white m-0.5 rounded-[1.9rem] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-40"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
                <Zap size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase">Automation Pulse</h2>
                <p className="text-[10px] font-black text-blue-500 tracking-widest uppercase">Smart Monthly Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
               <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Live Auto-Pilot</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all flex flex-col gap-6">
               <div>
                 <h3 className="text-[12px] font-black text-slate-900 uppercase mb-1">Monthly Auto-Assign</h3>
                 <p className="text-[10px] text-slate-500 font-medium">Detect students without fees and clone last month's records instantly.</p>
               </div>
               <button 
                onClick={handleSmartAutoAssign}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] tracking-widest hover:bg-blue-600 transition-all uppercase flex items-center justify-center gap-3 shadow-xl"
               >
                 <RefreshCw size={14} className={localLoading ? 'animate-spin' : ''} />
                 {localLoading ? 'Processing...' : 'Start Auto-Pilot'}
               </button>
            </div>

            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-emerald-200 transition-all flex flex-col gap-6">
               <div>
                 <h3 className="text-[12px] font-black text-slate-900 uppercase mb-1">Bulk Reminders</h3>
                 <p className="text-[10px] text-slate-500 font-medium tracking-tight">Send professional WhatsApp receipts & alerts to all defaulters.</p>
               </div>
               <button 
                onClick={startSequentialReminders}
                disabled={pendingReminders.length === 0}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] tracking-widest hover:bg-emerald-500 transition-all uppercase flex items-center justify-center gap-3 shadow-xl shadow-emerald-50"
               >
                 <MessageSquare size={14} />
                 Execute Bulk Reminders
               </button>
            </div>
          </div>
        </div>
       </motion.div>

       {/* 🟡 1. ASSIGN FEE FORM */}
       <motion.div 
        id="assign-form"
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
           <button disabled={loading} className="premium-button-admin bg-blue-600 text-white hover:bg-slate-900 border-none shadow-2xl active:scale-95 tracking-widest relative z-10 px-16 py-6 text-lg uppercase flex items-center gap-4">
             {loading ? <RefreshCw size={28} className="animate-spin" /> : <ShieldCheck size={28} />}
             <div className="text-left leading-none">
              <span className="block text-[8px] opacity-60 font-black">CONFIRM & SAVE</span>
              <span className="block">{loading ? 'Processing...' : 'Assign Fee Record'}</span>
             </div>
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
          <p className="text-[10px] font-black text-slate-400 leading-relaxed uppercase">Scan any student ID card — mark attendance, assign/pay fees, WhatsApp reminders, library & more.</p>
          
          <div className="flex gap-4">
            <button 
              onClick={() => { setScannedStudent(null); setShowScanner(true); }}
              className="flex-1 py-4 bg-blue-600 text-white rounded-[5px] font-black text-[10px] tracking-widest hover:bg-blue-500 transition-all shadow-xl uppercase flex items-center justify-center gap-2"
            >
              {scanLoading ? <RefreshCw size={16} className="animate-spin" /> : <Camera size={16} />}
              {scanLoading ? 'Looking up...' : 'Open Scanner'}
            </button>
            {scannedStudent && (
              <button 
                onClick={() => setScannedStudent(null)}
                className="py-4 px-5 bg-white/10 text-white rounded-[5px] font-black text-[10px] tracking-widest hover:bg-white/20 transition-all uppercase flex items-center gap-2"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* ✅ Universal Action Hub */}
          <AnimatePresence>
            {scannedStudent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white rounded-[5px] overflow-hidden shadow-2xl border border-slate-100"
              >
                {/* Student Card Header */}
                <div className="flex items-center gap-4 p-5 bg-slate-50 border-b border-slate-100">
                  <div className="w-14 h-14 rounded-[5px] overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                    {scannedStudent.photo_url ? (
                      <img src={scannedStudent.photo_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-black text-xl">
                        {scannedStudent.full_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 truncate text-sm uppercase">{scannedStudent.full_name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                      Class {scannedStudent.class_name} • Roll #{scannedStudent.roll_no}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full flex-shrink-0">
                    <CheckCircle size={12} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Verified</span>
                  </div>
                </div>

                {/* ✅ Attendance Row */}
                <div className="p-4 bg-emerald-50/30 border-b border-slate-100">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-3">Quick Attendance</p>
                  <div className="flex gap-2">
                    {(['Present', 'Absent', 'Late'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={async () => {
                          const schoolId = localStorage.getItem('current_school_id');
                          const { error } = await supabase.from('attendance').upsert({
                            student_id: scannedStudent.student_id?.toString() || scannedStudent.id,
                            student_name: scannedStudent.full_name,
                            school_id: schoolId,
                            date: new Date().toISOString().split('T')[0],
                            status,
                            marked_by: localStorage.getItem('user_email') || 'admin',
                          }, { onConflict: 'student_id,date,school_id' });
                          if (error) toast.error('Attendance error: ' + error.message);
                          else toast.success(`✅ ${scannedStudent.full_name} marked ${status} for today`);
                        }}
                        className={`flex-1 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${
                          status === 'Present' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600' :
                          status === 'Absent' ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600' :
                          'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white hover:border-amber-600'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ✅ WhatsApp Row */}
                <div className="p-4 bg-green-50/20 border-b border-slate-100">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-3">WhatsApp Reminder</p>
                  <button
                    onClick={async () => {
                      const schoolId = localStorage.getItem('current_school_id');
                      const { data: pendingFees } = await supabase
                        .from('fees')
                        .select('total_amount, month')
                        .eq('student_id', scannedStudent.student_id?.toString() || scannedStudent.id)
                        .eq('status', 'Pending')
                        .eq('school_id', schoolId);

                      const phone = scannedStudent.contact_number?.replace(/\D/g, '');
                      if (!phone) return toast.error('No phone number for this student');

                      const totalPending = (pendingFees || []).reduce((s: number, f: any) => s + Number(f.total_amount), 0);
                      const schoolName = localStorage.getItem('current_school_name') || 'School';
                      const msg = `Dear Parent of *${scannedStudent.full_name}*, your ward has pending fees of *₹${totalPending}* at ${schoolName}. Please pay at the earliest. Thank you.`;
                      window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-green-500 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} /> Send Pending Fee Reminder
                  </button>
                </div>

                {/* Action Grid (8 buttons) */}
                <div className="grid grid-cols-4 gap-0 divide-x divide-y divide-slate-100">
                  <button
                    onClick={() => { setSelectedStudent(scannedStudent.student_id); setScannedStudent(null); toast.success(`${scannedStudent.full_name} selected`); }}
                    className="flex flex-col items-center gap-2 p-4 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <CreditCard size={16} />
                    </div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-wide text-center">Assign Fee</p>
                  </button>

                  <button
                    onClick={async () => {
                      const schoolId = localStorage.getItem('current_school_id');
                      const { data: pendingFees } = await supabase
                        .from('fees').select('id, total_amount, month')
                        .eq('student_id', scannedStudent.student_id?.toString() || scannedStudent.id)
                        .eq('status', 'Pending').eq('school_id', schoolId);
                      if (!pendingFees?.length) return toast.info('No pending fees found');
                      if (window.confirm(`Mark all ₹${pendingFees.reduce((s: number, f: any) => s + Number(f.total_amount), 0)} as Paid?`)) {
                        await supabase.from('fees').update({ status: 'Paid', updated_at: new Date().toISOString() })
                          .in('id', pendingFees.map((f: any) => f.id));
                        toast.success(`✅ All fees marked Paid for ${scannedStudent.full_name}`);
                      }
                    }}
                    className="flex flex-col items-center gap-2 p-4 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <CheckCircle size={16} />
                    </div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-wide text-center">Pay Fee</p>
                  </button>

                  <button
                    onClick={() => navigate(`/admin/library?student=${scannedStudent.student_id}`)}
                    className="flex flex-col items-center gap-2 p-4 hover:bg-amber-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                      <Layout size={16} />
                    </div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-wide text-center">Library</p>
                  </button>

                  <button
                    onClick={() => navigate(`/admin/documents?search=${scannedStudent.student_id}`)}
                    className="flex flex-col items-center gap-2 p-4 hover:bg-purple-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                      <ScanLine size={16} />
                    </div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-wide text-center">ID/Docs</p>
                  </button>

                  <button
                    onClick={() => navigate(`/v/${scannedStudent.student_id || scannedStudent.id}`)}
                    className="flex flex-col items-center gap-2 p-4 hover:bg-teal-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                      <ShieldCheck size={16} />
                    </div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-wide text-center">Verify</p>
                  </button>

                  <button
                    onClick={() => navigate(`/admin/upload-result?student=${scannedStudent.student_id}`)}
                    className="flex flex-col items-center gap-2 p-4 hover:bg-rose-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                      <Star size={16} />
                    </div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-wide text-center">Results</p>
                  </button>

                  <button
                    onClick={() => navigate(`/admin/student/${scannedStudent.id}`)}
                    className="flex flex-col items-center gap-2 p-4 hover:bg-indigo-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <User size={16} />
                    </div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-wide text-center">Profile</p>
                  </button>

                  <button
                    onClick={() => navigate('/admin/library')}
                    className="flex flex-col items-center gap-2 p-4 hover:bg-orange-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all">
                      <Info size={16} />
                    </div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-wide text-center">More</p>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showScanner && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center gap-8 w-full max-w-md shadow-2xl">
                 <div className="w-full flex justify-between items-center">
                   <div>
                     <h2 className="text-xl font-black text-slate-900 uppercase">Scan Student ID</h2>
                     <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mt-1">Aligns with QR Code on card</p>
                   </div>
                   <button onClick={() => setShowScanner(false)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100">
                     <X size={20} />
                   </button>
                 </div>
                 
                 <div id="reader" className="w-full max-w-sm rounded-2xl overflow-hidden border-4 border-slate-900 shadow-2xl relative bg-black min-h-[280px]">
                   <div className="absolute inset-0 pointer-events-none z-10">
                     <div className="w-full h-full border-[35px] border-slate-950/50"></div>
                     <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-scan-line"></div>
                   </div>
                 </div>

                 <div className="w-full p-5 bg-slate-50 rounded-2xl flex items-center gap-4 border border-slate-100">
                   <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
                     <Zap size={20} />
                   </div>
                   <p className="text-[10px] font-black text-slate-500 uppercase leading-relaxed tracking-wider">
                     Point camera at the QR code on the student ID card. Student will be identified automatically.
                   </p>
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
              onClick={startSequentialReminders}
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
              onClick={startSequentialReminders}
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
            pendingReminders
              .map((fee: any) => {
                // ✅ Resolve student from join OR from loaded students array
                const student = fee.students?.full_name
                  ? fee.students
                  : students.find((s: any) =>
                      s.student_id?.toString() === fee.student_id?.toString() ||
                      s.id?.toString() === fee.student_id?.toString()
                    );
                return { ...fee, _student: student };
              })
              .filter((fee: any) => {
                if (!waSearch) return true;
                const name = fee._student?.full_name || '';
                return name.toLowerCase().includes(waSearch.toLowerCase());
              })
              .filter((fee: any) => {
                if (!classFilterWa) return true;
                return fee._student?.class_name === classFilterWa;
              })
              .map((fee: any) => (
              <div key={fee.id} className="p-6 bg-slate-50 rounded-[5px] flex flex-col sm:flex-row justify-between items-center group hover:bg-white hover:shadow-2xl active:scale-95 tracking-widest transition-all border border-transparent hover:border-emerald-100">
                <div className="flex items-center gap-6 mb-4 sm:mb-0">
                  <div className="w-12 h-12 rounded-[5px] bg-white border border-slate-100 flex items-center justify-center text-slate-900 font-black text-xs uppercase shadow-sm">
                    {fee._student?.class_name || '??'}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm leading-none uppercase">
                      {fee._student?.full_name || <span className="text-rose-400 italic">Unknown — ID:{fee.student_id}</span>}
                    </h4>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">
                      ₹{fee.total_amount} • {fee.month}
                      {fee._student?.contact_number && (
                        <span className="ml-2 text-emerald-500">📱 {fee._student.contact_number}</span>
                      )}
                      {!fee._student?.contact_number && (
                        <span className="ml-2 text-rose-400 font-black italic">No Phone</span>
                      )}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleSendReminder(fee)}
                  disabled={!fee._student?.contact_number}
                  className="w-full sm:w-auto px-6 py-3 bg-white text-emerald-600 border border-emerald-100 rounded-[5px] font-black text-[10px] tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 uppercase disabled:opacity-30 disabled:cursor-not-allowed"
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

    {/* 🟢 AUTOMATION PROGRESS MODAL */}
    <AnimatePresence>
      {automation.isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-[2.5rem] p-12 w-full max-w-md shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
            
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <Brain size={24} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase">Auto Reminders</h2>
                  <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Processing Queue</p>
                </div>
              </div>
              <button 
                onClick={() => setAutomation(prev => ({ ...prev, isOpen: false }))}
                className="p-4 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8 text-center bg-slate-50 p-10 rounded-[2rem] border border-slate-100">
               <div className="relative inline-block">
                 <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-emerald-500 animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center font-black text-slate-900 text-xl">
                   {automation.currentIndex + 1}
                 </div>
               </div>
               
               <div>
                 <p className="text-lg font-black text-slate-900 uppercase">{automation.students[automation.currentIndex]?._student?.full_name}</p>
                 <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mt-2">
                   Phone: {automation.students[automation.currentIndex]?._student?.contact_number}
                 </p>
               </div>

               <div className="space-y-2">
                 <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">
                   <span>Progress</span>
                   <span>{Math.round(((automation.currentIndex + 1) / automation.students.length) * 100)}%</span>
                 </div>
                 <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${((automation.currentIndex + 1) / automation.students.length) * 100}%` }}
                   />
                 </div>
               </div>
            </div>

            <div className="mt-10 flex flex-col gap-4">
               <button 
                onClick={nextSequentialReminder}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] tracking-widest hover:bg-emerald-500 transition-all uppercase flex items-center justify-center gap-3 shadow-xl"
               >
                 <Send size={16} />
                 {automation.currentIndex === automation.students.length - 1 ? 'Send Final Reminder & Finish' : 'Send & Load Next Student'}
               </button>
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-center italic">
                 Note: Har student ke liye ek naya tab khulega.
               </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* 🟢 MANAGE FEE HEADS MODAL */}
    <AnimatePresence>
      {showHeadsModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-[2rem] p-10 w-full max-w-xl shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
            
            <div className="flex justify-between items-center mb-10 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <LayoutDashboard size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase">Manage Fee Heads</h2>
                  <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">ADD OR REMOVE FEE CATEGORIES</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHeadsModal(false)}
                className="p-4 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">New Head Category</p>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="e.g. Tution Fee"
                    className="premium-input flex-1 bg-white border-transparent"
                    value={newHeadName}
                    onChange={(e) => setNewHeadName(e.target.value)}
                  />
                  <button 
                    onClick={() => {
                      if (!newHeadName) return toast.error("Enter head name");
                      addFeeHeadMutation.mutate(newHeadName, {
                        onSuccess: () => {
                          setNewHeadName('');
                          toast.success(`Head '${newHeadName}' added!`);
                        }
                      });
                    }}
                    className="px-8 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-100"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                <div className="grid grid-cols-1 gap-4">
                  {feeHeads.map((head: any) => (
                    <div 
                      key={head.id} 
                      className="p-6 bg-white rounded-2xl border border-slate-100 flex justify-between items-center group hover:border-rose-100 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="font-black text-slate-800 uppercase text-xs">{head.name}</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Delete head '${head.name}'?`)) {
                            deleteFeeHeadMutation.mutate(head.id);
                          }
                        }}
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-slate-50 flex justify-center">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">All changes reflect in the main assignment form immediately.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>


   </div>
  </div>
 );
};

export default ManageFees;
