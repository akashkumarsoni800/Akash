import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Plus, Search, Users, Calendar, 
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
    try {
      const [{ data: stdData }, { data: headData }, { data: statsData }, { data: paymentsData }, { data: autoData }] = 
        await Promise.all([
          supabase.from('students').select('*').order('full_name'),
          supabase.from('fee_heads').select('*').order('id'),
          supabase.from('fees').select('status, total_amount'),
          supabase.from('fees')
            .select(`*, students(full_name, class_name, contact_number)`)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase.from('auto_fee_settings').select('*').eq('id', 'default').maybeSingle()
        ]);

      setStudents(stdData || []);
      setFeeHeads(headData || []);
      setAutoFeeSettings(autoData);
      
      if (headData) {
        const initialValues: any = {};
        headData.forEach((h: any) => initialValues[h.id] = 0);
        setFeeValues(initialValues);
      }

      if (autoData?.enabled) {
        const nextDate = new Date();
        nextDate.setDate(autoData.send_day || 1);
        if (nextDate < new Date()) nextDate.setMonth(nextDate.getMonth() + 1);
        setNextAutoSend(nextDate.toLocaleDateString('en-IN'));
      }

      const feeArray = statsData || [];
      const pendingCount = feeArray.filter((f: any) => f.status === 'Pending').length;
      const collectedAmount = feeArray.reduce((sum: number, f: any) => 
        f.status === 'Paid' ? sum + (Number(f.total_amount) || 0) : sum, 0);
      
      setFeeStats({
        totalPending: pendingCount,
        totalCollected: collectedAmount,
        overdue: feeArray.filter((f: any) => f.status === 'Overdue').length,
        collectionRate: feeArray.length ? Math.round((collectedAmount / feeArray.reduce((sum: number, f: any) => sum + (Number(f.total_amount) || 0), 0)) * 100) : 0
      });
      
      setRecentPayments(paymentsData || []);
    } catch (error: any) {
      toast.error("Error loading initial data");
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
        <div className="flex justify-between items-end">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic">Fee Management</h1>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2 italic">Institutional Billing ASM v3.0</p>
           </motion.div>
           <button onClick={() => setBulkMode(!bulkMode)} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${bulkMode ? 'bg-orange-500 text-white shadow-xl shadow-orange-100' : 'bg-white text-gray-400 border border-gray-100'}`}>
              {bulkMode ? '🚀 Bulk Mode: ON' : 'Single Entry'}
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Assignment Form */}
          <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl shadow-gray-200/50 border border-gray-50">
             <form onSubmit={handleAssignFee} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2 italic">1. Target {bulkMode ? 'Class' : 'Student'}</label>
                      {bulkMode ? (
                        <select className="w-full p-5 bg-gray-50 rounded-2xl font-black text-indigo-900 border-none outline-none focus:ring-2 focus:ring-indigo-100 appearance-none" value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)}>
                           <option value="">Choose Class</option>
                           {[...new Set(students.map(s => s.class_name))].map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                      ) : (
                        <select className="w-full p-5 bg-gray-50 rounded-2xl font-black text-indigo-900 border-none outline-none focus:ring-2 focus:ring-indigo-100" value={selectedStudent} onChange={(e)=>setSelectedStudent(e.target.value)}>
                           <option value="">Select Candidate</option>
                           {students.map(s => <option key={s.student_id} value={s.student_id}>{s.full_name} ({s.class_name})</option>)}
                        </select>
                      )}
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2 italic">2. Billing Cycle</label>
                      <input type="month" className="w-full p-5 bg-gray-50 rounded-2xl font-black text-indigo-900 border-none outline-none focus:ring-2 focus:ring-indigo-100" value={month} onChange={(e)=>setMonth(e.target.value)} required />
                   </div>
                </div>

                <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-dashed border-gray-200">
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Setup Breakdown</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {feeHeads.map(head => (
                        <div key={head.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-gray-50">
                           <span className="font-black text-xs text-gray-500 uppercase italic">{head.name}</span>
                           <input type="number" placeholder="0" className="w-24 text-right font-black text-indigo-600 border-none focus:ring-0" 
                            value={feeValues[head.id] || ''}
                            onChange={(e) => handleFeeValueChange(head.id, e.target.value)} />
                        </div>
                      ))}
                   </div>
                </div>

                <div className="flex items-center justify-between bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
                   <div>
                      <p className="text-[10px] font-black uppercase opacity-60 italic">Total Payable</p>
                      <h2 className="text-4xl font-black tracking-tighter">₹ {totalAmountValue.toLocaleString()}</h2>
                   </div>
                   <button disabled={loading} className="bg-white text-indigo-900 px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-xl disabled:opacity-50">
                      {loading ? 'Processing...' : '💾 Confirm Entry'}
                   </button>
                </div>
             </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
             <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-50">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 italic">Quick Stats</h3>
                <div className="space-y-4">
                   <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[9px] font-black text-indigo-400 uppercase">Collected Total</p>
                      <p className="text-2xl font-black text-indigo-900">₹{feeStats.totalCollected.toLocaleString()}</p>
                   </div>
                   <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
                      <p className="text-[9px] font-black text-rose-400 uppercase">Pending Slips</p>
                      <p className="text-2xl font-black text-rose-900">{feeStats.totalPending}</p>
                   </div>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-50 h-[400px] flex flex-col overflow-hidden">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 italic">Live Feed</h3>
                <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                   {recentPayments.map(p => (
                     <div key={p.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center group hover:bg-white hover:border-indigo-200 transition-all">
                        <div>
                           <p className="font-black text-xs text-gray-900 uppercase italic leading-tight">{p.students?.full_name}</p>
                           <p className="text-[9px] font-bold text-gray-400 uppercase">₹{p.total_amount} - {p.month}</p>
                        </div>
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{p.status}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageFees;
