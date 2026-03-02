import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const ManageSalaries = () => {
  const [salaries, setSalaries] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSalary, setNewSalary] = useState({ name: '', amount: 0, month: '' });

  useEffect(() => {
    fetchSalaries();
    fetchTeachers();
  }, []);

  const fetchSalaries = async () => {
    const { data } = await supabase
      .from('teacher_salaries')
      .select('*')
      .order('month', { ascending: false });
    setSalaries(data || []);
  };

  const fetchTeachers = async () => {
    const { data } = await supabase.from('students').select('full_name'); // Reuse student names or create teachers table
    setTeachers(data || []);
  };

  const addSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.from('teacher_salaries').insert([{
        teacher_name: newSalary.name,
        salary_amount: newSalary.amount,
        month: newSalary.month,
        status: 'Pending'
      }]);
      if (error) throw error;
      toast.success('✅ Salary added');
      setNewSalary({ name: '', amount: 0, month: '' });
      fetchSalaries();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async (id: string) => {
    await supabase
      .from('teacher_salaries')
      .update({ status: 'Paid', paid_date: new Date().toISOString() })
      .eq('id', id);
    toast.success('✅ Marked as paid');
    fetchSalaries();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-black text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-16"
        >
          👨‍🏫 Salary Management
        </motion.h1>

        {/* Add New Salary */}
        <motion.form onSubmit={addSalary} className="bg-white p-12 rounded-3xl shadow-2xl mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <input
              placeholder="Teacher Name"
              className="p-6 border-2 border-gray-200 rounded-3xl focus:border-indigo-500 text-xl"
              value={newSalary.name}
              onChange={(e) => setNewSalary({ ...newSalary, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Amount ₹"
              className="p-6 border-2 border-gray-200 rounded-3xl focus:border-indigo-500 text-xl"
              value={newSalary.amount}
              onChange={(e) => setNewSalary({ ...newSalary, amount: Number(e.target.value) })}
            />
            <input
              type="month"
              className="p-6 border-2 border-gray-200 rounded-3xl focus:border-indigo-500 text-xl"
              value={newSalary.month}
              onChange={(e) => setNewSalary({ ...newSalary, month: e.target.value })}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 px-12 rounded-3xl text-2xl font-black uppercase tracking-widest shadow-2xl"
          >
            {loading ? '⏳ Adding...' : '➕ Add Salary'}
          </motion.button>
        </motion.form>

        {/* Salary List */}
        <div className="space-y-6">
          {salaries.map((salary) => (
            <motion.div
              key={salary.id}
              className="bg-white p-8 rounded-3xl shadow-xl border-l-8 border-indigo-500 flex justify-between items-center"
            >
              <div>
                <h3 className="text-2xl font-black text-gray-900">{salary.teacher_name}</h3>
                <p className="text-lg text-gray-600">Month: {salary.month} | ₹{salary.salary_amount.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <span className={`px-6 py-3 rounded-2xl font-black text-lg ${
                  salary.status === 'Paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800 animate-pulse'
                }`}>
                  {salary.status}
                </span>
                {salary.status !== 'Paid' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => markPaid(salary.id)}
                    className="ml-4 bg-green-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-wider mt-2"
                  >
                    Mark Paid
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageSalaries;
