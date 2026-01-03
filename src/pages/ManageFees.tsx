import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const ManageFees = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Data fetch query
      const { data, error } = await supabase
        .from('students')
        .select(`
          id, full_name, class_name, roll_number,
          fees ( id, total_amount, paid_amount, status, fee_structure )
        `)
        .order('class_name', { ascending: true });

      if (error) throw error;

      console.log("Fetched Data:", data); // F12 daba kar Console check karein
      setStudents(data || []);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFee = async (studentId: string, structure: any, paid: string) => {
    // Safety: Ensure numbers only
    const cleanNumber = (val: any) => {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    const total = 
      cleanNumber(structure.tuition) + 
      cleanNumber(structure.exam) + 
      cleanNumber(structure.van) + 
      cleanNumber(structure.other);

    const paidNum = cleanNumber(paid);
    
    let status = 'Pending';
    if (paidNum >= total && total > 0) status = 'Paid';
    else if (paidNum > 0) status = 'Partial';

    try {
      const { data: existingFee } = await supabase
        .from('fees')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();

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

      toast.success("Saved!");
      fetchData(); 

    } catch (err: any) {
      toast.error("Failed: " + err.message);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Fee Manager</h1>
      
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
            {students.map((student) => {
              // Safety: Check if fees array exists
              const feeData = (Array.isArray(student.fees) && student.fees.length > 0) 
                ? student.fees[0] 
                : {};
                
              return (
                <FeeRow 
                  key={student.id} // Unique Key zaroori hai
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

// --- Child Component (Isolated to prevent crash) ---
const FeeRow = ({ student, existingFee, onSave }: any) => {
  
  // 1. Data Cleaning Function (Agar DB me garbage value hai to 0 return karega)
  const safeVal = (val: any) => {
    if (typeof val === 'object') return 0; // Object crash rokne ke liye
    if (val === null || val === undefined) return 0;
    return val;
  };

  // 2. Initialize State Safely
  const defaultStructure = { tuition: 0, exam: 0, van: 0, other: 0 };
  const incomingStructure = existingFee?.fee_structure || {};

  const [fees, setFees] = useState({
    tuition: safeVal(incomingStructure.tuition),
    exam: safeVal(incomingStructure.exam),
    van: safeVal(incomingStructure.van),
    other: safeVal(incomingStructure.other),
  });

  const [paid, setPaid] = useState(safeVal(existingFee?.paid_amount));

  // 3. Sync State when Props Change
  useEffect(() => {
    const newStructure = existingFee?.fee_structure || {};
    setFees({
      tuition: safeVal(newStructure.tuition),
      exam: safeVal(newStructure.exam),
      van: safeVal(newStructure.van),
      other: safeVal(newStructure.other),
    });
    setPaid(safeVal(existingFee?.paid_amount));
  }, [existingFee]);

  // 4. Calculate Total Safely
  const total = 
    Number(fees.tuition) + 
    Number(fees.exam) + 
    Number(fees.van) + 
    Number(fees.other);

  const handleChange = (key: string, val: string) => {
    setFees(prev => ({ ...prev, [key]: val })); // String rakho taaki user type kar sake
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{student.full_name || 'No Name'}</div>
        <div className="text-xs text-gray-500">{student.class_name} ({student.roll_number})</div>
      </td>
      
      {/* Inputs with String Conversion to prevent Object Crash */}
      <td className="px-2"><input type="number" className="w-16 border rounded p-1" value={String(fees.tuition)} onChange={e => handleChange('tuition', e.target.value)} /></td>
      <td className="px-2"><input type="number" className="w-16 border rounded p-1" value={String(fees.exam)} onChange={e => handleChange('exam', e.target.value)} /></td>
      <td className="px-2"><input type="number" className="w-16 border rounded p-1" value={String(fees.van)} onChange={e => handleChange('van', e.target.value)} /></td>
      <td className="px-2"><input type="number" className="w-16 border rounded p-1" value={String(fees.other)} onChange={e => handleChange('other', e.target.value)} /></td>
      
      <td className="px-4 py-3 font-bold text-blue-700">₹{total}</td>
      
      <td className="px-2">
        <input type="number" className="w-20 border border-green-300 bg-green-50 rounded p-1" value={String(paid)} onChange={e => setPaid(e.target.value)} />
      </td>
      
      <td className="px-4 py-3">
        <button 
          onClick={() => onSave(student.id, fees, paid)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700"
        >
          Update
        </button>
      </td>
    </tr>
  );
};

export default ManageFees;
