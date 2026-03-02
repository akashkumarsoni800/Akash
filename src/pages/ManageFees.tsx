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

  // 🔥 NEW AUTO + SALARY FEATURES
  const [autoMode, setAutoMode] = useState(false);
  const [salaryStats, setSalaryStats] = useState({
    totalSalary: 0,
    paidSalary: 0,
    pendingSalary: 0
  });
  const [nextAutoDate, setNextAutoDate] = useState('');

  useEffect(() => {
    fetchInitialData();
    if (autoMode) startAutoFeeSystem();
  }, [autoMode]);

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
      fetchSalaryStats();
    } catch (error: any) {
      toast.error("Error loading data");
    }
  };

  // 🔥 FIXED WHATSAPP RECEIPT (No build errors)
  const sendWhatsAppReceipt = (student: any, month: string, amount: number) => {
    const phone = `91${student.contact_number.toString().replace(/\D/g, '')}`;
    
    const receipt = [
      '🧾 OFFICIAL FEE RECEIPT - Adarsh Shishu Mandir',
      '',
      '┌─────────────────────────────┐',
      `│        RECEIPT #${Date.now()}              │`,
      '├─────────────────────────────┤',
      `│ Student: ${student.full_name.padEnd(20)}│`,
      `│ Class:   ${student.class_name.padEnd(20)}│`,
      `│ Month:   ${month.padEnd(22)}│`,
      '├─────────────────────────────┤'
    ];

    // Add fee breakdown
    feeHeads.forEach((head: any) => {
      const value = Number(feeValues[head.id] || 0);
      if (value > 0) {
        receipt.push(`│ ${head.name.padEnd(18)}: ₹${value} │`);
      }
    });

    receipt.push(
      '├─────────────────────────────┤',
      `│              TOTAL: ₹${amount.toLocaleString().padEnd(15)}│`,
      '└─────────────────────────────┘',
      '',
      '*Payment Status: ⏳ PENDING*',
      '*Due Date: 10th of next month*',
      '',
      'Pay via:',
      '• UPI: schoolupi@pay',
      '• Cash at office',
      '',
      `*Auto-generated on ${new Date().toLocaleDateString()}*`
    );

    const message = receipt.join('\\n');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // 🔥 AUTO FEE SYSTEM
  const startAutoFeeSystem = async () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 7);
    setNextAutoDate(nextMonth);
  };

  const generateMonthlyFeesAndWhatsApp = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const { data: config } = await supabase
        .from('fee_config')
        .select('*')
        .eq('month', currentMonth)
        .single();

      if (config?.is_sent) {
        toast.info('✅ Fees already sent this month');
        return;
      }

      const { data: studentsWithPhone } = await supabase
        .from('students')
        .select('*')
        .not('contact_number', 'is', null);

      if (!studentsWithPhone?.length) {
        toast.error('No students with WhatsApp numbers');
        return;
      }

      const totalAmount = Object.values(feeValues).reduce((sum: number, val: any) => 
        sum + Number(val || 0), 0);

      const feesToInsert = studentsWithPhone.map((student: any) => ({
        student_id: student.id,
        month: currentMonth,
        fee_breakdown: feeValues,
        total_amount: totalAmount,
        status: 'Pending'
      }));

      await supabase.from('fees').insert(feesToInsert);
      await supabase.from('fee_config').upsert([{
        month: currentMonth,
        is_sent: true,
        sent_date: new Date().toISOString(),
        fee_template: feeValues
      }]);

      studentsWithPhone.forEach((student: any) => {
        sendWhatsAppReceipt(student, currentMonth, totalAmount);
      });

      toast.success(`✅ Auto fees sent to ${studentsWithPhone.length} parents!`);
    } catch (error: any) {
      toast.error(`Auto failed: ${error.message}`);
    }
  };

  // 🔥 SALARY STATS
  const fetchSalaryStats = async () => {
    try {
      const { data } = await supabase.from('teacher_salaries').select('*');
      if (data) {
        const total = data.reduce((sum: number, s: any) => sum + s.salary_amount, 0);
        const paid = data.filter((s: any) => s.status === 'Paid').reduce((sum: number, s: any) => sum + s.salary_amount, 0);
        setSalaryStats({ 
          totalSalary: total, 
          paidSalary: paid, 
          pendingSalary: total - paid 
        });
      }
    } catch (error) {
      console.error('Salary stats error:', error);
    }
  };

  // ALL EXISTING FUNCTIONS (UNCHANGED)
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
).filter(Boolean).join('\\n')}

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

  // 🔥 ENHANCED STATS WITH SALARY
  const QuickStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
      <motion.div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-3xl shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all text-center">
        <div className="text-4xl mb-4">📊</div>
        <div className="text-4xl font-black mb-2">₹{feeStats.totalCollected.toLocaleString()}</div>
        <div className="text-blue-100 uppercase tracking-wider font-bold text-sm">Collected</div>
      </motion.div>

      <motion.div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-8 rounded-3xl shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all text-center">
        <div className="text-4xl mb-4">👨‍🏫</div>
        <div className="text-4xl font-black mb-2">₹{salaryStats.totalSalary.toLocaleString()}</div>
        <div className="text-purple-100 uppercase tracking-wider font-bold text-sm">Total Salary</div>
      </motion.div>

      <motion.div className={`p-8 rounded-3xl shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all text-center text-white ${
        feeStats.totalCollected - salaryStats.totalSalary > 0 
          ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
          : 'bg-gradient-to-br from-red-500 to-pink-600'
      }`}>
        <div className="text-4xl mb-4">{feeStats.totalCollected > salaryStats.totalSalary ? '💹' : '📉'}</div>
        <div className="text-4xl font-black mb-2">
          ₹{(feeStats.totalCollected - salaryStats.totalSalary).toLocaleString()}
        </div>
        <div className="uppercase tracking-wider font-bold text-sm">Net Profit</div>
      </motion.div>

      <motion.div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-8 rounded-3xl shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all text-center">
        <div className="text-4xl mb-4">⏰</div>
        <div className="text-4xl font-black mb-2">{feeStats.totalPending}</div>
        <div className="text-orange-100 uppercase tracking-wider font-bold text-sm">Pending</div>
      </motion.div>

      <motion.div className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-8 rounded-3xl shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <div className="text-4xl font-black mb-2">{feeStats.overdue}</div>
        <div className="text-red-100 uppercase tracking-wider font-bold text-sm">Overdue</div>
      </motion.div>
    </div>
  );

  // 🔥 AUTO CONTROL PANEL
  const AutoControl = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-8 rounded-3xl shadow-2xl mb-12"
    >
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div>
          <h3 className="text-2xl font-black mb-2">🤖 Auto Fee System</h3>
          <p className="text-green-100">Next auto-send: <strong>{nextAutoDate}</strong></p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="font-bold">AUTO OFF</span>
            <input 
              type="checkbox" 
              checked={autoMode} 
              onChange={(e) => setAutoMode(e.target.checked)}
              className="w-16 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-emerald-600"
            />
            <span className="font-bold">ON</span>
          </label>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={generateMonthlyFeesAndWhatsApp}
            className="bg-white text-green-600 px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all"
          >
            🚀 Send Now
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-black uppercase tracking-[-0.05em] bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-6">
            💰 Fee Management
          </h1>
          <p className="text-xl text-gray-600 font-semibold max-w-2xl mx-auto">
            Assign fees, send reminders & track collections in real-time
          </p>
        </motion.div>

        <AutoControl />
        <QuickStats />

        {/* ALL EXISTING SECTIONS - UNCHANGED */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="bg-white/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/50">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Assign Fee</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={bulkMode} onChange={() => setBulkMode(!bulkMode)} className="sr-only peer" />
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

          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">⚙️ Fee Categories</h3>
              <div className="space-y-3 mb-6">
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="e.g., Exam Fee, Library Fee" 
                    className="flex-1 p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 font-semibold
