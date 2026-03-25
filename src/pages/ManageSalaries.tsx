import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Activity, CheckCircle, FileText 
} from 'lucide-react';

const ManageSalaries= () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpense: 0,
    netProfit: 0,
    collectionRate: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const fetchAccountingData = async () => {
    try {
      setLoading(true);
      
      const [{ data: feeData }, { data: salaryData }, { data: inventoryData }] = await Promise.all([
        supabase.from('fees').select('total_amount, status, updated_at'),
        supabase.from('teacher_salaries').select('net_salary, status'),
        supabase.from('inventory').select('total_value')
      ]);

      // Calculate stats
      const collectedFees = feeData?.filter((f: any) => f.status === 'Paid')
        .reduce((sum: number, f: any) => sum + Number(f.total_amount || 0), 0) || 0;
      
      const totalSalaryExpense = salaryData?.reduce((sum: number, s: any) => 
        sum + Number(s.net_salary || 0), 0) || 0;
      
      const inventoryValue = inventoryData?.reduce((sum: number, i: any) => 
        sum + Number(i.total_value || 0), 0) || 0;

      setStats({
        totalRevenue: collectedFees,
        totalExpense: totalSalaryExpense,
        netProfit: collectedFees - totalSalaryExpense,
        collectionRate: feeData?.length ? Math.round((collectedFees / feeData.reduce((sum: number, f: any) => sum + Number(f.total_amount || 0), 0)) * 100) : 0
      });

      setRecentTransactions([...(feeData || []), ...(salaryData || [])].sort((a: any, b: any) => 
        new Date(b.updated_at || b.updated_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
      ).slice(0, 10));

    } catch (error: any) {
      toast.error('Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-24 h-24 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-8"></div>
          <div className="text-3xl font-bold text-indigo-900">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                Financial<br/>
                <span className="text-indigo-600">Vault</span>
              </h1>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-4 flex items-center gap-2">
                <Activity size={12} className="text-indigo-500" /> Economic Integrity & Asset Monitoring
              </p>
           </motion.div>
           
           <div className="flex gap-4">
             <button onClick={fetchAccountingData} className="premium-button bg-white text-gray-900 px-6 py-4 flex items-center gap-2 text-[10px]">
               <Activity size={14} /> Sync Ledger
             </button>
             <button className="premium-button bg-indigo-600 text-white px-6 py-4 flex items-center gap-2 text-[10px]">
               <TrendingUp size={14} /> Export Audit
             </button>
           </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="premium-card p-8 bg-white border-transparent">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 font-black text-xl">₹</div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gross Revenue</p>
            <h2 className="text-3xl font-black text-emerald-600 tracking-tighter">₹ {stats.totalRevenue.toLocaleString()}</h2>
            <div className="mt-4 h-1 w-full bg-emerald-50 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.collectionRate}%` }}></div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="premium-card p-8 bg-white border-transparent">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 font-black text-xl">₹</div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Operational Burn</p>
            <h2 className="text-3xl font-black text-rose-600 tracking-tighter">₹ {stats.totalExpense.toLocaleString()}</h2>
            <p className="text-[9px] font-bold text-gray-400 mt-2 flex items-center gap-1">
              <Activity size={10} /> Salaries & Inventory
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="premium-card p-8 bg-indigo-600 border-transparent text-white ring-8 ring-indigo-50">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6">
               <TrendingUp size={24} />
            </div>
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Net Reserve</p>
            <h2 className="text-3xl font-black text-white tracking-tighter">₹ {stats.netProfit.toLocaleString()}</h2>
            <p className="text-[9px] font-bold text-white/40 mt-2 uppercase tracking-widest">Liquid Capital Assets</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="premium-card p-8 bg-white border-transparent">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 font-black text-xl">%</div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Efficient Yield</p>
            <h2 className="text-3xl font-black text-indigo-900 tracking-tighter">{stats.collectionRate}%</h2>
            <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-widest flex items-center gap-1">
              <CheckCircle size={10} className="text-indigo-500" /> Collection Target
            </p>
          </motion.div>
        </div>

        {/* Ledger */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-0 overflow-hidden border-transparent bg-white">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
              <FileText size={18} className="text-indigo-600" /> Transaction Ledger
            </h3>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">Live Feed</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                 <tr className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50/30">
                   <th className="px-8 py-4">Transaction Entity</th>
                   <th className="px-8 py-4">Timeline</th>
                   <th className="px-8 py-4">Amount</th>
                   <th className="px-8 py-4">Classification</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTransactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tighter">
                         {tx.teacher_name || 'System Fee Collection'}
                       </p>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                         {tx.month || new Date(tx.created_at || tx.updated_at).toLocaleDateString('en-IN')}
                       </p>
                    </td>
                    <td className="px-8 py-6">
                       <p className={`text-sm font-black ${tx.teacher_name ? 'text-rose-600' : 'text-emerald-600'}`}>
                         {tx.teacher_name ? '-' : '+'}₹{(tx.total_amount || tx.net_salary || 0).toLocaleString()}
                       </p>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                         tx.teacher_name ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                       }`}>
                         {tx.teacher_name ? 'Payroll' : 'Revenue'}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};



export default ManageSalaries;
