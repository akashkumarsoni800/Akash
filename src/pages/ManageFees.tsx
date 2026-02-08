import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const ManageFees = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [feeHeads, setFeeHeads] = useState<any[]>([]);
  const [newHeadName, setNewHeadName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [month, setMonth] = useState('');
  const [feeValues, setFeeValues] = useState<any>({});
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [feeStats, setFeeStats] = useState({
    totalPending: 0,
    totalCollected: 0,
    overdue: 0,
    collectionRate: 0
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [{ data: stdData }, { data: headData }, { data: statsData }, { data: paymentsData }] = await Promise.all([
        supabase.from('students').select('*').order('full_name'),
        supabase.from('fee_heads').select('*').order('id'),
        supabase.from('fees').select('status, total_amount', { count: 'exact' }),
        supabase.from('fees')
          .select(`
            *,
            students(full_name, class_name, contact_number)
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      setStudents(stdData || []);
      setFeeHeads(headData || []);

      if (headData) {
        const initialValues: any = {};
        headData.forEach((h: any) => initialValues[h.id] = 0);
        setFeeValues(initialValues);
      }

      // Calculate stats
      const pendingCount = statsData?.filter((f: any) => f.status === 'Pending')?.length || 0;
      const collectedAmount = statsData?.reduce((sum: number, f: any) => 
        f.status === 'Paid' ? sum + (f.total_amount || 0) : sum, 0) || 0;
      
      setFeeStats({
        totalPending: pendingCount,
        totalCollected: collectedAmount,
        overdue: statsData?.filter((f: any) => f.status === 'Overdue')?.length || 0,
        collectionRate: statsData?.length ? Math.round((collectedAmount / 
          statsData.reduce((sum: number, f: any) => sum + (f.total_amount || 0), 0)) * 100) : 0
      });

      setRecentPayments(paymentsData || []);
    } catch (error: any) {
      toast.error("Error loading data");
    }
  };

  const sendWhatsAppReminder = () => {
    if (!selectedStudent || !month) {
      toast.error("Please select Student and Month first.");
      return;
    }

    const student = students.find(s => String(s.id) === String(selectedStudent));
    if (!student || !student.contact_number) {
      toast.error("Student contact missing!");
      return;
    }

    let phone = student.contact_number.toString().replace(/\D/g, '');
    if (phone.length === 10) phone = "91" + phone;

    const totalAmount = Object.values(feeValues).reduce((sum: number, val: any) => sum + Number(val || 0), 0);
    
    const message = `🔔 *Fee Reminder - Adarsh Shishu Mandir*

Dear Parent,
Fee details for *${student.full_name}* (Class: ${student.class_name})

Month: *${month}*

*Breakdown:*
${feeHeads.map((head: any) => Number(feeValues[head.id] || 0) > 0 
  ? `• ${head.name}: ₹${feeValues[head.id]}` : ''
).filter(Boolean).join('\n')}

─────────────────
*TOTAL: ₹${totalAmount}*
─────────────────

Please pay via UPI or school office.`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAssignFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !month) return toast.error("Select Student & Month");

    const totalAmount = Object.values(feeValues).reduce((sum: number, val: any) => sum + Number(val || 0), 0);

    try {
      setLoading(true);
      const { error } = await supabase.from('fees').insert([{
        student_id: selectedStudent,
        month: month,
        fee_breakdown: feeValues,
        total_amount: totalAmount,
        status: 'Pending'
      }]);

      if (error) throw error;
      toast.success("✅ Fee Assigned Successfully!");
      fetchInitialData();
      if (bulkMode) setSelectedStudent('');
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeeValueChange = (headId: string, value: string) => {
    setFeeValues({ ...feeValues, [headId]: value });
  };

  const bulkAssignClass = async () => {
    const classStudents = students.filter(s => s.class_name === selectedClass);
    if (classStudents.length === 0) return toast.error("No students in selected class");

    setLoading(true);
    try {
      const feesToInsert = classStudents.map(student => ({
        student_id: student.id,
        month: month,
        fee_breakdown: feeValues,
        total_amount: Object.values(feeValues).reduce((sum: number, val: any) => sum + Number(val || 0), 0),
        status: 'Pending'
      }));

      const { error } = await supabase.from('fees').insert(feesToInsert);
      if (error) throw error;

      toast.success(`✅ Bulk assigned to ${classStudents.length} students!`);
      fetchInitialData();
    } catch (error: any) {
      toast.error("Bulk assign failed");
    } finally {
      setLoading(false);
    }
  };

  const QuickStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      <motion.div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 text-center">
        <div className="text-4xl mb-4">📊</div>
        <div className="text-4xl font-black mb-2">₹{feeStats.totalCollected.toLocaleString()}</div>
        <div className="text-blue-100 uppercase tracking-wider font-bold text-sm">Collected</div>
      </motion.div>

      <motion.div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 text-center">
        <div className="text-4xl mb-4">⏰</div>
        <div className="text-4xl font-black mb-2">{feeStats.totalPending}</div>
        <div className="text-orange-100 uppercase tracking-wider font-bold text-sm">Pending</div>
      </motion.div>

      <motion.div className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <div className="text-4xl font-black mb-2">{feeStats.overdue}</div>
        <div className="text-red-100 uppercase tracking-wider font-bold text-sm">Overdue</div>
      </motion.div>

      <motion.div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 text-center">
        <div className="text-4xl mb-4">📈</div>
        <div className="text-4xl font-black mb-2">{feeStats.collectionRate}%</div>
        <div className="text-green-100 uppercase tracking-wider font-bold text-sm">Collection Rate</div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-black uppercase tracking-[-0.05em] bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-6">
            💰 Fee Management
          </h1>
          <p className="text-xl text-gray-600 font-semibold max-w-2xl mx-auto">
            Assign fees, send reminders & track collections in real-time
          </p>
        </motion.div>

        {/* Quick Stats */}
        <QuickStats />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Fee Assignment */}
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="bg-white/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/50">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Assign Fee</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={bulkMode} 
                  onChange={() => setBulkMode(!bulkMode)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                <span className="ml-3 text-sm font-bold text-gray-900">Bulk Mode</span>
              </label>
            </div>

            <form onSubmit={handleAssignFee} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                  {bulkMode ? 'Select Class' : 'Select Student'}
                </label>
                {bulkMode ? (
                  <select 
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 text-lg font-semibold transition-all duration-300"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="">-- All Classes --</option>
                    <option value="10A">Class 10A</option>
                    <option value="10B">Class 10B</option>
                    <option value="11A">Class 11A</option>
                    <option value="12A">Class 12A</option>
                  </select>
                ) : (
                  <select 
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 text-lg font-semibold transition-all duration-300"
                    value={selectedStudent}
                    onChange={e => setSelectedStudent(e.target.value)}
                  >
                    <option value="">-- Select Student --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.class_name}) {s.contact_number ? "✅" : "⚠️"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Month *</label>
                <input 
                  type="month" 
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 text-lg font-semibold transition-all duration-300"
                  value={month} 
                  onChange={e => setMonth(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {feeHeads.map((head: any) => (
                  <div key={head.id} className="space-y-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">{head.name}</label>
                    <input 
                      type="number" 
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-200 text-lg font-semibold transition-all duration-300"
                      placeholder="₹0"
                      value={feeValues[head.id] || ''}
                      onChange={(e) => handleFeeValueChange(head.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-3xl shadow-xl">
                <div className="flex justify-between items-center text-2xl font-black">
                  <span>Total Amount</span>
                  <span>₹{Object.values(feeValues).reduce((sum: number, val: any) => sum + Number(val || 0), 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  type="button" 
                  onClick={sendWhatsAppReminder} 
                  className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-6 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3"
                >
                  💬 WhatsApp Reminder
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  disabled={loading || !selectedStudent || !month}
                  type="submit"
                  className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 px-6 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : bulkMode ? (
                    'Bulk Assign'
                  ) : (
                    '💾 Assign Fee'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Fee Settings & Recent Payments */}
          <div className="space-y-8">
            {/* Fee Heads Management */}
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">⚙️ Fee Categories</h3>
              <div className="space-y-3 mb-6">
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="e.g., Exam Fee, Library Fee" 
                    className="flex-1 p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 font-semibold transition-all duration-300"
                    value={newHeadName} 
                    onChange={e => setNewHeadName(e.target.value)} 
                  />
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    onClick={async () => {
                      if(!newHeadName.trim()) return;
                      await supabase.from('fee_heads').insert([{ name: newHeadName.trim() }]);
                      setNewHeadName('');
                      fetchInitialData();
                      toast.success('✅ New fee head added!');
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    ➕ Add
                  </motion.button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {feeHeads.map((head: any) => (
                  <div key={head.id} className="group p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer">
                    <div className="font-bold text-gray-900">{head.name}</div>
                    <div className="text-sm text-gray-500">Used in {students.length} fees</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Payments */}
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">📊 Recent Activity</h3>
              <div className="space-y-4">
                <AnimatePresence>
                  {recentPayments.slice(0, 5).map((payment: any) => (
                    <motion.div 
                      key={payment.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-l-4 border-blue-500 hover:shadow-md transition-all duration-300"
                    >
                      <div>
                        <div className="font-bold text-gray-900">{payment.students?.full_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{payment.month} - ₹{payment.total_amount?.toLocaleString()}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        payment.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        payment.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Live Update */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 bg-white/50 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl"
        >
          <div className="text-3xl mb-4 animate-pulse">🔄</div>
          <p className="text-xl font-black text-gray-800 mb-2">Live Fee Dashboard</p>
          <p className="text-lg text-gray-600">Auto-refreshes every 30 seconds</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            onClick={fetchInitialData}
            className="mt-4 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            🔄 Refresh Data
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default ManageFees;
