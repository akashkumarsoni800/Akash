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
    const student = students.find(s => String(s.student_id) === String(selectedStudent));
    if (!student?.contact_number) {
      toast.error("Student contact missing!");
      return;
    }

    let phone = student.contact_number.toString().replace(/\D/g, '');
    if (phone.length === 10) phone = "91" + phone;

    const totalAmount = Object.values(feeValues).reduce((sum: number, val: any) => 
      sum + Number(val || 0), 0);

    const message = `🔔 *FEE REMINDER - Adarsh Shishu Mandir*\n\n👨‍🎓 *Student:* ${student.full_name}\n📅 *Month:* ${month}\n💰 *TOTAL: ₹${totalAmount.toLocaleString()}*`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    toast.success("📱 WhatsApp reminder sent!");
  };

  const handleAssignFee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ ID Validation
    const studentIdToUse = bulkMode ? null : Number(selectedStudent);
    if (!bulkMode && isNaN(studentIdToUse as number)) {
        return toast.error("Invalid Student Selection");
    }

    const totalAmountValue = Object.values(feeValues).reduce((sum: number, val: any) => 
      sum + Number(val || 0), 0);

    if (totalAmountValue <= 0) return toast.error("Fee amount cannot be zero");

    try {
      setLoading(true);
      let error;
      
      if (bulkMode && selectedClass) {
        const classStudents = students.filter(s => s.class_name === selectedClass);
        if (classStudents.length === 0) throw new Error("No students found in this class");

        const feesToInsert = classStudents.map(student => ({
          student_id: student.student_id, // ✅ Table key
          month,
          fee_structure: feeValues, // ✅ Matches your Screenshot naming
          total_amount: totalAmountValue,
          status: 'Pending'
        }));
        
        const result = await supabase.from('fees').insert(feesToInsert);
        error = result.error;
      } else {
        const result = await supabase.from('fees').insert([{
          student_id: studentIdToUse, // ✅ Send Clean Number only
          month,
          fee_structure: feeValues, // ✅ Matches your Screenshot naming
          total_amount: totalAmountValue,
          status: 'Pending'
        }]);
        error = result.error;
      }

      if (error) throw error;
      toast.success("✅ Fee Assigned Successfully!");
      fetchInitialData();
      setSelectedStudent('');
      setMonth('');
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeeValueChange = (headId: string, value: string) => {
    setFeeValues({ ...feeValues, [headId]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-6xl font-black uppercase bg-gradient-to-r from-purple-700 to-orange-600 bg-clip-text text-transparent mb-8">
            💰 Fee Management
          </h1>
        </div>

        <QuickStats />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          <div className="bg-white/95 p-12 rounded-4xl shadow-3xl border border-white/50">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl font-black text-gray-900 uppercase">Assign Fee</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={bulkMode} onChange={() => setBulkMode(!bulkMode)} className="sr-only peer" />
                <div className="w-16 h-8 bg-gray-200 rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:after:translate-x-full"></div>
                <span className="ml-4 text-xl font-bold">Bulk Mode</span>
              </label>
            </div>

            <form onSubmit={handleAssignFee} className="space-y-8">
              <div>
                <label className="block text-xl font-bold text-gray-700 uppercase mb-5">
                  {bulkMode ? 'Select Class' : 'Select Student'}
                </label>
                {bulkMode ? (
                  <select className="w-full p-6 border-2 border-gray-200 rounded-4xl text-2xl font-bold" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                    <option value="">-- All Classes --</option>
                    {[...new Set(students.map(s => s.class_name))].map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                ) : (
                  <select 
                    className="w-full p-6 border-2 border-gray-200 rounded-4xl text-2xl font-bold" 
                    value={selectedStudent} 
                    onChange={e => setSelectedStudent(e.target.value)} // ✅ Cleanly sets student_id
                  >
                    <option value="">-- Select Student --</option>
                    {students.map(s => (
                      <option key={s.student_id} value={s.student_id}>
                        {s.full_name} ({s.class_name})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xl font-bold text-gray-700 uppercase mb-5">Month *</label>
                <input type="month" className="w-full p-6 border-2 border-gray-200 rounded-4xl text-2xl font-bold" value={month} onChange={e => setMonth(e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {feeHeads.map((head: any) => (
                  <div key={head.id}>
                    <label className="block text-lg font-bold text-gray-600 uppercase mb-3">{head.name}</label>
                    <input type="number" className="w-full p-6 border-2 border-gray-200 rounded-4xl text-2xl font-bold" placeholder="₹0" value={feeValues[head.id] || ''} onChange={(e) => handleFeeValueChange(head.id, e.target.value)} />
                  </div>
                ))}
              </div>

              <div className="bg-emerald-500 text-white p-10 rounded-4xl text-center">
                <div className="text-4xl font-black">Total: ₹{totalAmountValue.toLocaleString()}</div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-6 rounded-4xl font-black uppercase text-xl shadow-xl">
                {loading ? 'Processing...' : '💾 Assign Fee Now'}
              </button>
            </form>
          </div>

          <div className="space-y-12">
            {/* Recent Payments Panel */}
            <div className="bg-white/95 p-10 rounded-4xl shadow-3xl border border-white/50">
              <h3 className="text-4xl font-black mb-10">📊 Recent Activity</h3>
              <div className="space-y-4">
                {recentPayments.map((payment: any) => (
                  <div key={payment.id} className="flex justify-between items-center p-8 bg-indigo-50 rounded-4xl border-l-8 border-indigo-500">
                    <div>
                      <div className="font-black text-2xl uppercase">{payment.students?.full_name}</div>
                      <div className="text-xl text-gray-500">{payment.month} - ₹{payment.total_amount}</div>
                    </div>
                    <span className="bg-white px-6 py-2 rounded-2xl font-bold shadow-sm uppercase">{payment.status}</span>
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

// ... (QuickStats function same as before)
const QuickStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {/* Your stats UI */}
    </div>
);

export default ManageFees;
