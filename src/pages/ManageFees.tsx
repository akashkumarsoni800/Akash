import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';

const ManageFees = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- 1. DATA FETCHING ---
  const fetchStudentsAndFees = async () => {
    try {
      setLoading(true);
      // Dhyan dein: Hum 'contact_number' bhi mangwa rahe hain
      const { data, error } = await supabase
        .from('students')
        .select('*, fees(*)')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
      
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsAndFees();
  }, []);

  // --- 2. WHATSAPP SENDER FUNCTION 🟢 ---
  const sendWhatsAppReminder = (student: any, total: number, paid: number, currentPayment: number) => {
    if (!student.contact_number) {
      toast.warning("Student ka mobile number nahi mila!");
      return;
    }

    const pending = total - paid;
    const date = new Date().toLocaleDateString('en-IN');
    
    // Message Format (Hindi/English mix)
    // Aap is message ko apne hisab se badal sakte hain
    const message = `
🏫 *Adarsh Shishu Mandir* 🏫
-----------------------------
Hello *${student.full_name}*,

Apki fees update ho gayi hai via Online System.

📅 Date: ${date}
💰 Total Fees: ₹${total}
✅ Paid So Far: ₹${paid}
❌ *Pending Dues: ₹${pending}*

Kripya samay par baki fees jama karein.
Dhanyawad.
-----------------------------
`.trim();

    // WhatsApp URL banana
    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/91${student.contact_number}?text=${encodedMsg}`;

    // Nayi window me kholna
    window.open(whatsappUrl, '_blank');
  };

  // --- 3. SAVE LOGIC ---
  const handleSaveFee = async (studentId: string, structure: any, paidStr: string) => {
    setProcessingId(studentId);
    
    try {
      const tuition = Number(structure.tuition) || 0;
      const exam = Number(structure.exam) || 0;
      const other = Number(structure.other) || 0;
      const paid = Number(paidStr) || 0;

      const total = tuition + exam + other;
      
      let status = 'Pending';
      if (paid >= total && total > 0) status = 'Paid';
      else if (paid > 0) status = 'Partial';

      const feeData = {
        student_id: studentId, // Note: Ye ab BigInt hai database me
        fee_structure: { tuition, exam, other },
        total_amount: total,
        paid_amount: paid,
        status: status,
        updated_at: new Date()
      };

      // Existing data check
      const student = students.find(s => s.id === studentId);
      const existingFeeId = (student?.fees && student.fees.length > 0) ? student.fees[0].id : null;

      let error;
      if (existingFeeId) {
        const { error: updateError } = await supabase
          .from('fees')
          .update(feeData)
          .eq('id', existingFeeId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('fees')
          .insert([feeData]);
        error = insertError;
      }

      if (error) throw error;

      toast.success("✅ Fees Updated Successfully!");
      
      // --- 4. ASK TO SEND WHATSAPP ---
      if(window.confirm("Fees Save ho gayi hai! 📲 Kya Parent ko WhatsApp reminder bhejna hai?")) {
        sendWhatsAppReminder(student, total, paid, paid);
      }

      await fetchStudentsAndFees(); 

    } catch (error: any) {
      console.error("Save Error:", error);
      toast.error("Failed to save fees: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Fee Management</h1>
        <button 
          onClick={fetchStudentsAndFees} 
          className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300"
        >
          🔄 Refresh List
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Student Name</th>
              <th className="px-2 py-3 text-left">Mobile</th> {/* Mobile Column Added */}
              <th className="px-2 py-3 text-left">Tuition</th>
              <th className="px-2 py-3 text-left">Exam</th>
              <th className="px-2 py-3 text-left">Other</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Paid</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={9} className="p-6 text-center">Loading...</td></tr>
            ) : (
              students.map((student) => {
                 const feeObj = (student.fees && student.fees.length > 0) ? student.fees[0] : null;
                 return (
                   <FeeRow 
                     key={student.id} 
                     student={student} 
                     existingFee={feeObj} 
                     onSave={handleSaveFee} 
                     isSaving={processingId === student.id}
                   />
                 );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FeeRow = ({ student, existingFee, onSave, isSaving }: any) => {
  const raw = existingFee?.fee_structure || {};
  
  const [fees, setFees] = useState({
    tuition: raw.tuition || "",
    exam: raw.exam || "",
    other: raw.other || ""
  });
  const [paid, setPaid] = useState(existingFee?.paid_amount || "");

  const total = (Number(fees.tuition)||0) + (Number(fees.exam)||0) + (Number(fees.other)||0);
  
  const status = existingFee?.status || 'Pending';
  const statusColor = status === 'Paid' ? 'text-green-600' : status === 'Partial' ? 'text-orange-500' : 'text-red-500';

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="font-bold">{student.full_name}</div>
        <div className="text-xs text-gray-500">{student.class_name}</div>
      </td>
      
      {/* Mobile Number Display */}
      <td className="px-2 text-xs text-gray-600">
        {student.contact_number || "N/A"}
      </td>

      <td className="px-2"><input type="number" className="w-16 border p-1 rounded" placeholder="0" value={fees.tuition} onChange={e=>setFees({...fees, tuition: e.target.value})} /></td>
      <td className="px-2"><input type="number" className="w-16 border p-1 rounded" placeholder="0" value={fees.exam} onChange={e=>setFees({...fees, exam: e.target.value})} /></td>
      <td className="px-2"><input type="number" className="w-16 border p-1 rounded" placeholder="0" value={fees.other} onChange={e=>setFees({...fees, other: e.target.value})} /></td>
      
      <td className="px-4 py-3 font-bold text-blue-700">₹{total}</td>
      
      <td className="px-2"><input type="number" className="w-20 border border-green-300 bg-green-50 p-1 rounded" placeholder="0" value={paid} onChange={e=>setPaid(e.target.value)} /></td>
      
      <td className={`px-4 py-3 font-bold ${statusColor}`}>{status}</td>

      <td className="px-4 py-3">
        <button 
          onClick={() => onSave(student.id, fees, paid)} 
          disabled={isSaving}
          className={`px-3 py-1 rounded text-xs font-bold text-white shadow ${isSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isSaving ? 'Saving...' : '💾 Save'}
        </button>
      </td>
    </tr>
  );
};

export default ManageFees;
