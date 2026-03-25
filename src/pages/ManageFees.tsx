import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Plus, Search, Users, Calendar, ArrowRight,
  Wallet, Send, RefreshCw, Trash2, CheckCircle 
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

  // ✅ Total Amount Calculation (Component Level पर रखा है ताकि ReferenceError न आए)
  const totalAmountValue = Object.values(feeValues).reduce((sum: number, val: any) => 
    sum + Number(val || 0), 0);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch each independently to prevent one table error from breaking others
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

      // Individual error reporting for debugging
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
    
    // Validation
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
          student_id: student.student_id, // ✅ DB Column: student_id
          month,
          fee_structure: feeValues,      // ✅ DB Column: fee_structure
          total_amount: totalAmountValue, // ✅ DB Column: total_amount
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
      
      // Form Reset
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
         {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                Fee<br/>
                <span className="text-indigo-600">Management</span>
              </h1>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-4 flex items-center gap-2">
                <Wallet size={12} className="text-indigo-500" /> Institutional Billing Suite v3.0
              </p>
           </motion.div>
           <div className="flex bg-white p-2 rounded-3xl border border-gray-100 shadow-sm">
             <button 
               onClick={() => setBulkMode(false)} 
               className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${!bulkMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-indigo-600'}`}>
               Single Entry
             </button>
             <button 
               onClick={() => setBulkMode(true)} 
               className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${bulkMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-indigo-600'}`}>
               Bulk Distribution
             </button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
          <div className="lg:col-span-2 space-y-10">
             <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 opacity-20 rounded-full -mr-32 -mt-32 transition-transform duration-[3s] group-hover:scale-110"></div>
                
                <form onSubmit={handleAssignFee} className="space-y-12 relative z-10">
                   <div className="flex items-center justify-between mb-2">
                      <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-4">
                        <Wallet size={28} className="text-emerald-500" /> Fiscal Assignment
                      </h2>
                      <div className="px-5 py-2 bg-emerald-50 rounded-xl text-[9px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100">
                        Registry Active
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                           Target Scope
                         </label>
                         {bulkMode ? (
                           <select className="premium-input w-full p-6 text-sm bg-slate-50 border-slate-100 focus:bg-white transition-all" value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)}>
                              <option value="">Select Target Class</option>
                              {[...new Set(students.map(s => s.class_name))].map(c => <option key={c} value={c}>Class {c} Division</option>)}
                           </select>
                         ) : (
                           <select className="premium-input w-full p-6 text-sm bg-slate-50 border-slate-100 focus:bg-white transition-all" value={selectedStudent} onChange={(e)=>setSelectedStudent(e.target.value)}>
                              <option value="">Identify Candidate</option>
                              {students.map(s => <option key={s.student_id} value={s.student_id}>{s.full_name} — Roll #{s.roll_no}</option>)}
                           </select>
                         )}
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                           Billing Period
                         </label>
                         <input type="month" className="premium-input w-full p-6 text-sm bg-slate-50 border-slate-100 focus:bg-white transition-all" value={month} onChange={(e)=>setMonth(e.target.value)} required />
                      </div>
                   </div>

                   <div className="bg-slate-50/50 p-10 rounded-[2rem] border border-slate-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 opacity-20 blur-3xl"></div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-8 flex items-center gap-2">
                        <Plus size={14} className="text-emerald-500" /> Fee Structure Breakdown
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                         {feeHeads.map(head => (
                           <div key={head.id} className="bg-white p-5 rounded-2xl flex justify-between items-center border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-md group">
                              <span className="font-black text-[10px] text-slate-500 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">{head.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-300 font-bold text-xs uppercase">INR</span>
                                <input type="number" placeholder="0" className="w-24 text-right font-black text-slate-900 border-none focus:ring-0 text-lg bg-transparent" 
                                 value={feeValues[head.id] || ''}
                                 onChange={(e) => handleFeeValueChange(head.id, e.target.value)} />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="flex flex-col md:flex-row items-center justify-between bg-white border-2 border-slate-900 p-8 rounded-[2.5rem] shadow-xl group">
                      <div className="text-center md:text-left mb-8 md:mb-0">
                         <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">Authenticated Total</p>
                         <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">₹ {totalAmountValue.toLocaleString()}</h2>
                      </div>
                      <button disabled={loading} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-emerald-600 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-200">
                         {loading ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                         {loading ? 'Processing...' : 'Authorize Transaction'}
                      </button>
                   </div>
                </form>
             </div>
          </div>

          <div className="space-y-10">
             <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 relative z-10 italic">
                  Fiscal Index
                </h3>
                <div className="space-y-6 relative z-10">
                   <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500 opacity-20 blur-2xl"></div>
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Fund Allocation</p>
                      <p className="text-3xl font-black text-white tracking-tighter italic">₹{feeStats.totalCollected.toLocaleString()}</p>
                   </div>
                   <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Pending Invoices</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tighter">{feeStats.totalPending}</p>
                   </div>
                </div>
             </div>

             <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col h-[600px] overflow-hidden group">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Transaction Feed</h3>
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-5 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                   {recentPayments.length > 0 ? recentPayments.map(p => (
                     <div key={p.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-50 flex justify-between items-center group-hover:bg-white group-hover:shadow-md group-hover:border-emerald-100 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 animate-pulse'}`}>
                             {p.status === 'Paid' ? <CheckCircle size={18}/> : <RefreshCw size={18}/>}
                           </div>
                           <div>
                              <p className="font-black text-[11px] text-slate-800 uppercase tracking-tighter leading-tight">{p.students?.full_name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">₹{p.total_amount} • {p.month}</p>
                           </div>
                        </div>
                        <ArrowRight size={14} className="text-slate-200 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" />
                     </div>
                   )) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
                        <RefreshCw size={40} className="mb-4 animate-spin-slow" />
                        <p className="text-[10px] font-black uppercase tracking-widest italic">Awaiting Records...</p>
                     </div>
                   )}
                </div>
                <button className="mt-8 py-4 bg-slate-50 rounded-2xl text-[9px] font-black uppercase text-slate-400 tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                  Open Audit Logs
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageFees;

