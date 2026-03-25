import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Activity, CheckCircle, FileText,
  ShieldCheck, Zap, Info, Star, ChevronRight, Layout,
  Wallet, ArrowUpRight, ArrowDownRight, RefreshCw,
  Database, BarChart3, Receipt
} from 'lucide-react';

const ManageSalaries = () => {
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

      const collectedFees = feeData?.filter((f: any) => f.status === 'Paid')
        .reduce((sum: number, f: any) => sum + Number(f.total_amount || 0), 0) || 0;
      
      const totalSalaryExpense = salaryData?.filter((s: any) => s.status === 'Paid')
        .reduce((sum: number, s: any) => sum + Number(s.net_salary || 0), 0) || 0;
      
      const inventoryValue = inventoryData?.reduce((sum: number, i: any) => 
        sum + Number(i.total_value || 0), 0) || 0;

      setStats({
        totalRevenue: collectedFees,
        totalExpense: totalSalaryExpense + inventoryValue,
        netProfit: collectedFees - (totalSalaryExpense + inventoryValue),
        collectionRate: feeData?.length ? Math.round((collectedFees / feeData.reduce((sum: number, f: any) => sum + Number(f.total_amount || 0), 0)) * 100) : 0
      });

      setRecentTransactions([...(feeData || []), ...(salaryData || [])].sort((a: any, b: any) => 
        new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
      ).slice(0, 10));

    } catch (error: any) {
      toast.error('Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && recentTransactions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
         <div className="relative">
            <RefreshCw size={60} className="animate-spin text-indigo-600/20"/>
            <Database size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" />
         </div>
         <p className="font-black   text-slate-400 text-[10px] mt-8 text-center px-10">Synchronizing Institutional Ledger...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] py-12 px-4 md:px-10 pb-32">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-center md:text-left">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900   leading-none uppercase">
                Financial<br/>
                <span className="text-indigo-600">Vault</span>
              </h1>
              <p className="text-slate-400 font-black  text-[10px]  mt-4 flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck size={12} className="text-indigo-500" /> Authorized Institutional Economic Oversight v4.2
              </p>
           </motion.div>
           
           <div className="flex flex-wrap items-center justify-center gap-4">
              <button 
                onClick={fetchAccountingData}
                className="premium-button-admin bg-white text-slate-900 hover:bg-slate-50 border-slate-100 shadow-sm"
              >
                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" /> Sync Ledger
              </button>
              <button 
                className="premium-button-admin bg-slate-900 text-white hover:bg-indigo-600 border-none shadow-2xl"
              >
                <FileText size={18} className="group-hover:translate-x-1 transition-transform" /> Export Audit
              </button>
           </div>
        </div>

        {/* --- KPI TIERS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
           <StatCard 
             label="Gross Revenue" 
             value={stats.totalRevenue} 
             subText={`${stats.collectionRate}% Efficient`} 
             icon={ArrowUpRight} 
             color="emerald" 
             delay={0.1} 
           />
           <StatCard 
             label="Operational Burn" 
             value={stats.totalExpense} 
             subText="Salaries & Inventory" 
             icon={ArrowDownRight} 
             color="rose" 
             delay={0.2} 
           />
           <StatCard 
             label="Net Reserve" 
             value={stats.netProfit} 
             subText="Liquid Capital Assets" 
             icon={Wallet} 
             color="indigo" 
             delay={0.3} 
             main 
           />
           <StatCard 
             label="Yield efficiency" 
             value={stats.collectionRate} 
             suffix="%" 
             subText="Against Target" 
             icon={BarChart3} 
             color="blue" 
             delay={0.4} 
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {/* --- TRANSACTION LEDGER --- */}
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             className="lg:col-span-2 bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden group"
           >
              <div className="p-10 md:p-14 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                 <div className="space-y-3">
                    <h2 className="text-3xl font-black text-slate-900    leading-none uppercase">Transaction<br/><span className="text-indigo-600 uppercase">Ledger</span></h2>
                    <p className="text-[9px] font-black text-slate-400   leading-none">Real-time Accounting Stream</p>
                 </div>
                 <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-slate-900  tracking-widest ">Nodes Active</span>
                 </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-300   bg-slate-50/30">
                      <th className="px-12 py-8">Entity Identity</th>
                      <th className="px-12 py-8">Timeline</th>
                      <th className="px-12 py-8 text-center">Payload</th>
                      <th className="px-12 py-8 text-right">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentTransactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-all group/row">
                        <td className="px-12 py-8">
                           <p className="font-black text-slate-900  text-sm  tracking-tight group-hover/row:text-indigo-600 transition-colors">
                             {tx.teacher_name || 'System Fee Collection'}
                           </p>
                           <p className="text-[8px] font-black text-slate-400  tracking-widest mt-1">IV-TX-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                        </td>
                        <td className="px-12 py-8">
                           <p className="text-[10px] font-black text-slate-400  tracking-widest ">
                             {tx.month || new Date(tx.created_at || tx.updated_at).toLocaleDateString('en-IN')}
                           </p>
                        </td>
                        <td className="px-12 py-8 text-center">
                           <p className={`text-xl font-black   ${tx.teacher_name ? 'text-rose-500' : 'text-emerald-500'}`}>
                             {tx.teacher_name ? '-' : '+'}₹{(tx.total_amount || tx.net_salary || 0).toLocaleString()}
                           </p>
                        </td>
                        <td className="px-12 py-8 text-right">
                           <span className={`px-5 py-2 rounded-xl text-[9px] font-black  tracking-widest border  ${
                             tx.teacher_name ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                           }`}>
                             {tx.teacher_name ? 'Disbursement' : 'Inward Fund'}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {recentTransactions.length === 0 && (
                <div className="py-40 flex flex-col items-center justify-center text-center opacity-20">
                  <Receipt size={80} className="text-slate-300 mb-6" />
                  <p className="font-black   text-slate-400 text-[12px]">Awaiting Sequential Records...</p>
                </div>
              )}
           </motion.div>

           {/* --- SYSTEM STATS & HELP --- */}
           <div className="space-y-10">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 opacity-20 blur-3xl rounded-full" />
                 <h3 className="text-[10px] font-black text-indigo-400   mb-12 relative z-10 uppercase">Vault Health</h3>
                 <div className="space-y-10 relative z-10">
                    <div className="flex justify-between items-end border-b border-white/5 pb-8">
                       <p className="text-[9px] font-black text-slate-400  tracking-widest">Node Reliability</p>
                       <p className="text-3xl font-black  text-emerald-400">99.9%</p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-8">
                       <p className="text-[9px] font-black text-slate-400  tracking-widest">Sync Frequency</p>
                       <p className="text-xl font-black  ">5 Min Interval</p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-8">
                       <p className="text-[9px] font-black text-slate-400  tracking-widest">Authorization</p>
                       <p className="text-xl font-black   text-indigo-400">Level 09 Root</p>
                    </div>
                 </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shadow-inner">
                       <Info size={20} />
                    </div>
                    <h4 className="text-lg font-black text-slate-900  ">Audit direct</h4>
                 </div>
                 <ul className="space-y-6">
                    <li className="flex items-start gap-5">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shadow-lg shadow-indigo-200" />
                       <p className="text-[11px] font-black text-slate-500 leading-relaxed">All outward disbursements require Level 07+ biometric authorization.</p>
                    </li>
                    <li className="flex items-start gap-5">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shadow-lg shadow-indigo-200" />
                       <p className="text-[11px] font-black text-slate-500 leading-relaxed">Inward revenue is tracked via unique IV-TX identifier protocols.</p>
                    </li>
                    <li className="flex items-start gap-5">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shadow-lg shadow-indigo-200" />
                       <p className="text-[11px] font-black text-slate-500 leading-relaxed">Net reserve reflects calculated liquid capital post-inventory burn.</p>
                    </li>
                 </ul>
              </motion.div>
           </div>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ label, value, prefix = '₹', suffix = '', subText, icon: Icon, color, delay, main }: any) => {
  const colorClasses = {
    emerald: 'text-emerald-500 bg-emerald-50',
    rose: 'text-rose-500 bg-rose-50',
    indigo: 'bg-indigo-600 text-white shadow-[0_25px_50px_-12px_rgba(79,70,229,0.3)]',
    blue: 'text-blue-500 bg-blue-50'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ delay }}
      className={`rounded-[3.5rem] p-10 relative overflow-hidden group transition-all duration-500 hover:-translate-y-2 ${main ? colorClasses.indigo : 'bg-white border border-slate-100 shadow-sm'}`}
    >
      {!main && <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 opacity-20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 relative z-10 shadow-sm ${main ? 'bg-white/20' : colorClasses[color as keyof typeof colorClasses]}`}>
        <Icon size={24} />
      </div>
      <p className={`text-[10px] font-black   mb-2 relative z-10 ${main ? 'text-white/40' : 'text-slate-300'}`}>{label}</p>
      <h2 className={`text-4xl font-black  leading-none relative z-10 ${main ? 'text-white' : 'text-slate-900 group-hover:text-indigo-600'} transition-colors`}>{prefix}{value.toLocaleString()}{suffix}</h2>
      <div className="mt-6 flex items-center gap-3 relative z-10">
         <div className={`w-3 h-0.5 rounded-full ${main ? 'bg-white/20' : 'bg-slate-100'}`} />
         <p className={`text-[9px] font-black  tracking-widest ${main ? 'text-white/30' : 'text-slate-300'}`}>{subText}</p>
      </div>
    </motion.div>
  );
};

export default ManageSalaries;
