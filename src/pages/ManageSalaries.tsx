import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
        supabase.from('fees').select('total_amount, status, created_at'),
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
        new Date(b.created_at || b.created_at).getTime() - new Date(a.created_at).getTime()
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-8 uppercase tracking-[-0.03em]">
            💼 Accounting Dashboard
          </h1>
          <p className="text-2xl text-gray-600 font-semibold max-w-2xl mx-auto">
            Real-time Profit & Loss tracking for complete financial overview
          </p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <motion.div className="bg-white/90 p-12 rounded-4xl shadow-3xl border border-indigo-100 backdrop-blur-xl group hover:shadow-4xl transition-all duration-500 hover:-translate-y-4">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">💰</div>
            <div className="text-5xl font-black text-green-600 mb-4">
              ₹{stats.totalRevenue.toLocaleString()}
            </div>
            <div className="text-2xl font-bold text-gray-700 uppercase tracking-wider">Total Revenue</div>
          </motion.div>

          <motion.div className="bg-white/90 p-12 rounded-4xl shadow-3xl border border-red-100 backdrop-blur-xl group hover:shadow-4xl transition-all duration-500 hover:-translate-y-4">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">💸</div>
            <div className="text-5xl font-black text-red-600 mb-4">
              ₹{stats.totalExpense.toLocaleString()}
            </div>
            <div className="text-2xl font-bold text-gray-700 uppercase tracking-wider">Total Expense</div>
          </motion.div>

          <motion.div className={`bg-white/90 p-12 rounded-4xl shadow-3xl border backdrop-blur-xl group hover:shadow-4xl transition-all duration-500 hover:-translate-y-4 ${
            stats.netProfit >= 0 
              ? 'border-green-200' 
              : 'border-red-200'
          }`}>
            <div className={`text-6xl mb-6 group-hover:scale-110 transition-transform ${
              stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.netProfit >= 0 ? '📈' : '📉'}
            </div>
            <div className={`text-5xl font-black mb-4 ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{stats.netProfit.toLocaleString()}
            </div>
            <div className="text-2xl font-bold text-gray-700 uppercase tracking-wider">Net Profit</div>
          </motion.div>

          <motion.div className="bg-white/90 p-12 rounded-4xl shadow-3xl border border-blue-100 backdrop-blur-xl group hover:shadow-4xl transition-all duration-500 hover:-translate-y-4">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">📊</div>
            <div className="text-5xl font-black text-blue-600 mb-4">{stats.collectionRate}%</div>
            <div className="text-2xl font-bold text-gray-700 uppercase tracking-wider">Collection Rate</div>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} 
          className="bg-white/90 backdrop-blur-3xl p-12 rounded-4xl shadow-4xl border border-gray-200 max-h-[70vh] overflow-y-auto">
          <h2 className="text-5xl font-black text-gray-900 mb-12 uppercase tracking-tight flex items-center gap-6">
            📋 Recent Transactions
          </h2>
          
          <div className="space-y-6">
            {recentTransactions.map((transaction: any, index: number) => (
              <motion.div 
                key={transaction.id || index}
                initial={{ opacity: 0, x: 50 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: index * 0.05 }}
                className="flex justify-between items-center p-10 bg-gradient-to-r from-gray-50 to-blue-50 rounded-4xl border-l-8 border-blue-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group"
              >
                <div>
                  <div className="text-3xl font-black text-gray-900 mb-2 group-hover:text-blue-700">
                    {transaction.teacher_name || 'Fee Collection'}
                  </div>
                  <div className="text-xl text-gray-600">
                    {transaction.month || new Date(transaction.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-black ${
                    transaction.status === 'Paid' || transaction.teacher_name 
                      ? 'text-green-600' 
                      : 'text-orange-600'
                  }`}>
                    {transaction.status === 'Paid' || transaction.teacher_name 
                      ? '+₹' + Number(transaction.total_amount || transaction.net_salary || 0).toLocaleString()
                      : '-₹' + Number(transaction.net_salary || 0).toLocaleString()
                    }
                  </div>
                  <div className="text-lg text-gray-500 capitalize">{transaction.status || 'Salary'}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            onClick={fetchAccountingData}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-12 px-16 rounded-4xl font-black text-2xl uppercase tracking-wider shadow-4xl hover:shadow-5xl transition-all duration-500 flex items-center justify-center gap-6 col-span-full md:col-span-1"
          >
            🔄 Refresh Data
          </motion.button>
          <motion.button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-12 px-16 rounded-4xl font-black text-2xl uppercase tracking-wider shadow-4xl hover:shadow-5xl transition-all duration-500 flex items-center justify-center gap-6 col-span-full md:col-span-1">
            📊 Export Report
          </motion.button>
          <motion.button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-12 px-16 rounded-4xl font-black text-2xl uppercase tracking-wider shadow-4xl hover:shadow-5xl transition-all duration-500 flex items-center justify-center gap-6 col-span-full md:col-span-1">
            💰 Add Expense
          </motion.button>
        </div>
      </div>
    </div>
  );
};



export default ManageSalaries;
