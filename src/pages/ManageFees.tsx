import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const ManageFees = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [feeHeads, setFeeHeads] = useState<any[]>([]);
  
  // New Fee Head banane ke liye
  const [newHeadName, setNewHeadName] = useState('');

  // Fee Assign karne ke liye form data
  const [selectedStudent, setSelectedStudent] = useState('');
  const [month, setMonth] = useState('');
  const [feeValues, setFeeValues] = useState<any>({}); 

  // 1. Data Load
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    // ✅ CHANGE 1: 'contact_number' bhi fetch karein
    const { data: stdData } = await supabase
      .from('students')
      .select('id, full_name, class_name, contact_number') // contact_number zaroori h
      .order('full_name');
      
    if (stdData) setStudents(stdData);

    // Fee Heads lao
    const { data: headData } = await supabase.from('fee_heads').select('*').order('id');
    if (headData) {
      setFeeHeads(headData);
      const initialValues: any = {};
      headData.forEach((h: any) => initialValues[h.name] = 0);
      setFeeValues(initialValues);
    }
  };

  const handleAddHead = async () => {
    if (!newHeadName.trim()) return;
    try {
      const { error } = await supabase.from('fee_heads').insert([{ name: newHeadName }]);
      if (error) throw error;
      toast.success(`New Fee Type "${newHeadName}" Added!`);
      setNewHeadName('');
      fetchInitialData(); 
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ✅ NEW FUNCTION: WhatsApp Message Bhejne ke liye
  const sendWhatsAppReminder = () => {
    if (!selectedStudent || !month) {
      toast.error("Please select Student and Month first.");
      return;
    }

    // 1. Student dhoondo
    const student = students.find(s => s.id === selectedStudent);
    if (!student || !student.contact_number) {
      toast.error("Student phone number not found!");
      return;
    }

    // 2. Number clean karein (91 lagayein agar nahi h)
    let phone = student.contact_number.replace(/\D/g, '').slice(-10);
    phone = "91" + phone;

    // 3. Total Calculate
    const totalAmount = Object.values(feeValues).reduce((sum: number, val: any) => sum + Number(val || 0), 0);
    
    // 4. Message Create karein
    let message = `🔔 *Fee Reminder - Adarsh Shishu Mandir*\n\n`;
    message += `Dear Parent,\nFee details for *${student.full_name}* (Class: ${student.class_name})\n`;
    message += `Month: *${month}*\n\n`;
    message += `*Breakdown:* \n`;

    // Sirf wahi fees add karein jo 0 se zyada hai
    Object.entries(feeValues).forEach(([head, amount]: any) => {
        if (Number(amount) > 0) {
            message += `• ${head}: ₹${amount}\n`;
        }
    });

    message += `\n------------------\n`;
    message += `*TOTAL PAYABLE: ₹${totalAmount}*\n`;
    message += `------------------\n\n`;
    message += `Please pay via UPI or at school office.`;

    // 5. WhatsApp Link Open
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleAssignFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !month) {
      toast.error("Select Student and Month");
      return;
    }

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
      toast.success("Fee Assigned Successfully!");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeeValueChange = (headName: string, value: string) => {
    setFeeValues({ ...feeValues, [headName]: value });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">💰 Manage Fees & Reminders</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION 1: ASSIGN FEE (Left Side) */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Assign Fee to Student</h2>
          
          <form onSubmit={handleAssignFee} className="space-y-4">
            
            {/* Student Select */}
            <div>
              <label className="block text-sm font-bold text-gray-700">Select Student</label>
              <select 
                className="w-full border p-2 rounded" 
                value={selectedStudent}
                onChange={e => setSelectedStudent(e.target.value)}
              >
                <option value="">-- Select --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.class_name})</option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className="block text-sm font-bold text-gray-700">Month</label>
              <input type="month" className="w-full border p-2 rounded" value={month} onChange={e => setMonth(e.target.value)} />
            </div>

            <hr className="my-4" />

            {/* 🔥 DYNAMIC INPUTS */}
            <div className="grid grid-cols-2 gap-4">
              {feeHeads.map((head) => (
                <div key={head.id}>
                  <label className="block text-xs font-bold text-gray-600 mb-1">{head.name}</label>
                  <input 
                    type="number" 
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    onChange={(e) => handleFeeValueChange(head.name, e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Total Display */}
            <div className="bg-blue-50 p-3 rounded flex justify-between items-center">
              <span className="font-bold text-blue-900">Total Amount:</span>
              <span className="text-xl font-bold">
                ₹{Object.values(feeValues).reduce((sum: number, val: any) => sum + Number(val || 0), 0)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* WhatsApp Button */}
              <button 
                type="button" // Important: Type button rakhein taki form submit na ho
                onClick={sendWhatsAppReminder}
                className="bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition flex justify-center items-center gap-2"
              >
                <span>💬 WhatsApp</span>
              </button>

              {/* Submit Button */}
              <button disabled={loading} className="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                {loading ? "Saving..." : "💾 Save Fee"}
              </button>
            </div>

          </form>
        </div>

        {/* SECTION 2: CREATE STRUCTURE (Right Side) */}
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-purple-200">
            <h2 className="text-xl font-bold text-purple-900 mb-2">⚙️ Fee Settings</h2>
            <p className="text-sm text-gray-500 mb-4">Create new fee columns dynamically here.</p>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ex: Exam Fee" 
                className="flex-1 border p-2 rounded"
                value={newHeadName}
                onChange={e => setNewHeadName(e.target.value)}
              />
              <button 
                onClick={handleAddHead}
                className="bg-purple-600 text-white px-4 py-2 rounded font-bold hover:bg-purple-700"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="font-bold text-gray-700 mb-4">Active Fee Structures</h3>
            <div className="flex flex-wrap gap-2">
              {feeHeads.map(h => (
                <span key={h.id} className="bg-gray-100 border border-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                  {h.name}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ManageFees;
