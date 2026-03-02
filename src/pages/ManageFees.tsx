import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const ManageFees = () => {
  // Existing state + NEW
  const [autoMode, setAutoMode] = useState(false);
  const [salaryStats, setSalaryStats] = useState({ totalSalary: 0, paidSalary: 0, pendingSalary: 0 });
  const [nextAutoDate, setNextAutoDate] = useState('');

  // AUTO FEE GENERATION (NEW)
  useEffect(() => {
    if (autoMode) startAutoFeeSystem();
  }, [autoMode]);

  const startAutoFeeSystem = async () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 7);
    setNextAutoDate(nextMonth);

    // Check every hour if it's time to send
    const interval = setInterval(async () => {
      const today = new Date().toISOString().slice(0, 7);
      if (today === nextMonth) {
        await generateMonthlyFeesAndWhatsApp();
      }
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  };

  const generateMonthlyFeesAndWhatsApp = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // 1. Check if already sent
      const { data: config } = await supabase
        .from('fee_config')
        .select('*')
        .eq('month', currentMonth)
        .single();

      if (config?.is_sent) {
        toast.info('✅ Fees already sent this month');
        return;
      }

      // 2. Get students with WhatsApp
      const { data: students } = await supabase
        .from('students')
        .select('*')
        .not('contact_number', 'is', null);

      if (!students?.length) return;

      // 3. Generate fees for ALL students
      const totalAmount = Object.values(feeValues).reduce((sum: number, val: any) => 
        sum + Number(val || 0), 0);

      const feesToInsert = students.map((student: any) => ({
        student_id: student.id,
        month: currentMonth,
        fee_breakdown: feeValues,
        total_amount: totalAmount,
        status: 'Pending'
      }));

      await supabase.from('fees').insert(feesToInsert);

      // 4. Mark as sent & store template
      await supabase.from('fee_config').upsert([{
        month: currentMonth,
        is_sent: true,
        sent_date: new Date().toISOString(),
        fee_template: feeValues
      }]);

      // 5. Send WhatsApp RECEIPTS to ALL
      students.forEach((student: any) => {
        sendWhatsAppReceipt(student, currentMonth, totalAmount);
      });

      toast.success(`✅ Auto fees sent to ${students.length} parents!`);
    } catch (error: any) {
      toast.error(`Auto failed: ${error.message}`);
    }
  };

  // WhatsApp RECEIPT (Professional Format)
  const sendWhatsAppReceipt = (student: any, month: string, amount: number) => {
    const phone = `91${student.contact_number.toString().replace(/\D/g, '')}`;
    const receiptNo = `RS${Date.now()}`;
    
    const receipt = `🧾 *OFFICIAL FEE RECEIPT - Adarsh Shishu Mandir*

┌─────────────────────────────┐
│        RECEIPT #${receiptNo}              │
├─────────────────────────────┤
│ Student: ${student.full_name}             │
│ Class: ${student.class_name}              │
│ Month: ${month}                    │
├─────────────────────────────┤
│ ${feeHeads.map((head: any) => 
  Number(feeValues[head.id] || 0) > 0 
    ? `│ ${head.name.padEnd(15)}: ₹${feeValues[head.id]}` 
    : ''
).filter(Boolean).join('\\n')}`
│
├─────────────────────────────┤
│              TOTAL: ₹${amount.toLocaleString()}    │
└─────────────────────────────┘

*Payment Status: ⏳ PENDING*
*Due Date: 10th of next month*

Pay via:
• UPI: schoolupi@pay
• Cash at office

*Auto-generated on ${new Date().toLocaleDateString()}*
*Reply STOP to unsubscribe*`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(receipt)}`, '_blank');
  };

  // SALARY STATS (NEW)
  const fetchSalaryStats = async () => {
    const { data } = await supabase.from('teacher_salaries').select('*');
    if (data) {
      const total = data.reduce((sum: number, s: any) => sum + s.salary_amount, 0);
      const paid = data.filter((s: any) => s.status === 'Paid').reduce((sum: number, s: any) => sum + s.salary_amount, 0);
      setSalaryStats({ totalSalary: total, paidSalary: paid, pendingSalary: total - paid });
    }
  };

  // ALL EXISTING FUNCTIONS REMAIN SAME...
  // [Keep all your existing fetchInitialData, handleAssignFee, etc. exactly same]

  // ENHANCED QuickStats with Salary + Profit
  const QuickStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
      {/* Fee Collected */}
      <motion.div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-3xl shadow-2xl text-center">
        <div className="text-4xl mb-4">📊</div>
        <div className="text-3xl font-black mb-2">₹{feeStats.totalCollected.toLocaleString()}</div>
        <div className="text-blue-100 uppercase tracking-wider font-bold text-xs">Fees Collected</div>
      </motion.div>

      {/* Salary Total */}
      <motion.div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-8 rounded-3xl shadow-2xl text-center">
        <div className="text-4xl mb-4">👨‍🏫</div>
        <div className="text-3xl font-black mb-2">₹{salaryStats.totalSalary.toLocaleString()}</div>
        <div className="text-purple-100 uppercase tracking-wider font-bold text-xs">Total Salary</div>
      </motion.div>

      {/* Salary Pending */}
      <motion.div className="bg-gradient-to-br from-red-500 to-orange-600 text-white p-8 rounded-3xl shadow-2xl text-center">
        <div className="text-4xl mb-4">💸</div>
        <div className="text-3xl font-black mb-2">₹{salaryStats.pendingSalary.toLocaleString()}</div>
        <div className="text-red-100 uppercase tracking-wider font-bold text-xs">Salary Pending</div>
      </motion.div>

      {/* Fees Pending */}
      <motion.div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-8 rounded-3xl shadow-2xl text-center">
        <div className="text-4xl mb-4">⏰</div>
        <div className="text-3xl font-black mb-2">{feeStats.totalPending}</div>
        <div className="text-orange-100 uppercase tracking-wider font-bold text-xs">Fees Pending</div>
      </motion.div>

      {/* NET PROFIT */}
      <motion.div className={`p-8 rounded-3xl shadow-2xl text-center text-white ${
        feeStats.totalCollected - salaryStats.totalSalary > 0 
          ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
          : 'bg-gradient-to-br from-red-500 to-pink-600'
      }`}>
        <div className="text-4xl mb-4">{feeStats.totalCollected > salaryStats.totalSalary ? '💹' : '📉'}</div>
        <div className="text-3xl font-black mb-2">
          ₹{(feeStats.totalCollected - salaryStats.totalSalary).toLocaleString()}
        </div>
        <div className="uppercase tracking-wider font-bold text-xs">Net Profit</div>
      </motion.div>
    </div>
  );

  // Add this NEW Auto Control Section (AFTER Header)
  const AutoControl = () => (
    <motion.div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-8 rounded-3xl shadow-2xl mb-12">
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div>
          <h3 className="text-2xl font-black mb-2">🤖 Auto Fee System</h3>
          <p className="text-green-100">Next auto-send: <strong>{nextAutoDate || 'Set fees to start'}</strong></p>
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

  // MAIN RETURN - ADD AutoControl after header, before QuickStats
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* YOUR EXISTING HEADER */}
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-black uppercase tracking-[-0.05em] bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-6">
            💰 Fee Management
          </h1>
          <p className="text-xl text-gray-600 font-semibold max-w-2xl mx-auto">
            Assign fees, send reminders & track collections in real-time
          </p>
        </motion.div>

        {/* NEW AUTO CONTROL */}
        <AutoControl />

        {/* ENHANCED QUICKSTATS */}
        <QuickStats />

        {/* ALL YOUR EXISTING SECTIONS REMAIN EXACTLY SAME */}
        {/* [Fee Assignment, Fee Heads, Recent Payments - NO CHANGES] */}
        
      </div>
    </div>
  );
};

export default ManageFees;
