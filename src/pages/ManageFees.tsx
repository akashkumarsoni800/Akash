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
      setStudents(data || []);
    } catch (err: any) {
      // FIX 1: Error object ko string me badla taaki crash na ho
      console.error(err); 
      toast.error("Failed to load data. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFee = async (studentId: string, structure: any, paid: string) => {
    // FIX 2: Numbers ko safe tarike se convert karna
    const cleanNum = (val: any) => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const total = 
      cleanNum(structure.tuition) + 
      cleanNum(structure.exam) + 
      cleanNum(structure.van) + 
      cleanNum(structure.other);

    const paidNum = cleanNum(paid);
    
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

      toast.success("Updated Successfully!");
      fetchData(); 

    } catch (err: any) {
      toast.error("Save Failed");
      console.error(err);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Student Data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Fee Management</h1>
      
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
              // FIX 3: Safe Data Extraction
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

// --- Child Component (Isi me crash ho raha tha) ---
const FeeRow = ({ student, existingFee, onSave }: any) => {
  
  // Safe parsing function
  const getSafeVal = (val: any) => {
    if (val === null || val === undefined || typeof val === 'object') return "";
    return val;
  };

  const rawStructure = existingFee?.fee_structure || {};
  
  const [fees, setFees] = useState({
    tuition: getSafeVal(rawStructure.tuition),
    exam: getSafeVal(rawStructure.exam),
    van: getSafeVal(rawStructure.van),
    other: getSafeVal(rawStructure.other),
  });

  const [paid, setPaid] = useState(getSafeVal(existingFee?.paid_amount));

  // Sync state when data loads
  useEffect(() => {
    const newStr = existingFee?.fee_structure || {};
    setFees({
      tuition: getSafeVal(newStr.tuition),
      exam: getSafeVal(newStr.exam),
      van: getSafeVal(newStr.van),
      other: getSafeVal(newStr.other),
    });
    setPaid(getSafeVal(existingFee?.paid_amount));
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
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        {/* FIX 4: Sirf strings display karein */}
        <div className="font-medium text-gray-900">{String(student.full_name)}</div>
        <div className="text-xs text-gray-500">{String(student.class_name)} ({String(student.roll_number)})</div>
      </td>
      
      <td className="px-2"><input type="number" className="w-16 border rounded p-1" value={fees.tuition} onChange={e => handleChange('tuition', e.target.value)} placeholder="0" /></td>
      <td className="px-2"><input type="number" className="w-16 border rounded p-1" value={fees.exam} onChange={e => handleChange('exam', e.target.value)} placeholder="0" /></td>
      <td className="px-2"><input type="number" className="w-16 border rounded p-1" value={fees.van} onChange={e => handleChange('van', e.target.value)} placeholder="0" /></td>
      <td className="px-2"><input type="number" className="w-16 border rounded p-1" value={fees.other} onChange={e => handleChange('other', e.target.value)} placeholder="0" /></td>
      
      <td className="px-4 py-3 font-bold text-blue-700">₹{total}</td>
      
      <td className="px-2">
        <input type="number" className="w-20 border border-green-300 bg-green-50 rounded p-1" value={paid} onChange={e => setPaid(e.target.value)} placeholder="0" />
      </td>
      
      <td className="px-4 py-3">
        <button 
          onClick={() => onSave(student.id, fees, paid)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700"
        >
          Save
        </button>
      </td>
    </tr>
  );
};

export default ManageFees;
