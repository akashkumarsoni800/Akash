import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const TeacherSalary = () => {
  const [salaries, setSalaries] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [salaryLoading, setSalaryLoading] = useState<{[key: string]: boolean}>({});
  const [newSalary, setNewSalary] = useState({
    teacher_id: '',
    teacher_name: '',
    designation: '',
    month: '',
    basic_salary: 0,
    hra: 0,
    allowances: 0,
    deductions: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: salaryData }, { data: teacherData }] = await Promise.all([
        supabase.from('teacher_salaries').select('*').order('month', { ascending: false }),
        supabase.from('teachers').select('id, full_name, role').order('full_name')
      ]);
      
      setSalaries(salaryData || []);
      setTeachers(teacherData || []);
      
      const totalExpense = salaryData?.reduce((sum: number, s: any) => sum + (s.net_salary || 0), 0) || 0;
      console.log('Total Salary Expense:', totalExpense);
    } catch (error: any) {
      toast.error('Failed to load salary data');
    }
  };

  const calculateNetSalary = () => {
    return Number(newSalary.basic_salary) + Number(newSalary.hra) + 
           Number(newSalary.allowances) - Number(newSalary.deductions);
  };

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const teacher = teachers.find(t => t.id === newSalary.teacher_id);
      const netSalary = calculateNetSalary();
      
      const { error } = await supabase.from('teacher_salaries').insert([{
        teacher_name: teacher?.full_name || newSalary.teacher_name,
        designation: teacher?.class_name || newSalary.designation,
        ...newSalary,
        net_salary: netSalary
      }]);
      
      if (error) throw error;
      
      toast.success('✅ Salary record added successfully!');
      setNewSalary({
        teacher_id: '',
        teacher_name: '',
        designation: '',
        month: '',
        basic_salary: 0,
        hra: 0,
        allowances: 0,
        deductions: 0
      });
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const markSalaryPaid = async (salaryId: string) => {
    setSalaryLoading(prev => ({...prev, [salaryId]: true}));
    try {
      const { error } = await supabase
        .from('teacher_salaries')
        .update({ status: 'Paid', paid_date: new Date().toISOString() })
        .eq('id', salaryId);
      
      if (error) throw error;
      toast.success('✅ Salary marked as paid!');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update status');
    } finally {
      setSalaryLoading(prev => ({...prev, [salaryId]: false}));
    }
  };

  const totalSalaryExpense = salaries.reduce((sum: number, s: any) => sum + (s.net_salary || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -100 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-20"
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-8 uppercase tracking-[-0.03em]">
            👨‍🏫 Teacher Salary
          </h1>
          <p className="text-2xl text-gray-600 font-semibold max-w-2xl mx-auto leading-relaxed">
            Complete salary management with WhatsApp notifications & payment tracking
          </p>
        </motion.div>

        {/* Total Expense Card */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 text-white p-16 rounded-4xl shadow-4xl mb-20 text-center max-w-2xl mx-auto"
        >
          <div className="text-7xl mb-8 animate-pulse">💸</div>
          <div className="text-6xl lg:text-7xl font-black mb-6 drop-shadow-2xl">
            ₹{totalSalaryExpense.toLocaleString()}
          </div>
          <p className="text-2xl uppercase tracking-widest font-bold opacity-95">Total Salary Expense</p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
          {/* Add New Salary Form */}
          <motion.div 
            initial={{ opacity: 0, x: -100 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="bg-white/95 backdrop-blur-3xl p-12 rounded-4xl shadow-4xl border border-white/50"
          >
            <h2 className="text-5xl font-black text-gray-900 mb-12 uppercase tracking-tight flex items-center gap-6">
              ➕ Add New Salary
            </h2>
            
            <form onSubmit={handleSalarySubmit} className="space-y-8">
              <div>
                <label className="block text-2xl font-black text-gray-700 mb-6 uppercase tracking-wide">
                  Teacher Name
                </label>
                <select 
                  value={newSalary.teacher_id}
                  onChange={(e) => {
                    const teacher = teachers.find(t => t.id === e.target.value);
                    setNewSalary({
                      ...newSalary,
                      teacher_id: e.target.value,
                      teacher_name: teacher?.full_name || '',
                      designation: teacher?.role || ''
                    });
                  }}
                  className="w-full p-8 border-2 border-gray-200 rounded-4xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 text-2xl font-bold transition-all h-24"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-2xl font-black text-gray-700 mb-6 uppercase tracking-wide">Month *</label>
                <input 
                  type="month" 
                  value={newSalary.month}
                  onChange={(e) => setNewSalary({...newSalary, month: e.target.value})}
                  className="w-full p-8 border-2 border-gray-200 rounded-4xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 text-2xl font-bold transition-all h-24"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-xl font-bold text-gray-700 mb-4 uppercase tracking-wide">Basic Salary</label>
                  <input 
                    type="number" 
                    value={newSalary.basic_salary}
                    onChange={(e) => setNewSalary({...newSalary, basic_salary: Number(e.target.value)})}
                    className="w-full p-8 border-2 border-gray-200 rounded-4xl focus:border-green-500 focus:ring-4 focus:ring-green-200 text-3xl font-black text-right transition-all h-24"
                    placeholder="₹25,000"
                  />
                </div>
                <div>
                  <label className="block text-xl font-bold text-gray-700 mb-4 uppercase tracking-wide">HRA (24%)</label>
                  <input 
                    type="number" 
                    value={newSalary.hra}
                    onChange={(e) => setNewSalary({...newSalary, hra: Number(e.target.value)})}
                    className="w-full p-8 border-2 border-gray-200 rounded-4xl focus:border-green-500 focus:ring-4 focus:ring-green-200 text-3xl font-black text-right transition-all h-24"
                    placeholder="₹6,000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-xl font-bold text-gray-700 mb-4 uppercase tracking-wide">Allowances</label>
                  <input 
                    type="number" 
                    value={newSalary.allowances}
                    onChange={(e) => setNewSalary({...newSalary, allowances: Number(e.target.value)})}
                    className="w-full p-8 border-2 border-gray-200 rounded-4xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 text-3xl font-black text-right transition-all h-24"
                    placeholder="₹2,000"
                  />
                </div>
                <div>
                  <label className="block text-xl font-bold text-gray-700 mb-4 uppercase tracking-wide">Deductions</label>
                  <input 
                    type="number" 
                    value={newSalary.deductions}
                    onChange={(e) => setNewSalary({...newSalary, deductions: Number(e.target.value)})}
                    className="w-full p-8 border-2 border-gray-200 rounded-4xl focus:border-red-500 focus:ring-4 focus:ring-red-200 text-3xl font-black text-right transition-all h-24"
                    placeholder="₹1,000"
                  />
                </div>
              </div>

              {/* Net Salary Display */}
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-12 rounded-4xl shadow-4xl text-center">
                <div className="text-6xl font-black mb-6 drop-shadow-2xl">
                  ₹{calculateNetSalary().toLocaleString()}
                </div>
                <p className="text-3xl uppercase tracking-widest font-bold opacity-95">Net Salary</p>
              </div>

              <motion.button 
                whileHover={{ scale: 1.08 }} 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-12 px-16 rounded-4xl font-black text-3xl uppercase tracking-widest shadow-4xl hover:shadow-5xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-6"
              >
                {loading ? (
                  <>
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    💾 <span>Add Salary Record</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Salary Records List */}
          <motion.div 
            initial={{ opacity: 0, x: 100 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="bg-white/95 backdrop-blur-3xl p-12 rounded-4xl shadow-4xl border border-white/50 overflow-y-auto max-h-[90vh]"
          >
            <h2 className="text-5xl font-black text-gray-900 mb-12 uppercase tracking-tight flex items-center gap-6">
              📋 Salary Records
              <span className="text-3xl bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent font-bold">
                {salaries.length}
              </span>
            </h2>
            
            <div className="space-y-8">
              {salaries.length === 0 ? (
                <div className="text-center py-32">
                  <div className="text-8xl mb-12 opacity-50">📭</div>
                  <h3 className="text-4xl font-bold text-gray-500 mb-4">No Salary Records</h3>
                  <p className="text-2xl text-gray-400">Add your first salary record above</p>
                </div>
              ) : (
                salaries.map((salary: any) => (
                  <motion.div 
                    key={salary.id}
                    initial={{ opacity: 0, y: 50 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="group p-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-4xl border-l-8 border-indigo-500 hover:shadow-4xl hover:-translate-y-4 transition-all duration-700 cursor-pointer relative overflow-hidden"
                  >
                    {/* Background shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h3 className="text-4xl font-black text-gray-900 group-hover:text-indigo-700 transition-colors mb-2">
                            {salary.teacher_name}
                          </h3>
                          <div className="flex items-center gap-6 text-2xl text-gray-600">
                            <span>{salary.designation}</span>
                            <span className="px-4 py-2 bg-blue-100 rounded-3xl text-blue-800 font-bold">
                              {salary.month}
                            </span>
                          </div>
                        </div>
                        <span className={`px-8 py-4 rounded-4xl text-2xl font-black shadow-2xl ${
                          salary.status === 'Paid' 
                            ? 'bg-green-100 text-green-800 border-4 border-green-400' 
                            : 'bg-orange-100 text-orange-800 border-4 border-orange-400 animate-pulse'
                        }`}>
                          {salary.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 p-8 bg-white/60 rounded-4xl backdrop-blur-xl">
                        <div className="text-center p-6">
                          <div className="text-4xl font-black text-green-600 mb-2">
                            ₹{Number(salary.basic_salary || 0).toLocaleString()}
                          </div>
                          <div className="text-xl text-gray-600 uppercase tracking-wider font-bold">Basic</div>
                        </div>
                        <div className="text-center p-6">
                          <div className="text-4xl font-black text-blue-600 mb-2">
                            ₹{Number(salary.hra || 0).toLocaleString()}
                          </div>
                          <div className="text-xl text-gray-600 uppercase tracking-wider font-bold">HRA</div>
                        </div>
                        <div className="text-center p-6">
                          <div className="text-3xl font-bold text-red-600 mb-2">
                            ₹{Number(salary.deductions || 0).toLocaleString()}
                          </div>
                          <div className="text-xl text-gray-600 uppercase tracking-wider font-bold">Deductions</div>
                        </div>
                        <div className="text-center p-6 border-t-4 border-dashed border-indigo-200 pt-6">
                          <div className="text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            ₹{Number(salary.net_salary || 0).toLocaleString()}
                          </div>
                          <div className="text-xl uppercase tracking-widest font-bold text-indigo-700">Net Pay</div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-6 pt-8 border-t-2 border-indigo-200">
                        <motion.button 
                          whileHover={{ scale: 1.05 }} 
                          onClick={() => markSalaryPaid(salary.id)}
                          disabled={salaryLoading[salary.id] || salary.status === 'Paid'}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 px-8 rounded-4xl font-black uppercase tracking-wider shadow-3xl hover:shadow-4xl transition-all duration-500 text-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4"
                        >
                          {salaryLoading[salary.id] ? (
                            <>
                              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                              Processing...
                            </>
                          ) : salary.status === 'Paid' ? (
                            '✅ Paid'
                          ) : (
                            <>
                              ✅ Mark Paid
                            </>
                          )}
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05 }} 
                          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-6 px-8 rounded-4xl font-black uppercase tracking-wider shadow-3xl hover:shadow-4xl transition-all duration-500 text-xl flex items-center justify-center gap-4"
                        >
                          💬 WhatsApp Payslip
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TeacherSalary;
