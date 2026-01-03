import React, { useState } from 'react';
import { toast } from 'sonner'; // ✅ Toast wapas aa gaya

const ManageFees = () => {
  // --- DUMMY DATA ---
  const [students, setStudents] = useState([
    {
      id: "1",
      full_name: "Rohan Kumar",
      class_name: "10th",
      roll_number: "101",
      fees: [
        {
          id: "fee_1",
          total_amount: 5000,
          paid_amount: 2000,
          status: "Partial",
          fee_structure: { tuition: 4000, exam: 500, van: 500, other: 0 }
        }
      ]
    },
    {
      id: "2",
      full_name: "Sita Kumari",
      class_name: "9th",
      roll_number: "22",
      fees: [] 
    }
  ]);

  const handleSaveFee = (studentId: string, structure: any, paid: string) => {
    console.log("Saving data:", studentId, structure, paid);
    // ✅ Toast chalega kyunki baki pages par chal raha hai
    toast.success("Fee Updated Successfully (Test Mode)");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
        <p className="font-bold">Info</p>
        <p>Checking Fee Module with Toast Notifications.</p>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-6">Fee Management</h1>
      
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Student Name</th>
              <th className="px-2 py-3 text-left">Tuition</th>
              <th className="px-2 py-3 text-left">Exam</th>
              <th className="px-2 py-3 text-left">Other</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Paid</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* --- SAFE LOOP START --- */}
            {Array.isArray(students) && students.map((student) => {
               // Agar student null/undefined hai to ignore karein
               if (!student) return null;

               // Safe check for fees array
               const feeData = (student.fees && Array.isArray(student.fees) && student.fees.length > 0) 
                  ? student.fees[0] 
                  : null;
               
               return (
                 <FeeRow 
                   key={student.id} 
                   student={student} 
                   existingFee={feeData} 
                   onSave={handleSaveFee} 
                 />
               );
            })}
            {/* --- SAFE LOOP END --- */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Child Component ---
const FeeRow = ({ student, existingFee, onSave }: any) => {
  
  // --- CRASH PREVENTER FUNCTION ---
  // Ye function kisi bhi Object ko string me badal dega taki app crash na ho
  const safeVal = (v: any) => {
    if (v === null || v === undefined) return "";
    if (typeof v === 'object') return ""; // Agar galti se object aa gaya to blank return karega
    return String(v);
  };

  const raw = existingFee?.fee_structure || {};

  // State with Safe Values
  const [fees, setFees] = useState({
    tuition: safeVal(raw.tuition),
    exam: safeVal(raw.exam),
    other: safeVal(raw.other),
  });

  const [paid, setPaid] = useState(safeVal(existingFee?.paid_amount));

  // Calculation (Safe Number conversion)
  const total = (Number(fees.tuition)||0) + (Number(fees.exam)||0) + (Number(fees.other)||0);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        {/* Yahan 'safeVal' use kiya hai taki object print na ho */}
        <div className="font-bold text-gray-800">{safeVal(student?.full_name)}</div>
        <div className="text-xs text-gray-500">Class: {safeVal(student?.class_name)}</div>
      </td>
      
      {/* Inputs Controlled using || "" */}
      <td className="px-2">
        <input type="number" className="w-16 border p-1 rounded" 
               value={fees.tuition || ""} onChange={e=>setFees({...fees, tuition: e.target.value})} />
      </td>
      <td className="px-2">
        <input type="number" className="w-16 border p-1 rounded" 
               value={fees.exam || ""} onChange={e=>setFees({...fees, exam: e.target.value})} />
      </td>
      <td className="px-2">
        <input type="number" className="w-16 border p-1 rounded" 
               value={fees.other || ""} onChange={e=>setFees({...fees, other: e.target.value})} />
      </td>
      
      <td className="px-4 py-3 font-bold text-blue-700">₹{total}</td>
      
      <td className="px-2">
        <input type="number" className="w-20 border border-green-300 bg-green-50 p-1 rounded" 
               value={paid || ""} onChange={e=>setPaid(e.target.value)} />
      </td>
      
      <td className="px-4 py-3">
        <button 
          onClick={() => onSave(student?.id, fees, paid)} 
          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 shadow-sm transition">
          Update
        </button>
      </td>
    </tr>
  );
};

export default ManageFees;
