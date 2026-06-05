import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Plus, Search, ArrowRight, Wallet, Send, RefreshCw, Trash2, 
  CheckCircle, ShieldCheck, Zap, Layout, ChevronDown, MessageSquare, 
  AlertTriangle, Filter, Camera, X, CreditCard, User, LayoutDashboard, Download
} from 'lucide-react';
import { 
  useGetAllStudents, useGetFeeHeads, useGetFeeStats, 
  useGetRecentPayments, useAddFeeHead, 
  useDeleteFeeHead, useAssignFees
} from '../../hooks/useQueries';

export default function ManageFees() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // --- STATE MANAGEMENT ---
  const [newHeadName, setNewHeadName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [month, setMonth] = useState('');
  const [feeValues, setFeeValues] = useState<Record<string, any>>({});
  const [bulkMode, setBulkMode] = useState(false);
  const [remindMonth, setRemindMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [waSearch, setWaSearch] = useState('');
  const [classFilterWa, setClassFilterWa] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showHeadsModal, setShowHeadsModal] = useState(false); 
  const [showDefaultersModal, setShowDefaultersModal] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<any>(null); 
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  // 100% Reliable Custom Direct Fetch for Reminders
  const [pendingReminders, setPendingReminders] = useState<any[]>([]);
  const [remLoading, setRemLoading] = useState(false);

  const [automation, setAutomation] = useState({
    isOpen: false,
    students: [] as any[],
    currentIndex: 0
  });

  // --- DATA FETCHING (HOOKS) ---
  const { data: students = [], isLoading: stdLoading } = useGetAllStudents();
  const { data: feeHeads = [], isLoading: headsLoading } = useGetFeeHeads();
  const { data: feeStats = { totalPending: 0, totalCollected: 0, overdue: 0 }, isLoading: statsLoading } = useGetFeeStats();
  const { data: recentPayments = [], isLoading: paymentsLoading } = useGetRecentPayments();

  const loading = stdLoading || headsLoading || statsLoading || paymentsLoading || localLoading;
  const totalAmountValue = Object.values(feeValues).reduce((sum, val) => sum + Number(val || 0), 0);

  // --- DIRECT SUPABASE FETCH (Bypasses any faulty custom hooks) ---
  useEffect(() => {
    const fetchPendingFees = async () => {
      setRemLoading(true);
      try {
        let query = supabase.from('fees').select('*').eq('status', 'Pending');
        if (!showAllMonths) {
          query = query.eq('month', remindMonth);
        }
        const { data, error } = await query;
        if (error) throw error;
        setPendingReminders(data || []);
      } catch (err: any) {
        console.error("Fetch Reminders Error:", err);
      } finally {
        setRemLoading(false);
      }
    };
    fetchPendingFees();
  }, [remindMonth, showAllMonths]);

  // --- SMART MAPPING & FILTERING (Always up-to-date) ---
  const mappedReminders = pendingReminders.map((fee: any) => ({
    ...fee,
    _student: fee.students || students.find((s: any) => s.student_id?.toString() === fee.student_id?.toString())
  }));

  const filteredReminders = mappedReminders.filter((fee: any) => {
    const nameMatch = !waSearch || fee._student?.full_name?.toLowerCase().includes(waSearch.toLowerCase());
    // Use .toString() on both sides to prevent 8 === "8" returning false
    const classMatch = !classFilterWa || fee._student?.class_name?.toString() === classFilterWa.toString();
    return nameMatch && classMatch;
  });

  // --- MUTATIONS ---
  const addFeeHeadMutation = useAddFeeHead();
  const deleteFeeHeadMutation = useDeleteFeeHead();
  const assignFeesMutation = useAssignFees();

  // --- EFFECTS ---
  useEffect(() => {
    if (feeHeads.length > 0 && Object.keys(feeValues).length === 0) {
      setFeeValues(Object.fromEntries(feeHeads.map((h: any) => [h.id, 0])));
    }
  }, [feeHeads]);

  useEffect(() => {
    const searchId = searchParams.get('search');
    if (searchId && students.length > 0) {
      const matched = students.find((s: any) => 
        s.student_id?.toString() === searchId || s.id?.toString() === searchId || s.roll_no?.toString() === searchId
      );
      if (matched) {
        setSelectedStudent(matched.student_id);
        toast.success(`Student Auto-Selected: ${matched.full_name}`);
      }
    }
  }, [searchParams, students]);

  // QR Scanner Effect
  useEffect(() => {
    if (showScanner) {
      const timer = setTimeout(() => {
        const scanner = new Html5QrcodeScanner("reader", { fps: 15, qrbox: { width: 250, height: 250 } }, false);
        scanner.render(async (decodedText) => {
          let studentId = decodedText.trim();
          if (studentId.includes('/v/')) {
            studentId = studentId.split('/v/').pop()?.split(/[?#]/)[0].replace(/\/$/, '') || studentId;
          }
          setScanLoading(true);
          scanner.clear().catch(() => {});
          setShowScanner(false);
          await lookupStudent(studentId);
        }, () => {});
        scannerRef.current = scanner;
      }, 300);
      return () => {
        clearTimeout(timer);
        if (scannerRef.current) scannerRef.current.clear().catch(() => {});
      };
    }
  }, [showScanner]);

  // --- CORE FUNCTIONS ---
  async function lookupStudent(studentId: string) {
    try {
      const fields = ['student_id', 'roll_no', 'id'];
      let foundData = null;

      for (const field of fields) {
        const queryVal = field === 'student_id' && !isNaN(Number(studentId)) ? Number(studentId) : studentId;
        const { data } = await supabase.from('students').select('*').eq(field, queryVal).maybeSingle();
        if (data) {
          foundData = data;
          break;
        }
      }

      if (foundData) {
        setScannedStudent(foundData);
        toast.success(`✅ Student Found: ${foundData.full_name}`);
      } else {
        toast.error(`No student record matching ID: ${studentId}`);
      }
    } catch (err: any) {
      toast.error('Lookup Failed: ' + err.message);
    } finally {
      setScanLoading(false);
    }
  }

  async function handleAssignFee(e: React.FormEvent) {
    e.preventDefault();
    if (!bulkMode && !selectedStudent) return toast.error("Please select a student");
    if (bulkMode && !selectedClass) return toast.error("Please select a class");
    if (!month) return toast.error("Please select a month");
    if (totalAmountValue <= 0) return toast.error("Total fee cannot be zero");

    try {
      let feesToInsert = [];
      if (bulkMode) {
        const classStudents = students.filter((s: any) => s.class_name?.toString() === selectedClass.toString());
        if (classStudents.length === 0) throw new Error("No students found in this class");
        feesToInsert = classStudents.map((s: any) => ({ student_id: s.student_id, month, fee_structure: feeValues, total_amount: totalAmountValue, status: 'Pending' }));
      } else {
        feesToInsert = [{ student_id: selectedStudent, month, fee_structure: feeValues, total_amount: totalAmountValue, status: 'Pending' }];
      }

      assignFeesMutation.mutate(feesToInsert, {
        onSuccess: () => {
          setSelectedStudent('');
          setMonth('');
          setFeeValues(Object.fromEntries(feeHeads.map((h: any) => [h.id, 0])));
          toast.success("✅ Fee Assigned Successfully!");
        }
      });
    } catch (error: any) {
      toast.error("Assignment Error: " + error.message);
    }
  }

  function handleFeeValueChange(headId: string, value: string) {
    setFeeValues({ ...feeValues, [headId]: value });
  }

  function handleSendReminder(fee: any) {
    const student = fee._student || students.find((s: any) => s.student_id?.toString() === fee.student_id?.toString());
    if (!student) return toast.error("Linked student record not found.");
    if (!student.contact_number) return toast.error(`No valid mobile number available for ${student.full_name}`);

    let cleanPhone = student.contact_number.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

    const feeBreakdown = Object.entries(fee.fee_structure || {})
      .filter(([_, val]) => Number(val) > 0)
      .map(([headId, val]) => {
        const head = feeHeads.find((h: any) => h.id.toString() === headId.toString());
        return `• ${head ? head.name.toUpperCase() : 'FEE'}: ₹${val}`;
      }).join('\n');

    const schoolName = localStorage.getItem('current_school_name') || 'ASM School';
    
    const dynamicText = `*🏛️ ${schoolName.toUpperCase()} - FEE REMINDER*

Dear Parent, this is a reminder regarding the outstanding dues for your ward.

*🔸 Student:* ${student.full_name}
*🔸 Class:* ${student.class_name || 'N/A'}
*🔸 Month:* ${fee.month}

*📋 Fee Breakdown:*
${feeBreakdown || '• Pending Maintenance Fee'}

*💰 Total Outstanding Amount: ₹${fee.total_amount}*
*📌 Status:* PENDING

Please clear the dues at the school cash counter or pay online via the app. If already paid, please share the screenshot.

*Regards,*
*School Administration*`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(dynamicText)}`, '_blank');
  }

  function startSequentialReminders() {
    // Only use the items currently visible in the filtered list
    let targets = selectedFeeIds.length > 0 
      ? filteredReminders.filter((f: any) => selectedFeeIds.includes(f.id.toString()))
      : filteredReminders;

    const finalQueue = targets.filter(f => !!f._student?.contact_number);

    if (finalQueue.length === 0) return toast.error("No students found with valid contact numbers in this filter.");

    setAutomation({ isOpen: true, students: finalQueue, currentIndex: 0 });
  }

  function nextSequentialReminder() {
    const current = automation.students[automation.currentIndex];
    handleSendReminder(current);
    
    if (automation.currentIndex < automation.students.length - 1) {
      setAutomation(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
      if (isAutoAdvancing) {
        toast.info("Opening next contact window queue...", { duration: 1000 });
        setTimeout(() => nextSequentialReminder(), 3500);
      }
    } else {
      setAutomation(prev => ({ ...prev, isOpen: false }));
      toast.success("🎯 Bulk Blast Complete!");
    }
  }

  async function handleBulkMarkAsPaid() {
    if (selectedFeeIds.length === 0) return toast.error("Pehle checkbox me records select karein!");
    if (!window.confirm(`Mark ${selectedFeeIds.length} records as PAID?`)) return;

    setLocalLoading(true);
    try {
      const { error } = await supabase.from('fees').update({ status: 'Paid', updated_at: new Date().toISOString() }).in('id', selectedFeeIds);
      if (error) throw error;
      toast.success("🎉 Selected records marked as Paid successfully!");
      setSelectedFeeIds([]);
      // Reload or refetch
      window.location.reload(); 
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLocalLoading(false);
    }
  }

  function exportDefaultersToCSV() {
    if (filteredReminders.length === 0) return toast.error("Data grid is empty.");
    let csv = "Student Name,Class,Roll No,Phone,Month,Amount\n";
    filteredReminders.forEach((f: any) => {
      const s = f._student;
      csv += `"${s?.full_name || 'N/A'}","${s?.class_name || 'N/A'}","${s?.roll_no || 'N/A'}","${s?.contact_number || 'N/A'}","${f.month}",${f.total_amount}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Defaulters_${remindMonth}.csv`);
    link.click();
    toast.success("📁 Report Exported to CSV File Successfully!");
  }

  async function handleSmartAutoAssign() {
    if (!remindMonth) return toast.error("Please pick a month filter first.");
    setLocalLoading(true);
    try {
      const { data: existing } = await supabase.from('fees').select('student_id').eq('month', remindMonth);
      const existingIds = new Set(existing?.map(f => f.student_id?.toString()));
      const missing = students.filter(s => !existingIds.has(s.student_id?.toString()));
      
      if (missing.length === 0) return toast.success("All students are already mapped! 🎉");
      if (!window.confirm(`Auto-assign remaining ${missing.length} students from history fallback?`)) return;

      const inserts = [];
      for (const s of missing) {
        const { data: last } = await supabase.from('fees').select('fee_structure, total_amount').eq('student_id', s.student_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (last) inserts.push({ student_id: s.student_id, month: remindMonth, fee_structure: last.fee_structure, total_amount: last.total_amount, status: 'Pending' });
      }

      if (inserts.length > 0) assignFeesMutation.mutate(inserts);
      else toast.info("No tracking history configurations logged.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLocalLoading(false);
    }
  }

  async function handleCloneLastMonthFees() {
    if (!month) return toast.error("Pehle assign tab me Target Month chunein.");
    const [year, mon] = month.split('-').map(Number);
    const prevMonthStr = `${year}-${(mon - 1).toString().padStart(2, '0')}`;

    if (!window.confirm(`Clone complete raw structure mapping from ${prevMonthStr} to ${month}?`)) return;

    try {
      setLocalLoading(true);
      const { data: prevFees } = await supabase.from('fees').select('student_id, fee_structure, total_amount').eq('month', prevMonthStr);
      if (!prevFees?.length) throw new Error("No historical data found in source month stack.");
      
      const payload = prevFees.map(f => ({ student_id: f.student_id, month, fee_structure: f.fee_structure, total_amount: f.total_amount, status: 'Pending' }));
      assignFeesMutation.mutate(payload);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLocalLoading(false);
    }
  }

 return (
  <div className="min-h-screen bg-white text-slate-900 font-sans tracking-tight">
   <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-10">
    
    {/* --- HEADER PANELS --- */}
    <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
     <div>
      <div className="flex items-center gap-4 mb-2">
       <span className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md"><Wallet size={20} /></span>
       <h1 className="text-3xl font-black tracking-tight uppercase">Fee Management</h1>
      </div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Automated Financial Desk & Receipt Center</p>
     </div>

     <div className="flex flex-wrap items-center gap-3">
       <button onClick={() => document.getElementById('assign-form')?.scrollIntoView({ behavior: 'smooth' })} className="px-5 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-lg"><Plus size={16} /> Add Fee</button>
       <button onClick={() => window.location.reload()} className="p-3 bg-slate-50 text-slate-600 rounded-xl border hover:bg-slate-900 hover:text-white transition-all"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
       <button onClick={() => setShowHeadsModal(true)} className="px-5 py-3 bg-slate-50 text-slate-700 rounded-xl border text-xs font-black uppercase flex items-center gap-2"><LayoutDashboard size={16} /> Categories</button>
       <button onClick={() => setShowDefaultersModal(true)} className="px-5 py-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-xs font-black uppercase flex items-center gap-2"><AlertTriangle size={16} /> Defaulters</button>
      </div>
    </div>

    {/* --- WORKSPACE LAYOUT --- */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
     <div className="lg:col-span-2 space-y-10">
       
       {/* PART 1: SMART CONTROL ENGINE */}
       <div className="p-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-white rounded-[1.4rem] p-8 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase">Automation Control</h2>
              <p className="text-[10px] font-black text-blue-500 tracking-wider uppercase">AutoPilot Data & Processing Engine</p>
            </div>
            <button onClick={exportDefaultersToCSV} className="px-4 py-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-black uppercase flex items-center gap-2 border"><Download size={14} /> Download Excel Report</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border flex flex-col justify-between gap-4">
               <div>
                 <h3 className="text-xs font-black text-slate-900 uppercase">A. Intelligent Auto-Assign</h3>
                 <p className="text-[11px] text-slate-500 mt-1">Is mahine jin bacho ki fees pending entry missing hai unhe auto-detect karke billing state create karein.</p>
               </div>
               <button onClick={handleSmartAutoAssign} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all hover:bg-blue-600">
                 <RefreshCw size={14} className={localLoading ? 'animate-spin' : ''} /> Execute AutoPilot Assign
               </button>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border flex flex-col justify-between gap-4">
               <div>
                 <h3 className="text-xs font-black text-slate-900 uppercase">B. Automation Reminders Blast</h3>
                 <p className="text-[11px] text-slate-500 mt-1">Sabhi clear defaulters ko bulk messaging system queue pipeline stack me trigger de.</p>
               </div>
               <button onClick={startSequentialReminders} disabled={filteredReminders.length === 0} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-40">
                 <MessageSquare size={14} /> Start WhatsApp Blast
               </button>
            </div>
          </div>
        </div>
       </div>

       {/* PART 2: THE ADMISSION/FEE ASSIGNMENT BLOCK */}
       <div id="assign-form" className="p-8 border rounded-3xl bg-white relative">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 border-b pb-6">
          <div className="flex items-center gap-4">
            <span className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><Plus size={18} /></span>
            <h2 className="text-xl font-black uppercase">Assign New Month Fees</h2>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
           <button type="button" onClick={() => setBulkMode(false)} className={`px-4 py-2 text-xs font-black uppercase rounded-lg ${!bulkMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Single Student</button>
           <button type="button" onClick={() => setBulkMode(true)} className={`px-4 py-2 text-xs font-black uppercase rounded-lg ${bulkMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Bulk Class</button>
          </div>
        </div>

        <form onSubmit={handleAssignFee} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">{bulkMode ? 'Target Class Group' : 'Target Student profile'}</label>
            <div className="relative">
              {bulkMode ? (
                <select className="w-full border p-3.5 rounded-xl appearance-none pr-10 text-sm outline-none" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                  <option value="">Select target class...</option>
                  {Array.from(new Set(students.map((s: any) => s.class_name))).map((cls: any) => (
                    <option key={cls} value={cls}>Class {cls}</option>
                  ))}
                </select>
              ) : (
                <select className="w-full border p-3.5 rounded-xl appearance-none pr-10 text-sm outline-none" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                  <option value="">Select individual student...</option>
                  {students.map((s: any) => (
                    <option key={s.student_id} value={s.student_id}>{s.full_name} (Roll: #{s.roll_no})</option>
                  ))}
                </select>
              )}
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
            </div>
           </div>

           <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Billing Statement Month</label>
            <input type="month" className="w-full border p-3 rounded-xl text-sm outline-none" value={month} onChange={(e) => setMonth(e.target.value)} />
           </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border">
            <h4 className="text-[10px] font-black text-slate-400 text-center tracking-widest uppercase mb-6">Standard Active Fee Matrix</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {feeHeads.map((head: any) => (
              <div key={head.id} className="space-y-1">
               <div className="flex justify-between text-xs px-1">
                <span className="font-bold text-slate-600 uppercase">{head.name}</span>
                <button type="button" onClick={() => deleteFeeHeadMutation.mutate(head.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={12} /></button>
               </div>
               <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input type="number" placeholder="0.00" className="w-full border p-3 pl-8 rounded-xl text-sm outline-none focus:border-blue-500 bg-white" value={feeValues[head.id] || ''} onChange={(e) => handleFeeValueChange(head.id, e.target.value)} />
               </div>
              </div>
             ))}
            </div>
            <div className="mt-6 flex justify-center border-t pt-4">
              <button type="button" onClick={handleCloneLastMonthFees} className="px-4 py-2 border text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-black uppercase rounded-lg flex items-center gap-2"><RefreshCw size={12} /> Sync Copy Past Month Dues</button>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="text-center sm:text-left">
             <span className="text-[10px] text-blue-400 font-black uppercase block tracking-wider">Gross Payable Collection Amount</span>
             <h2 className="text-3xl font-black text-white">₹ {totalAmountValue.toLocaleString()}</h2>
           </div>
           <button type="submit" disabled={loading} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-blue-500 shadow-md">
             {loading ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Save Accounting Entry
           </button>
          </div>
        </form>
       </div>

       {/* PART 3: DESK REMINDERS & SEARCH VIEW */}
       <div className="p-8 border rounded-3xl bg-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-black uppercase">Active Pending Registry</h2>
            <p className="text-xs text-slate-400">Total Found: {pendingReminders.length} {waSearch || classFilterWa ? `(Filtered to: ${filteredReminders.length})` : ''}</p>
          </div>
          <div className="flex gap-2">
            <div className="border p-1 bg-slate-50 rounded-xl flex">
               <button onClick={() => setShowAllMonths(false)} className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg ${!showAllMonths ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Current Month</button>
               <button onClick={() => setShowAllMonths(true)} className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg ${showAllMonths ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Lifetime All</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Filter student record dynamically..." className="w-full border p-3 pl-10 rounded-xl text-sm outline-none bg-slate-50" value={waSearch} onChange={(e) => setWaSearch(e.target.value)} />
          </div>
          <div className="relative">
            <select className="w-full border p-3 rounded-xl text-sm appearance-none outline-none bg-slate-50 pr-8" value={classFilterWa} onChange={(e) => setClassFilterWa(e.target.value)}>
              <option value="">All Standard Classes</option>
              {Array.from(new Set(students.map((s: any) => s.class_name))).map((cls: any) => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>
        </div>

        <div className="border-b pb-4 flex justify-between items-center text-xs">
          <button onClick={() => {
            if (selectedFeeIds.length === filteredReminders.length) setSelectedFeeIds([]);
            else setSelectedFeeIds(filteredReminders.map((f: any) => f.id.toString()));
          }} className="text-blue-600 font-bold hover:underline">
            {selectedFeeIds.length === filteredReminders.length && filteredReminders.length > 0 ? 'Deselect All Checkboxes' : 'Select All In View'}
          </button>
          {selectedFeeIds.length > 0 && (
            <div className="flex gap-2">
              <button onClick={handleBulkMarkAsPaid} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold border hover:bg-blue-600 hover:text-white transition-colors">Mark {selectedFeeIds.length} Paid</button>
              <button onClick={startSequentialReminders} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg font-bold border hover:bg-emerald-600 hover:text-white transition-colors">Send to Selected Batch</button>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {remLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs uppercase"><RefreshCw className="animate-spin inline mr-2 text-emerald-500" size={16} /> Parsing database files...</div>
          ) : filteredReminders.length > 0 ? (
            filteredReminders.map((fee: any) => (
              <div key={fee.id} className="p-4 bg-slate-50 border rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 transition-all hover:bg-white hover:border-emerald-200">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <input type="checkbox" checked={selectedFeeIds.includes(fee.id.toString())} onChange={(e) => {
                    if (e.target.checked) setSelectedFeeIds([...selectedFeeIds, fee.id.toString()]);
                    else setSelectedFeeIds(selectedFeeIds.filter(id => id !== fee.id.toString()));
                  }} className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded border-slate-300 cursor-pointer" />
                  <div className="w-10 h-10 bg-white border font-black text-xs flex items-center justify-center rounded-lg shadow-sm text-slate-700">C-{fee._student?.class_name || '??'}</div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 uppercase leading-none">{fee._student?.full_name || `Un-linked Account (ID:${fee.student_id})`}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Amount: <span className="text-slate-700 font-bold">₹{fee.total_amount}</span> • Target Period: {fee.month}</p>
                  </div>
                </div>
                <button onClick={() => handleSendReminder(fee)} disabled={!fee._student?.contact_number} className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-emerald-600 hover:text-white text-emerald-600 border border-emerald-100 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-30">
                  <Send size={12} /> Send WhatsApp
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed rounded-xl">Registry ledger is clean for current parameters.</div>
          )}
        </div>
       </div>
     </div>

     {/* --- SIDEBAR INSIGHTS PANELS --- */}
     <div className="space-y-8">
       {/* ANALYTICS CARD */}
       <div className="p-6 border rounded-3xl bg-white shadow-sm relative overflow-hidden">
         <h3 className="text-xs font-black text-slate-400 uppercase mb-6 pl-1">Accounts Analytics</h3>
         <div className="space-y-4">
           <div className="p-4 bg-slate-50 border rounded-xl">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Net Gross Collected</span>
             <p className="text-2xl font-black text-slate-900 mt-1">₹ {feeStats.totalCollected?.toLocaleString() || 0}</p>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-50 border rounded-xl">
               <span className="text-[9px] font-black text-slate-400 uppercase block">Pending Nodes</span>
               <p className="text-xl font-black text-amber-600 mt-0.5">{feeStats.totalPending || 0}</p>
             </div>
             <div className="p-4 bg-slate-50 border rounded-xl">
               <span className="text-[9px] font-black text-slate-400 uppercase block">Late Overdues</span>
               <p className="text-xl font-black text-rose-500 mt-0.5">{feeStats.overdue || 0}</p>
             </div>
           </div>
         </div>
       </div>

       {/* CAMERA SCAN QUICK CARD */}
       <div className="p-6 bg-slate-900 text-white rounded-3xl border">
          <div className="flex items-center gap-4 mb-4">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center"><Camera size={16} /></span>
            <h4 className="font-black text-sm uppercase">Quick Verification Desk</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">Point current camera at any generated student barcode card to look configuration metrics instantly.</p>
          <button onClick={() => { setScannedStudent(null); setShowScanner(true); }} className="w-full py-3 bg-blue-600 text-white font-bold text-xs uppercase rounded-xl shadow-lg hover:bg-blue-500 transition-colors">
            {scanLoading ? 'Parsing file...' : 'Initialize Hardware Scanner'}
          </button>

          {/* QUICKLOOKUP RESULTS SHEET */}
          <AnimatePresence>
            {scannedStudent && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 bg-white text-slate-900 rounded-2xl p-4 border shadow-xl">
                <div className="flex items-center gap-3 pb-3 border-b">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-lg font-black text-sm flex items-center justify-center">{scannedStudent.full_name?.charAt(0)}</div>
                  <div>
                    <h5 className="font-black text-sm uppercase leading-none">{scannedStudent.full_name}</h5>
                    <p className="text-[10px] text-slate-400 mt-1">Class: {scannedStudent.class_name} • Roll: #{scannedStudent.roll_no}</p>
                  </div>
                </div>
                <div className="pt-3 flex gap-2">
                  <button onClick={() => { setSelectedStudent(scannedStudent.student_id); setScannedStudent(null); }} className="flex-1 p-2 bg-blue-50 hover:bg-blue-600 hover:text-white transition-colors text-[10px] font-black text-blue-600 uppercase rounded-lg">Assign Fee</button>
                  <button onClick={() => { setScannedStudent(null); }} className="p-2 border text-[10px] font-black uppercase rounded-lg text-slate-400 hover:bg-slate-50">Dismiss</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
       </div>

       {/* RECENT SETTLEMENT ENGINE */}
       <div className="p-6 border rounded-3xl bg-white min-h-[400px] flex flex-col justify-between">
         <div>
           <h3 className="text-xs font-black text-slate-400 uppercase mb-6 pl-1">Live Transaction Feeds</h3>
           <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
             {recentPayments.length > 0 ? recentPayments.map((p: any) => (
               <div key={p.id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between transition-all hover:bg-white">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><CheckCircle size={14} /></div>
                   <div>
                     <p className="font-black text-xs text-slate-800 uppercase leading-none">{p.students?.full_name || 'N/A'}</p>
                     <p className="text-[10px] text-slate-400 mt-1">₹{p.total_amount} • {p.month}</p>
                   </div>
                 </div>
                 <ArrowRight size={14} className="text-slate-300" />
               </div>
             )) : (
               <div className="text-center py-12 text-slate-300 text-xs uppercase">No feed logs recorded.</div>
             )}
           </div>
         </div>
         <button onClick={() => navigate('/admin/records')} className="w-full py-3.5 bg-slate-50 text-slate-400 text-[10px] font-black uppercase border border-slate-100 rounded-xl hover:bg-slate-900 hover:text-white transition-colors mt-4">Audit Complete History ledger →</button>
       </div>
     </div>
    </div>

    {/* --- AUTOMATION MODAL WINDOW --- */}
    <AnimatePresence>
      {automation.isOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-8 w-full max-w-md border shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg uppercase">WhatsApp Dispatch Terminal</h3>
              <button onClick={() => setAutomation(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
            </div>
            <div className="space-y-6">
               <label className="flex items-center gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100 cursor-pointer">
                  <input type="checkbox" checked={isAutoAdvancing} onChange={(e) => setIsAutoAdvancing(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                  <div className="text-xs font-black text-emerald-800 uppercase">Enable Sync Auto-Advance (3.5s Delay)</div>
               </label>
               <div className="bg-slate-50 p-6 rounded-2xl border text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Queue Stack: {automation.currentIndex + 1} / {automation.students.length}</p>
                  <h4 className="text-xl font-black uppercase text-slate-900 leading-none">{automation.students[automation.currentIndex]?._student?.full_name}</h4>
                  <p className="text-xs text-slate-500 mt-2 font-bold">Class {automation.students[automation.currentIndex]?._student?.class_name} • Outstanding: ₹{automation.students[automation.currentIndex]?.total_amount}</p>
               </div>
               <button onClick={nextSequentialReminder} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg">
                  <Send size={14} /> Open Chat & Move Forward
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* --- HARDWARE DIALOG MODAL --- */}
    <AnimatePresence>
      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative flex flex-col gap-4">
             <div className="flex justify-between items-center">
               <h3 className="font-black uppercase text-sm">Hardware Camera Mount</h3>
               <button onClick={() => setShowScanner(false)} className="p-2 border rounded-xl hover:bg-slate-50"><X size={16} /></button>
             </div>
             <div id="reader" className="w-full rounded-2xl overflow-hidden border bg-black min-h-[280px]"></div>
          </div>
        </div>
      )}
    </AnimatePresence>

    {/* --- MODAL FALLBACKS: DEFAULTERS & MANAGEMENT HEADS --- */}
    <AnimatePresence>
      {showDefaultersModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-8 w-full max-w-3xl max-h-[85vh] flex flex-col border shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase">Outstanding Accounts Ledger</h3>
              <button onClick={() => setShowDefaultersModal(false)} className="p-2 hover:bg-slate-50 rounded-xl"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 border-t pt-4">
              {filteredReminders.map((fee: any) => {
                const s = fee._student;
                return (
                  <div key={fee.id} className="p-4 bg-slate-50 border rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-black text-slate-800 text-sm uppercase leading-none">{s?.full_name || 'System Student Account'}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Class {s?.class_name || 'N/A'} • Period: {fee.month}</p>
                    </div>
                    <span className="text-rose-500 font-black text-sm">₹ {fee.total_amount}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showHeadsModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-lg border shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase">Configure Global Categories</h3>
              <button onClick={() => setShowHeadsModal(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input type="text" placeholder="e.g. Computer Science Lab Fee" className="w-full border p-3 rounded-xl text-sm outline-none bg-slate-50" value={newHeadName} onChange={(e) => setNewHeadName(e.target.value)} />
                <button onClick={() => { if(!newHeadName) return; addFeeHeadMutation.mutate(newHeadName, { onSuccess: () => { setNewHeadName(''); toast.success('Category Configured Successfully!'); } }); }} className="px-6 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase">Append</button>
              </div>
              <div className="max-h-[220px] overflow-y-auto space-y-2 pt-2 border-t">
                {feeHeads.map((head: any) => (
                  <div key={head.id} className="p-3.5 bg-slate-50 rounded-xl flex justify-between items-center border">
                    <span className="font-black text-xs text-slate-700 uppercase tracking-wide">{head.name}</span>
                    <button onClick={() => { if(window.confirm('Delete this Category Matrix permanently?')) deleteFeeHeadMutation.mutate(head.id); }} className="text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

   </div>
  </div>
 );
}
