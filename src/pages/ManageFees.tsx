import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

// --- Types for Safety ---
interface FeeStructure {
  tuition: number;
  exam: number;
  van: number;
  other: number;
}

interface Student {
  id: string;
  full_name: string;
  class_name: string;
  roll_number: string;
  fees: any[]; // Supabase array return karta hai
}

const ManageFees = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial Data Fetch
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select(`
          id, full_name, class_name, roll_number,
          fees ( id, total_amount, paid_amount, status, fee_structure )
        `)
        .order('class_name', { ascending: true });

      if (error) throw error;

      // Safety check: Agar data null hai to empty array set karein
      setStudents(data || []);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFee = async (studentId: string, structure: FeeStructure, paid: string) => {
    // NaN safety check
    const total = 
      (Number(structure?.tuition) || 0) + 
      (Number(structure?.exam) || 0) + 
      (Number(structure?.van) || 0) + 
      (Number(structure?.other) || 0);

    const paidNum = Number(paid) || 0;
    
    let status = 'Pending';
    if (paidNum >= total && total > 0) status = 'Paid';
    else if (paidNum > 0) status = 'Partial';

    try {
      // Check existing record safely
      const { data: existingFee, error: fetchError } = await supabase
        .from('fees')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const payload = {
        student_id: studentId,
        total_amount: total,
        paid_amount: paidNum,
        fee_structure: structure,
        status: status
      };

      if (existingFee?.id) {
        await supabase.from('fees').update(payload).eq('student_id', studentId);
      } else {
        await supabase.from('fees').insert([payload]);
      }

      toast.success("Updated successfully!");
      fetchData(); // Refresh list

    } catch (err: any) {
      toast.error("Failed: " + err.message);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Fee Management</h1>
      
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
            {/* Safety Check: students array hai ya nahi */}
            {Array.isArray(students) && students.map((student) => {
              // Extract fee data safely
              const feeData = (student.fees && student.fees.length > 0) ? student.fees[0] : null;
              
              return (
                <FeeRow 
                  key={student.id} 
                  student={student} 
                  existingFee={feeData} 
                  onSave={handleSaveFee} 
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Child Component ---
const FeeRow = ({ student, existingFee, onSave }: any) => {
  
  // Default structure ensure karein taaki undefined na ho
  const defaultStructure = { tuition: 0, exam: 0, van: 0, other: 0 };
  
  // Local state initialize karein
  const [fees, setFees] = useState(existingFee?.fee_structure || defaultStructure);
  const [paid, setPaid] = useState(existingFee?.paid_amount || 0);
  const [loadingSave, setLoadingSave] = useState(false);

  // Jab parent data update kare, local state sync karein
  useEffect(() => {
    if (existingFee) {
      setFees(existingFee.fee_structure || defaultStructure);
      setPaid(existingFee.paid_amount || 0);
    }
  }, [existingFee]);

  // Handle Input Change (Helper function)
  const handleFeeChange = (field: string, value: string) => {
    const numVal = value === '' ? 0 : parseFloat(value);
    setFees((prev: any) => ({ ...prev, [field]: numVal }));
  };

  const total = 
    (Number(fees?.tuition) || 0) + 
    (Number(fees?.exam) || 0) + 
    (Number(fees?.van) || 0) + 
    (Number(fees?.other) || 0);

  const handleUpdateClick = async () => {
    setLoadingSave(true);
    await onSave(student.id, fees, paid);
    setLoadingSave(false);
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-medium">
        {student.full_name} <br/>
        <span className="text-xs text-gray-500">{student.class_name} ({student.roll_number})</span>
      </td>
      
      {/* CRITICAL FIX: 
         value={fees.tuition ?? ''} 
         Agar fees.tuition undefined hai to empty string use karega, crash nahi karega.
      */}
      <td className="px-2">
        <input 
          type="number" 
          className="w-16 border rounded p-1" 
          value={fees.tuition ?? ''} 
          onChange={(e) => handleFeeChange('tuition', e.target.value)}
          placeholder="0"
        />
      </td>
      <td className="px-2">
        <input 
          type="number" 
          className="w-16 border rounded p-1" 
          value={fees.exam ?? ''} 
          onChange={(e) => handleFeeChange('exam', e.target.value)}
          placeholder="0"
        />
      </td>
      <td className="px-2">
        <input 
          type="number" 
          className="w-16 border rounded p-1" 
          value={fees.van ?? ''} 
          onChange={(e) => handleFeeChange('van', e.target.value)}
          placeholder="0"
        />
      </td>
      <td className="px-2">
        <input 
          type="number" 
          className="w-16 border rounded p-1" 
          value={fees.other ?? ''} 
          onChange={(e) => handleFeeChange('other', e.target.value)}
          placeholder="0"
        />
      </td>
      
      <td className="px-4 py-3 font-bold text-blue-700">₹{total}</td>
      
      <td className="px-2">
        <input 
          type="number" 
          className="w-20 border border-green-300 rounded p-1 bg-green-50" 
          value={paid ?? ''} 
          onChange={(e) => setPaid(e.target.value)}
          placeholder="0"
        />
      </td>
      
      <td className="px-4 py-3">
        <button 
          onClick={handleUpdateClick}
          disabled={loadingSave}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs font-bold disabled:bg-gray-400"
        >
          {loadingSave ? '...' : 'Save'}
        </button>
      </td>
    </tr>
  );
};

export default ManageFees;
