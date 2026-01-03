import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

// --- Types define kiye taaki errors na aayein ---
interface FeeStructure {
  tuition: number;
  exam: number;
  van: number;
  other: number;
}

interface FeeData {
  id?: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  fee_structure: FeeStructure;
}

interface Student {
  id: string;
  full_name: string;
  class_name: string;
  roll_number: string;
  fees: FeeData[]; // Supabase array return karta hai join me
}

const ManageFees = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

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
      setStudents(data || []);
    } catch (err: any) {
      toast.error("Error fetching data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFee = async (studentId: string, structure: FeeStructure, paid: string) => {
    const total = 
      (Number(structure.tuition) || 0) + 
      (Number(structure.exam) || 0) + 
      (Number(structure.van) || 0) + 
      (Number(structure.other) || 0);

    const paidNum = Number(paid);
    
    let status = 'Pending';
    if (paidNum >= total && total > 0) status = 'Paid';
    else if (paidNum > 0 && paidNum < total) status = 'Partial';

    try {
      // Check if fee record exists
      const { data: existingFee } = await supabase
        .from('fees')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle(); // .single() error de sakta hai agar row na ho, isliye maybeSingle()

      const payload = {
        student_id: studentId,
        total_amount: total,
        paid_amount: paidNum,
        fee_structure: structure,
        status: status
      };

      if (existingFee?.id) {
        const { error } = await supabase.from('fees').update(payload).eq('student_id', studentId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fees').insert([payload]);
        if (error) throw error;
      }

      toast.success("Fee updated successfully!");
      await fetchData(); // Data refresh karein

    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    }
  };

  if (loading) return <div className="p-6">Loading data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Fee Structure Management</h1>
      
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Student Info</th>
              <th className="px-4 py-3 text-left">Tuition</th>
              <th className="px-4 py-3 text-left">Exam</th>
              <th className="px-4 py-3 text-left">Van</th>
              <th className="px-4 py-3 text-left">Other</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Paid</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student) => {
              // Safe access for fees (array ka first item ya empty object)
              const feeData = student.fees && student.fees.length > 0 ? student.fees[0] : null;
              
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

const FeeRow = ({ student, existingFee, onSave }: { student: Student, existingFee: FeeData | null, onSave: any }) => {
  
  const defaultStructure = { tuition: 0, exam: 0, van: 0, other: 0 };
  
  // State initialization
  const [fees, setFees] = useState<FeeStructure>(existingFee?.fee_structure || defaultStructure);
  const [paid, setPaid] = useState<string>(existingFee?.paid_amount?.toString() || "0");
  const [isSaving, setIsSaving] = useState(false);

  // FIX: Jab parent se naya data aaye (after save), tab local state update karein
  useEffect(() => {
    if (existingFee) {
      setFees(existingFee.fee_structure || defaultStructure);
      setPaid(existingFee.paid_amount?.toString() || "0");
    } else {
      setFees(defaultStructure);
      setPaid("0");
    }
  }, [existingFee]); // Dependency array me existingFee zaroori hai

  const total = 
    (Number(fees.tuition) || 0) + 
    (Number(fees.exam) || 0) + 
    (Number(fees.van) || 0) + 
    (Number(fees.other) || 0);

  const handleUpdate = async () => {
    setIsSaving(true);
    await onSave(student.id, fees, paid);
    setIsSaving(false);
  };

  // Helper to handle input changes
  const handleChange = (field: keyof FeeStructure, value: string) => {
    setFees(prev => ({ ...prev, [field]: Number(value) }));
  };

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-4 py-3 font-medium">
        {student.full_name} <br/>
        <span className="text-xs text-gray-500">{student.class_name} ({student.roll_number})</span>
      </td>
      
      {/* Inputs - value={val || ''} lagaya taaki 0 hone par NaN na dikhe agar user delete kare */}
      <td className="px-2">
        <input 
          type="number" 
          className="w-20 border rounded p-1 focus:ring-2 focus:ring-blue-500 outline-none" 
          value={fees.tuition || ''} 
          placeholder="0"
          onChange={e => handleChange('tuition', e.target.value)} 
        />
      </td>
      <td className="px-2">
        <input 
          type="number" 
          className="w-20 border rounded p-1 focus:ring-2 focus:ring-blue-500 outline-none" 
          value={fees.exam || ''} 
          placeholder="0"
          onChange={e => handleChange('exam', e.target.value)} 
        />
      </td>
      <td className="px-2">
        <input 
          type="number" 
          className="w-20 border rounded p-1 focus:ring-2 focus:ring-blue-500 outline-none" 
          value={fees.van || ''} 
          placeholder="0"
          onChange={e => handleChange('van', e.target.value)} 
        />
      </td>
      <td className="px-2">
        <input 
          type="number" 
          className="w-20 border rounded p-1 focus:ring-2 focus:ring-blue-500 outline-none" 
          value={fees.other || ''} 
          placeholder="0"
          onChange={e => handleChange('other', e.target.value)} 
        />
      </td>
      
      <td className="px-4 py-3 font-bold text-blue-700">₹{total}</td>
      
      <td className="px-2">
        <input 
          type="number" 
          className="w-20 border border-green-300 rounded p-1 bg-green-50 focus:ring-2 focus:ring-green-500 outline-none" 
          value={paid} 
          onChange={e => setPaid(e.target.value)} 
        />
      </td>
      
      <td className="px-4 py-3">
        <button 
          onClick={handleUpdate}
          disabled={isSaving}
          className={`px-3 py-1 rounded text-xs font-bold text-white transition
            ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
          `}
        >
          {isSaving ? 'Saving...' : 'Update'}
        </button>
      </td>
    </tr>
  );
};

export default ManageFees;
