import React, { useState } from 'react';
import { toast } from 'sonner';

// Supabase import ko abhi ke liye ignore karein
// import { supabase } from '../supabaseClient'; 

const ManageFees = () => {
  // 1. HAMNE SUPABASE BAND KAR DIYA HAI
  // 2. YE NAKLI DATA HAI CHECK KARNE KE LIYE
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
      fees: [] // Empty fee check
    }
  ]);

  const handleSaveFee = (studentId: string, structure: any, paid: string) => {
    console.log("Save clicked for:", studentId, structure, paid);
    toast.success("Test Mode: Save Button Works!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
        <p className="font-bold">Test Mode Active</p>
        <p>Agar ye list dikh rahi hai, to Code sahi hai. Problem Supabase Data me hai.</p>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-6">Fee Management (Test)</h1>
      
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-2 py-3 text-left">Tuition</th>
              <th className="px-2 py-3 text-left">Exam</th>
              <th className="px-2 py-3 text-left">Van</th>
              <th className="px-2 py-3 text-left">Other</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Paid</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* FIX 1: Array Check Lagaya Hai */}
            {Array.isArray(students) && students.length > 0 ? (
              students.map((student) => {
                // Safe Data Extraction
                const feeData = (student.fees && student.fees.length > 0) ? student.fees[0] : null;
                return (
                  <FeeRow 
                    key={student.id} 
                    student={student} 
                    existingFee={feeData} 
                    onSave={handleSaveFee} 
                  />
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Child Component ---
const FeeRow = ({ student, existingFee, onSave }: any) => {
  
  // Safe parsing helper
  const safeStr = (val: any) => {
    if (val === null || val === undefined) return "";
    return String(val); // Convert everything to string
  };

  // Safe Access using Optional Chaining (?.)
  const raw = existingFee?.fee_structure || {};

  // State
  const [fees, setFees] = useState({
    tuition: safeStr(raw.tuition),
    exam: safeStr(raw.exam),
    van: safeStr(raw.van),
    other: safeStr(raw.other),
  });

  const [paid, setPaid] = useState(safeStr(existingFee?.paid_amount));

  const total = 
    (Number(fees.tuition) || 0) + 
    (Number(fees.exam) || 0) + 
    (Number(fees.van) || 0) + 
    (Number(fees.other) || 0);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="font-bold">{safeStr(student?.full_name)}</div>
        <div className="text-xs text-gray-500">{safeStr(student?.class_name)}</div>
      </td>
      
      {/* FIX 2: Added || "" in all inputs to prevent crashes */}
      <td className="px-2">
        <input 
            type="number" 
            className="w-16 border p-1" 
            value={fees.tuition || ""} 
            onChange={e => setFees({...fees, tuition: e.target.value})} 
        />
      </td>
      <td className="px-2">
        <input 
            type="number" 
            className="w-16 border p-1" 
            value={fees.exam || ""} 
            onChange={e => setFees({...fees, exam: e.target.value})} 
        />
      </td>
      <td className="px-2">
        <input 
            type="number" 
            className="w-16 border p-1" 
            value={fees.van || ""} 
            onChange={e => setFees({...fees, van: e.target.value})} 
        />
      </td>
      <td className="px-2">
        <input 
            type="number" 
            className="w-16 border p-1" 
            value={fees.other || ""} 
            onChange={e => setFees({...fees, other: e.target.value})} 
        />
      </td>
      
      <td className="px-4 py-3 font-bold text-blue-700">₹{total}</td>
      
      <td className="px-2">
        <input 
            type="number" 
            className="w-20 border border-green-300 bg-green-50 p-1" 
            value={paid || ""} 
            onChange={e => setPaid(e.target.value)} 
        />
      </td>
      
      <td className="px-4 py-3">
        <button onClick={() => onSave(student.id, fees, paid)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">
          Test Save
        </button>
      </td>
    </tr>
  );
};

export default ManageFees;
