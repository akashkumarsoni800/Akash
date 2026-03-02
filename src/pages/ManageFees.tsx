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

  const fetchInitialData = async () => {
    try {
      const [{ data: stdData }, { data: headData }, { data: statsData }, { data: paymentsData }, { data: autoData }] = 
        await Promise.all([
          supabase.from('students').select('*').order('full_name'),
          supabase.from('fee_heads').select('*').order('id'),
          supabase.from('fees').select('status, total_amount', { count: 'exact' }),
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
      toast.error("Error loading data");
    }
  };

  const toggleAutoFeeReminder = async () => {
    const isEnabled = !autoFeeSettings?.enabled;
    const { error } = await supabase
      .from('auto_fee_settings')
      .upsert({ 
        id: 'default',
        enabled: isEnabled,
        send_day: 1,
        last_sent: isEnabled ? new Date().toISOString() : autoFeeSettings?.last_sent
      });

    if (!error) {
      toast.success(isEnabled ? '✅ Auto WhatsApp reminders ENABLED!' : '❌ Auto reminders DISABLED');
      fetchInitialData();
    }
  };

  const sendWhatsAppReminder = () => {
    if (!selectedStudent || !month) {
      toast.error("Please select Student and Month first.");
      return;
    }
    const student = students.find(s => String(s.id) === String(selectedStudent));
    if (!student?.contact_number) {
      toast.error("Student contact missing!");
      return;
    }

    let phone = student.contact_number.toString().replace(/\D/g, '');
    if (phone.length === 10) phone = "91" + phone;

    const totalAmount = Object.values(feeValues).reduce((sum: number, val: any) => 
      sum + Number(val || 0), 0);

    const message = `🔔 *FEE REMINDER - Adarsh Shishu Mandir*

👨‍🎓 *Student:* ${student.full_name} (${student.class_name})
📅 *Month:* ${month}

💰 *FEE BREAKDOWN:*
${feeHeads.map((head: any) => 
  Number(feeValues[head.id] || 0) > 0 ? `• ${head.name}: ₹${feeValues[head.id]}` : ''
).filter(Boolean).join('\n')}

═══════════════════════
*TOTAL: ₹${totalAmount.toLocaleString()}*
═══════════════════════

⚠️ *Status:* Pending
📅 *Due Date:* 10th of every month

*PAYMENT METHODS:*
• UPI: schoolupi@pay
• Cash: School Office

🙏 Please pay on time!`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    toast.success("📱 WhatsApp reminder sent!");
  };

  const handleAssignFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent && !selectedClass) return toast.error("Select Student/Class & Month");
    
    const totalAmount = Object.values(feeValues).reduce((sum: number, val: any) => 
      sum + Number(val || 0), 0);

    try {
      setLoading(true);
      let error;
      
      if (bulkMode && selectedClass) {
        const classStudents = students.filter(s => s.class_name === selectedClass);
        const feesToInsert = classStudents.map(student => ({
          student_id: student.id,
          month,
          fee_breakdown: feeValues,
          total_amount: totalAmount,
          status: 'Pending'
        }));
        ({ error } = await supabase.from('fees').insert(feesToInsert));
      } else {
        ({ error } = await supabase.from('fees').insert([{
          student_id: selectedStudent,
          month,
          fee_breakdown: feeValues,
          total_amount,
          status: 'Pending'
        }]));
      }

      if (error) throw error;
      toast.success(bulkMode ? `✅ Bulk assigned to ${students.filter(s => s.class_name === selectedClass).length} students!` : "✅ Fee Assigned Successfully!");
      fetchInitialData();
      if (bulkMode) setSelectedClass('');
      else setSelectedStudent('');
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeeValueChange = (headId: string, value: string) => {
    setFeeValues({ ...feeValues, [headId]: value });
  };

  const QuickStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
      <motion.div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-10 rounded-4xl shadow-3xl hover:shadow-4xl transition-all duration-500 hover:-translate-y-3 text-center group">
        <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">💰</div>
        <div className="text-4xl lg:text-5xl font-black mb-4">₹{feeStats.totalCollected.toLocaleString()}</div>
        <div className="text-blue-100 uppercase tracking-wider font-bold text-lg">Collected</div>
      </motion.div>
      <motion.div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-10 rounded-4xl shadow-3xl hover:shadow-4xl transition-all duration-500 hover:-translate-y-3 text-center group">
        <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">⏳</div>
        <div className="text-4xl lg:text-5xl font-black mb-4">{feeStats.totalPending}</div>
        <div className="text-orange-100 uppercase tracking-wider font-bold text-lg">Pending</div>
      </motion.div>
      <motion.div className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-10 rounded-4xl shadow-3xl hover:shadow-4xl transition-all duration-500 hover:-translate-y-3 text-center group">
        <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">⚠️</div>
        <div className="text-4xl lg:text-5xl font-black mb-4">{feeStats.overdue}</div>
        <div className="text-red-100 uppercase tracking-wider font-bold text-lg">Overdue</div>
      </motion.div>
      <motion.div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-10 rounded-4xl shadow-3xl hover:shadow-4xl transition-all duration-500 hover:-translate-y-3 text-center group">
        <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">📈</div>
        <div className="text-4xl lg:text-5xl font-black mb-4">{feeStats.collectionRate}%</div>
        <div className="text-green-100 uppercase tracking-wider font-bold text-lg">Collection Rate</div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-20">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-[-0.05em] bg-gradient-to-r from-purple-700 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-8">
            💰 Fee Management
          </h1>
          <p className="text-2xl text-gray-600 font-semibold max-w-3xl mx-auto leading-relaxed">
            Assign fees, send auto WhatsApp reminders & track collections in real-time
          </p>
        </motion.div>

        <QuickStats />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          {/* Fee Assignment Form */}
          <motion.div initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} 
            className="bg-white/95 backdrop-blur-3xl p-12 rounded-4xl shadow-3xl border border-white/50">
            
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight">Assign Fee</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={bulkMode} 
                  onChange={() => setBulkMode(!bulkMode)}
                  className="sr-only peer"
                />
                <div className="w-16 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-purple-600"></div>
                <span className="ml-4 text-xl font-bold text-gray-900">Bulk Mode</span>
              </label>
            </div>

            <form onSubmit={handleAssignFee} className="space-y-8">
              <div>
                <label className="block text-xl font-bold text-gray-700 uppercase tracking-wide mb-5">
                  {bulkMode ? 'Select Class' : 'Select Student'}
                </label>
                {bulkMode ? (
                  <select 
                    className="w-full p-6 border-2 border-gray-200 rounded-4xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 text-2xl font-bold transition-all duration-500"
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
                    className="w-full p-6 border-2 border-gray-200 rounded-4xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 text-2xl font-bold transition-all duration-500 h-20"
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
                <label className="block text-xl font-bold text-gray-700 uppercase tracking-wide mb-5">Month *</label>
                <input 
                  type="month" 
                  className="w-full p-6 border-2 border-gray-200 rounded-4xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 text-2xl font-bold transition-all duration-500 h-20"
                  value={month} 
                  onChange={e => setMonth(e.target.value)} 
                  required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {feeHeads.map((head: any) => (
                  <div key={head.id} className="space-y-3">
                    <label className="block text-lg font-bold text-gray-600 uppercase tracking-wide">
                      {head.name}
                    </label>
                    <input 
                      type="number" 
                      className="w-full p-6 border-2 border-gray-200 rounded-4xl focus:border-green-500 focus:ring-4 focus:ring-green-200 text-2xl font-bold text-right transition-all duration-500 h-20"
                      placeholder="₹0"
                      value={feeValues[head.id] || ''} 
                      onChange={(e) => handleFeeValueChange(head.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-10 rounded-4xl shadow-3xl text-center">
                <div className="flex justify-between items-center text-4xl font-black mb-4 max-w-md mx-auto">
                  <span>Total Amount</span>
                  <span>₹{Object.values(feeValues).reduce((sum: number, val: any) => sum + Number(val || 0), 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  type="button" 
                  onClick={sendWhatsAppReminder}
                  className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 px-8 rounded-4xl font-black uppercase tracking-widest shadow-3xl hover:shadow-4xl transition-all duration-500 flex items-center justify-center gap-4 text-xl"
                >
                  💬 WhatsApp Reminder
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  type="submit" 
                  disabled={loading || (!selectedStudent && !selectedClass) || !month}
                  className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 px-8 rounded-4xl font-black uppercase tracking-widest shadow-3xl hover:shadow-4xl transition-all duration-500 flex items-center justify-center gap-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed col-span-1 md:col-span-2"
                >
                  {loading ? (
                    <>
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      {bulkMode ? 'Bulk Assigning...' : 'Saving...'}
                    </>
                  ) : bulkMode ? (
                    '🚀 Bulk Assign'
                  ) : (
                    '💾 Assign Fee'
                  )}
                </motion.button>
              </div>
            </form>

            {/* AUTO WHATSAPP SECTION */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mt-16 p-10 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-4 border-dashed border-purple-300 rounded-4xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black text-purple-900 flex items-center gap-4">
                  🤖 Auto WhatsApp Fee Reminder
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoFeeSettings?.enabled || false}
                    onChange={toggleAutoFeeReminder}
                    className="sr-only peer"
                  />
                  <div className="w-16 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
              
              {autoFeeSettings?.enabled ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-8 text-center">
                  <div className="text-6xl mb-6 animate-bounce">✅</div>
                  <div className="text-4xl font-black text-green-800 mb-4">
                    Next Auto-Send: <span className="text-5xl">{nextAutoSend}</span>
                  </div>
                  <p className="text-2xl text-green-700 font-bold">
                    📱 All students with WhatsApp will receive fee reminders automatically every month!
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-6 opacity-50">🤖</div>
                  <p className="text-2xl font-bold text-gray-700 mb-4">
                    Turn ON for automatic monthly WhatsApp reminders to ALL students
                  </p>
                  <p className="text-xl text-gray-600">No manual work required! 💪</p>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Right Panel - Fee Heads & Recent Payments */}
          <div className="space-y-12">
            {/* Fee Heads Management */}
            <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} 
              className="bg-white/95 backdrop-blur-3xl p-10 rounded-4xl shadow-3xl border border-white/50">
              <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-10 flex items-center gap-4">
                ⚙️ Fee Categories
              </h3>
              
              <div className="space-y-4 mb-10">
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="e.g., Exam Fee, Library Fee, Tuition Fee"
                    className="flex-1 p-6 border-2 border-gray-200 rounded-4xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 font-bold text-xl transition-all duration-500"
                    value={newHeadName} 
                    onChange={e => setNewHeadName(e.target.value)}
                  />
                  <motion.button 
                    whileHover={{ scale: 1.1 }} 
                    onClick={async () => {
                      if(!newHeadName.trim()) return;
                      const { error } = await supabase.from('fee_heads').insert([{ name: newHeadName.trim() }]);
                      if (!error) {
                        setNewHeadName('');
                        fetchInitialData();
                        toast.success('✅ New fee head added!');
                      }
                    }}
                    className="px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black uppercase tracking-widest rounded-4xl shadow-3xl hover:shadow-4xl transition-all duration-500 text-xl flex items-center gap-3"
                  >
                    ➕ Add
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                {feeHeads.map((head: any) => (
                  <div key={head.id} className="group p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl border-2 border-gray-200 hover:shadow-2xl hover:border-purple-300 transition-all duration-500 cursor-pointer hover:-translate-y-2">
                    <div className="font-black text-2xl text-gray-900 group-hover:text-purple-600 transition-colors">{head.name}</div>
                    <div className="text-lg text-gray-500 mt-2">Active in all fees</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} 
              className="bg-white/95 backdrop-blur-3xl p-10 rounded-4xl shadow-3xl border border-white/50">
              <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-10">📊 Recent Activity</h3>
              <div className="space-y-4">
                <AnimatePresence>
                  {recentPayments.slice(0, 5).map((payment: any, index: number) => (
                    <motion.div 
                      key={payment.id} 
                      initial={{ opacity: 0, x: 50 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex justify-between items-center p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-4xl border-l-8 border-blue-500 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group"
                    >
                      <div>
                        <div className="font-black text-2xl text-gray-900 group-hover:text-blue-600">
                          {payment.students?.full_name || 'N/A'}
                        </div>
                        <div className="text-xl text-gray-600">
                          {payment.month} - ₹{Number(payment.total_amount || 0).toLocaleString()}
                        </div>
                      </div>
                      <span className={`px-6 py-4 rounded-3xl text-xl font-bold shadow-lg ${
                        payment.status === 'Paid' 
                          ? 'bg-green-100 text-green-800 border-4 border-green-300' 
                          : payment.status === 'Pending' 
                          ? 'bg-orange-100 text-orange-800 border-4 border-orange-300 animate-pulse' 
                          : 'bg-red-100 text-red-800 border-4 border-red-300'
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

        {/* Live Update Section */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center p-16 bg-white/70 backdrop-blur-3xl rounded-4xl border-4 border-white/50 shadow-3xl"
        >
          <div className="text-6xl mb-8 animate-pulse">🔄</div>
          <h3 className="text-4xl font-black text-gray-800 mb-6">Live Fee Dashboard</h3>
          <p className="text-2xl text-gray-600 mb-12">Auto-refreshes every 30 seconds across all devices</p>
          <motion.button 
            whileHover={{ scale: 1.1 }} 
            onClick={fetchInitialData}
            className="px-16 py-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-4xl font-black uppercase tracking-widest shadow-4xl hover:shadow-5xl transition-all duration-500 text-2xl flex items-center gap-4 mx-auto"
          >
            🔄 Refresh All Data
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default ManageFees;
