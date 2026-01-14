import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const ManageFees = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [feeHeads, setFeeHeads] = useState<any[]>([]);
  const [newHeadName, setNewHeadName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [month, setMonth] = useState('');
  const [feeValues, setFeeValues] = useState<any>({}); 

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // ✅ सभी कॉलम्स को खींचना सुनिश्चित करें
      const { data: stdData, error } = await supabase
        .from('students')
        .select('*') 
        .order('full_name');
        
      if (error) throw error;
      if (stdData) setStudents(stdData);

      const { data: headData } = await supabase.from('fee_heads').select('*').order('id');
      if (headData) {
        setFeeHeads(headData);
        // initialValues में नाम की जगह id इस्तेमाल करें
const initialValues: any = {};
headData.forEach((h: any) => initialValues[h.id] = 0); // h.name की जगह h.id
setFeeValues(initialValues);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
    }
  };

  const sendWhatsAppReminder = () => {
    if (!selectedStudent || !month) {
      toast.error("Please select Student and Month first.");
      return;
    }

    // ✅ ID Matching Fix: Number() का उपयोग करें क्योंकि ID bigint हो सकती है
    const student = students.find(s => String(s.id) === String(selectedStudent));
    
    if (!student) {
      toast.error("Student not found in the list! Try refreshing.");
      return;
    }

    if (!student.contact_number) {
      toast.error(`Contact number missing for ${student.full_name}`);
      return;
    }

    // नंबर क्लीनिंग और मैसेज जनरेशन
    let phone = student.contact_number.toString().replace(/\D/g, '');
    if (phone.length === 10) phone = "91" + phone;

    const totalAmount = Object.values(feeValues).reduce((sum: number, val: any) => sum + Number(val || 0), 0);
    
    let message = `🔔 *Fee Reminder - Adarsh Shishu Mandir*\n\n`;
    message += `Dear Parent,\nFee details for *${student.full_name}* (Class: ${student.class_name})\n`;
    message += `Month: *${month}*\n\n*Breakdown:* \n`;

    Object.entries(feeValues).forEach(([head, amount]: any) => {
        if (Number(amount) > 0) message += `• ${head}: ₹${amount}\n`;
    });

    message += `\n------------------\n*TOTAL PAYABLE: ₹${totalAmount}*\n------------------\n\n`;
    message += `Please pay via UPI or at school office.`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
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

 const handleFeeValueChange = (headId: string, value: string) => {
  setFeeValues({ ...feeValues, [headId]: value });
};
  return (
   <div className="p-6 bg-gray-50 min-h-screen notranslate">
  
      <h1 className="text-3xl font-bold text-blue-900 mb-6">💰 Manage Fees & Reminders</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Assign Fee to Student</h2>
          <form onSubmit={handleAssignFee} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700">Select Student</label>
             <select 
  className="w-full border p-2 rounded" 
  value={selectedStudent}
  onChange={e => setSelectedStudent(e.target.value)}
  translate="no" // यहाँ जोड़ें ताकि ID और नाम न बदलें
>
                <option value="">-- Select --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {/* ✅ UI में ही पता चल जाएगा कि किसका नंबर डेटाबेस में है */}
                    {s.full_name} ({s.class_name}) {s.contact_number ? "✅" : "⚠️ No No."}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Month</label>
              <input type="month" className="w-full border p-2 rounded" value={month} onChange={e => setMonth(e.target.value)} />
            </div>
            <hr className="my-4" />
            <div className="grid grid-cols-2 gap-4">
              {feeHeads.map((head) => (
                <div key={head.id}>
                  <label className="block text-xs font-bold text-gray-600 mb-1">{head.name}</label>
                 <input 
  type="number" 
  className="w-full border p-2 rounded" 
  placeholder="0"
  value={feeValues[head.name] || ''} // यह लाइन जोड़ें
  onChange={(e) => handleFeeValueChange(head.name, e.target.value)}
/>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 p-3 rounded flex justify-between items-center">
              <span className="font-bold text-blue-900">Total: ₹{Object.values(feeValues).reduce((sum: number, val: any) => sum + Number(val || 0), 0)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={sendWhatsAppReminder} className="bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600">💬 WhatsApp</button>
              <button disabled={loading} className="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">{loading ? "Saving..." : "💾 Save Fee"}</button>
            </div>
          </form>
        </div>
        {/* Fee Settings Section */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-purple-200">
          <h2 className="text-xl font-bold text-purple-900 mb-2">⚙️ Fee Settings</h2>
          <div className="flex gap-2">
            <input type="text" placeholder="Ex: Exam Fee" className="flex-1 border p-2 rounded" value={newHeadName} onChange={e => setNewHeadName(e.target.value)} />
            <button onClick={async () => {
              if(!newHeadName) return;
              await supabase.from('fee_heads').insert([{ name: newHeadName }]);
              setNewHeadName(''); fetchInitialData();
            }} className="bg-purple-600 text-white px-4 py-2 rounded font-bold">+ Add</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageFees;
