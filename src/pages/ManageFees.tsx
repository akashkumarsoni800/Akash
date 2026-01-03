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
      const { data, error } = await supabase
        .from('students')
        .select(`
          id, full_name, class_name, roll_number,
          fees ( id, total_amount, paid_amount, status, fee_structure )
        `)
        .order('class_name', { ascending: true });

      if (error) throw error;
      
      console.log("Supabase Data:", data); // F12 daba kar Console check karein
      setStudents(data || []);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFee = async (studentId: string, structure: any, paid: string) => {
    // 1. Convert everything to Number safely
    const toNum = (val: any) => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const total = 
      toNum(structure.tuition) + 
      toNum(structure.exam) + 
      toNum(structure.van) + 
      toNum(structure.other);

    const paidNum = toNum(paid);
    
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
        fee_structure: structure, // Saving JSON object
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
      console.error(err);
      toast.error("Failed to save");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Fee Manager</h1>
      
      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="p-3 text-left">Student</th>
              <th className="p-2">Tuition</th>
              <th className="p-2">Exam</th>
              <th className="p-2">Van</th>
              <th className="p-2">Other</th>
              <th className="p-3">Total</th>
              <th className="p-3">Paid</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              // Safety: Ensure we don't crash if fees is missing
              const feesArr = Array.isArray(student.fees) ? student.fees : [];
              const feeData = feesArr.length > 0 ? feesArr[0] : {};
              
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

// --- ISOLATED COMPONENT TO PREVENT CRASH ---
const FeeRow = ({ student, existingFee, onSave }: any) => {
  
  // ULTRA SAFE VALUE FUNCTION
  // Yeh function check karega ki value Object to nahi hai?
  const safeVal = (val: any) => {
    if (val === null || val === undefined) return "";
    if (typeof val === 'object') {
      console.warn("CRASH PREVENTED: Object found in input", val);
      return ""; // Agar Object hai to blank return karo, crash nahi
    }
    return val;
  };

  // Initial Structure
  const rawStr = existingFee?.fee_structure || {};

  const [fees, setFees] = useState({
    tuition: safeVal(rawStr.tuition),
    exam: safeVal(rawStr.exam),
    van: safeVal(rawStr.van),
    other: safeVal(rawStr.other),
  });

  const [paid, setPaid] = useState(safeVal(existingFee?.paid_amount));

  // Sync with DB
  useEffect(() => {
    const newStr = existingFee?.fee_structure || {};
    setFees({
      tuition: safeVal(newStr.tuition),
      exam: safeVal(newStr.exam),
      van: safeVal(newStr.van),
      other: safeVal(newStr.other),
    });
    setPaid(safeVal(existingFee?.paid_amount));
  }, [existingFee]);

  const handleChange = (field: string, val: string) => {
    setFees(prev => ({ ...prev, [field]: val }));
  };

  const total = 
    (Number(fees.tuition) || 0) + 
    (Number(fees.exam) || 0) + 
    (Number(fees.van) || 0) + 
    (Number(fees.other) || 0);

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-3">
        {/* Use safeVal here too just in case */}
        <div className="font-bold">{safeVal(student.full_name)}</div>
        <div className="text-xs text-gray-500">{safeVal(student.class_name)} ({safeVal(student.roll_number)})</div>
      </td>
      
      <td className="p-2"><input type="number" className="w-16 border p-1 rounded" value={fees.tuition} onChange={e => handleChange('tuition', e.target.value)} placeholder="0" /></td>
      <td className="p-2"><input type="number" className="w-16 border p-1 rounded" value={fees.exam} onChange={e => handleChange('exam', e.target.value)} placeholder="0" /></td>
      <td className="p-2"><input type="number" className="w-16 border p-1 rounded" value={fees.van} onChange={e => handleChange('van', e.target.value)} placeholder="0" /></td>
      <td className="p-2"><input type="number" className="w-16 border p-1 rounded" value={fees.other} onChange={e => handleChange('other', e.target.value)} placeholder="0" /></td>
      
      <td className="p-3 font-bold text-blue-600">₹{total}</td>
      
      <td className="p-2">
        <input type="number" className="w-20 border border-green-400 bg-green-50 p-1 rounded" value={paid} onChange={e => setPaid(e.target.value)} placeholder="0" />
      </td>
      
      <td className="p-3">
        <button 
          onClick={() => onSave(student.id, fees, paid)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
        >
          Save
        </button>
      </td>
    </tr>
  );
};

export default ManageFees;
