import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Plus, Search, Users, Calendar, ArrowRight,
  Wallet, Send, RefreshCw, Trash2, CheckCircle,
  ShieldCheck, Zap, Info, Star, ChevronRight, Layout, ChevronDown
} from 'lucide-react';

const ManageFees = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [feeHeads, setFeeHeads] = useState<any[]>([]);
  const [newHeadName, setNewHeadName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [month, setMonth] = useState('');
  const [feeValues, setFeeValues] = useState<any>({});
  const [bulkMode, setBulkMode] = useState(false);
  const [autoFeeSettings, setAutoFeeSettings] = useState<any>(null);
  const [nextAutoSend, setNextAutoSend] = useState('');
  const [feeStats, setFeeStats] = useState({ totalPending: 0, totalCollected: 0, overdue: 0, collectionRate: 0 });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const totalAmountValue = Object.values(feeValues).reduce((sum: number, val: any) => 
    sum + Number(val || 0), 0);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const fetchStudents = supabase.from('students').select('*').order('full_name');
      const fetchHeads = supabase.from('fee_heads').select('*').order('id');
      const fetchStats = supabase.from('fees').select('status, total_amount');
      const fetchPayments = supabase.from('fees')
        .select(`*, students(full_name, class_name, contact_number)`)
        .order('updated_at', { ascending: false })
        .limit(5);
      const fetchAuto = supabase.from('auto_fee_settings').select('*').eq('id', 'default').maybeSingle();

      const [stdRes, headRes, statsRes, paymentsRes, autoRes] = await Promise.allSettled([
        fetchStudents, fetchHeads, fetchStats, fetchPayments, fetchAuto
      ]);

      if (stdRes.status === 'fulfilled') setStudents(stdRes.value.data || []);
      if (headRes.status === 'fulfilled') {
        const heads = headRes.value.data || [];
        setFeeHeads(heads);
        const initialValues: any = {};
        heads.forEach((h: any) => initialValues[h.id] = 0);
        setFeeValues(initialValues);
      }
      if (autoRes.status === 'fulfilled') {
        const autoData = autoRes.value.data;
        setAutoFeeSettings(autoData);
        if (autoData?.enabled) {
          const nextDate = new Date();
          nextDate.setDate(autoData.send_day || 1);
          if (nextDate < new Date()) nextDate.setMonth(nextDate.getMonth() + 1);
          setNextAutoSend(nextDate.toLocaleDateString('en-IN'));
        }
      }

      if (statsRes.status === 'fulfilled') {
        const feeArray = statsRes.value.data || [];
        const pendingCount = feeArray.filter((f: any) => f.status === 'Pending').length;
        const collectedAmount = feeArray.reduce((sum: number, f: any) => 
          f.status === 'Paid' ? sum + (Number(f.total_amount) || 0) : sum, 0);
        
        setFeeStats({
          totalPending: pendingCount,
          totalCollected: collectedAmount,
          overdue: feeArray.filter((f: any) => f.status === 'Overdue').length,
          collectionRate: feeArray.length ? Math.round((collectedAmount / feeArray.reduce((sum: number, f: any) => sum + (Number(f.total_amount) || 0), 0)) * 100) : 0
        });
      }

      if (paymentsRes.status === 'fulfilled') setRecentPayments(paymentsRes.value.data || []);

      if (statsRes.status === 'rejected' || paymentsRes.status === 'rejected') {
        console.error("Fee table Error:", (statsRes as any).reason || (paymentsRes as any).reason);
        toast.error("Accounting data partially unavailable");
      }

    } catch (error: any) {
      toast.error("Critical System Error");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkMode && !selectedStudent) return toast.error("Please select a student");
    if (bulkMode && !selectedClass) return toast.error("Please select a class");
    if (!month) return toast.error("Please select a month");
    if (totalAmountValue <= 0) return toast.error("Total fee cannot be zero");

    try {
      setLoading(true);
      let error;
      
      if (bulkMode && selectedClass) {
        const classStudents = students.filter(s => s.class_name === selectedClass);
        if (classStudents.length === 0) throw new Error("No students found in this class");

        const feesToInsert = classStudents.map(student => ({
          student_id: student.student_id,
          month,
          fee_structure: feeValues,
          total_amount: totalAmountValue,
          status: 'Pending'
        }));
        
        const result = await supabase.from('fees').insert(feesToInsert);
        error = result.error;
      } else {
        const result = await supabase.from('fees').insert([{
          student_id: Number(selectedStudent), 
          month,
          fee_structure: feeValues,
          total_amount: totalAmountValue,
          status: 'Pending'
        }]);
        error = result.error;
      }

      if (error) throw error;
      toast.success("✅ Fee Assigned Successfully!");
      fetchInitialData();
      
      setSelectedStudent('');
      setMonth('');
      setFeeValues(Object.fromEntries(feeHeads.map(h => [h.id, 0])));
    } catch (error: any) {
      toast.error("Assignment Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeeValueChange = (headId: string, value: string) => {
    setFeeValues({ ...feeValues, [headId]: value });
  };

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
         <div className="relative">
            <RefreshCw size={60} className="animate-spin text-blue-600/20"/>
            <Wallet size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
         </div>
         <p className="font-black   text-slate-400 text-[10px] mt-8 text-center px-10">Initializing Fiscal Manifest...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] py-12 px-4 md:px-10 pb-32">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900   leading-none uppercase">
                Financial<br/>
                <span className="text-[var(--accent-admin)]">Oversight</span>
              </h1>
              <p className="text-slate-400 font-black  text-[10px]  mt-4 flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck size={12} className="text-[var(--accent-admin)]" /> Authorized Institutional Billing Suite v4.2
              </p>
           </motion.div>

           <div className="flex bg-white p-2 rounded-3xl border border-slate-100 shadow-sm relative z-20">
             <button 
               onClick={() => setBulkMode(false)} 
               className={`px-10 py-4 rounded-2xl font-black text-[10px]  tracking-widest transition-all ${!bulkMode ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-blue-600'}`}>
               Single Registry
             </button>
             <button 
               onClick={() => setBulkMode(true)} 
               className={`px-10 py-4 rounded-2xl font-black text-[10px]  tracking-widest transition-all ${bulkMode ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-blue-600'}`}>
               Bulk Distribution
             </button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
          
          {/* --- LEFT: MAIN CONFIG --- */}
          <div className="lg:col-span-2 space-y-10">
             <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               className="premium-card p-10 md:p-14 relative overflow-hidden group"
             >
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 blur-3xl rounded-full -mr-40 -mt-40 transition-transform duration-[4s] group-hover:scale-110"></div>
                
                <form onSubmit={handleAssignFee} className="space-y-12 relative z-10">
                   <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-10 border-b border-slate-50">
                      <div className="space-y-4 text-center md:text-left">
                        <h2 className="text-4xl font-black text-slate-900   leading-none uppercase">
                          Fiscal<br/>
                          <span className="text-[var(--accent-admin)]">Assignment</span>
                        </h2>
                        <p className="text-[10px] font-black text-slate-400  tracking-widest leading-none mt-1">Manual Account Distribution Terminal</p>
                      </div>
                      <div className="px-6 py-2.5 bg-blue-50 rounded-2xl text-[10px] font-black text-blue-600  tracking-widest border border-blue-100 shadow-sm">
                        Registry Active
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400   ml-2">Target Cohort/Candidate</label>
                         <div className="relative group/input">
                            <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-400 transition-colors" size={20} />
                            {bulkMode ? (
                              <select className="premium-input pl-16 appearance-none" value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)}>
                                 <option value="">Select Target Class</option>
                                 {[...new Set(students.map(s => s.class_name))].map(c => <option key={c} value={c}>Class {c} Division</option>)}
                              </select>
                            ) : (
                              <select className="premium-input pl-16 appearance-none" value={selectedStudent} onChange={(e)=>setSelectedStudent(e.target.value)}>
                                 <option value="">Identify Candidate</option>
                                 {students.map(s => <option key={s.student_id} value={s.student_id}>{s.full_name} — Roll #{s.roll_no}</option>)}
                              </select>
                            )}
                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400   ml-2">Billing Period</label>
                         <div className="relative group/input">
                            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-400 transition-colors" size={20} />
                            <input type="month" className="premium-input pl-16" value={month} onChange={(e)=>setMonth(e.target.value)} required />
                         </div>
                      </div>
                   </div>

                   <div className="bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 opacity-20 blur-3xl"></div>
                      <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-6 relative z-10">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                            <Plus size={20} />
                         </div>
                         <h3 className="text-[10px] font-black text-slate-400   leading-none uppercase">Structure Breakdown</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                         {feeHeads.map(head => (
                           <div key={head.id} className="bg-white p-6 rounded-2xl flex justify-between items-center border border-slate-100 hover:border-blue-200 transition-all hover:shadow-xl hover:-translate-y-1 group/item">
                              <span className="font-black text-[10px] text-slate-400  tracking-widest group-hover/item:text-blue-600 transition-colors">{head.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-200 font-black text-[9px] ">INR</span>
                                <input type="number" placeholder="0" className="w-24 text-right font-black text-slate-900 border-none focus:ring-0 text-xl bg-transparent" 
                                 value={feeValues[head.id] || ''}
                                 onChange={(e) => handleFeeValueChange(head.id, e.target.value)} />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group/btn flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover/btn:opacity-10 transition-opacity" />
                      <div className="text-center md:text-left mb-0 relative z-10">
                         <p className="text-[10px] font-black  text-blue-400  mb-2">Authenticated Total</p>
                         <h2 className="text-5xl md:text-6xl font-black text-white  leading-none uppercase">₹ {totalAmountValue.toLocaleString()}</h2>
                      </div>
                      <button disabled={loading} className="premium-button-admin bg-white text-slate-900 hover:bg-blue-600 hover:text-white border-none shadow-xl relative z-10 px-12">
                         {loading ? <RefreshCw size={24} className="animate-spin" /> : <ShieldCheck size={24} />}
                         {loading ? 'Processing...' : 'Authorize Transaction'}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>

          {/* --- RIGHT: INSIGHTS & FEED --- */}
          <div className="space-y-10">
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.2 }}
               className="premium-card p-12 relative overflow-hidden group"
             >
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/50 rounded-full blur-3xl opacity-50 transition-opacity duration-1000 group-hover:opacity-100"></div>
                <h3 className="text-[10px] font-black text-slate-300   mb-12 relative z-10 uppercase">
                  Fiscal Index
                </h3>
                <div className="space-y-8 relative z-10">
                   <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group/card hover:bg-slate-900 transition-all duration-700">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600 opacity-0 group-hover/card:opacity-10 blur-2xl transition-opacity"></div>
                      <p className="text-[9px] font-black text-slate-400 group-hover/card:text-blue-400  tracking-widest mb-3">Fund Allocation</p>
                      <p className="text-4xl font-black text-slate-900 group-hover/card:text-white ">₹{feeStats.totalCollected.toLocaleString()}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                         <p className="text-[8px] font-black text-slate-400  tracking-widest mb-2">Pending Units</p>
                         <p className="text-2xl font-black text-slate-900 ">{feeStats.totalPending}</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                         <p className="text-[8px] font-black text-slate-400  tracking-widest mb-2">Overdue Alert</p>
                         <p className="text-2xl font-black text-rose-500 ">{feeStats.overdue}</p>
                      </div>
                   </div>
                </div>
             </motion.div>

             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.3 }}
               className="premium-card p-12 flex flex-col min-h-[500px] relative group"
             >
                <div className="flex items-center justify-between mb-12">
                   <h3 className="text-[10px] font-black text-slate-300   uppercase">Transaction Feed</h3>
                   <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-200"></div>
                </div>
                <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                   {recentPayments.length > 0 ? recentPayments.map((p, idx) => (
                     <motion.div 
                       key={p.id} 
                       initial={{ opacity: 0, x: 10 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: 0.4 + idx * 0.1 }}
                       className="p-6 bg-slate-50/50 rounded-3xl border border-slate-50 flex justify-between items-center group/item hover:bg-white hover:shadow-2xl hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden"
                     >
                        <div className="flex items-center gap-5 relative z-10">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${p.status === 'Paid' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600 animate-pulse'}`}>
                             {p.status === 'Paid' ? <CheckCircle size={20}/> : <RefreshCw size={20} className="animate-spin" />}
                           </div>
                           <div>
                              <p className="font-black text-[12px] text-slate-800   leading-tight">{p.students?.full_name}</p>
                              <p className="text-[9px] font-black text-slate-400  tracking-widest mt-1.5">₹{p.total_amount} • {p.month}</p>
                           </div>
                        </div>
                        <ArrowRight size={16} className="text-slate-200 group-hover/item:text-blue-500 transition-transform group-hover/item:translate-x-1 relative z-10" />
                     </motion.div>
                   )) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 py-20">
                        <RefreshCw size={60} className="mb-6 animate-spin text-slate-300" />
                        <p className="text-[10px] font-black  tracking-widest">Awaiting Records...</p>
                     </div>
                   )}
                </div>
                <button className="mt-10 py-5 bg-slate-50 rounded-2xl text-[10px] font-black  text-slate-400 tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-inner border border-slate-100">
                   Audit Sequential Logs →
                </button>
             </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageFees;

