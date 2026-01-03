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
      console.log("FRESH DATA:", data);
      setStudents(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFee = async (studentId: string, structure: any, paid: string) => {
    // Save logic same as before...
    const cleanNum = (val: any) => { const n = Number(val); return isNaN(n) ? 0 : n; };
    const total = cleanNum(structure.tuition) + cleanNum(structure.exam) + cleanNum(structure.van) + cleanNum(structure.other);
    const paidNum = cleanNum(paid);
    
    let status = 'Pending';
    if (paidNum >= total && total > 0) status = 'Paid';
    else if (paidNum > 0) status = 'Partial';

    try {
      const { data: existingFee } = await supabase.from('fees').select('id').eq('student_id', studentId).maybeSingle();
      const payload = { student_id: studentId, total_amount: total, paid_amount: paidNum, fee_structure: structure, status: status };

      if (existingFee?.id) await supabase.from('fees').update(payload).eq('student_id', studentId);
      else await supabase.from('fees').insert([payload]);

      toast.success("Saved!");
      fetchData();
    } catch (err: any) { toast.error("Failed: " + err.message); }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4 text-red-600">DEBUG MODE (Won't Crash)</h1>
      
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-black text-white">
            <tr>
              <th className="p-2 border">Student Name</th>
              <th className="p-2 border">Class</th>
              <th className="p-2 border">Tuition</th>
              <th className="p-2 border">Exam</th>
              <th className="p-2 border">Van</th>
              <th className="p-2 border">Other</th>
              <th className="p-2 border">Total</th>
              <th className="p-2 border">Paid</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              // Safety: Ensure fees is an array
              const feesArr = Array.isArray(student.fees) ? student.fees : [];
              const feeData = feesArr[0] || {};
              
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

// --- CRASH PROOF ROW COMPONENT ---
const FeeRow = ({ student, existingFee, onSave }: any) => {
  
  // *** MAGIC FUNCTION ***
  // Ye function kisi bhi value ko string bana dega.
  // Agar Object hoga, to use JSON string bana kar dikhayega (Crash nahi hone dega)
  const safeRender = (val: any) => {
    if (val === null || val === undefined) return "";
    if (typeof val === 'object') return JSON.stringify(val); // <--- YE CRASH ROKEGA
    return String(val);
  };

  const rawStructure = existingFee?.fee_structure || {};
  
  // State me bhi safeRender use karein
  const [fees, setFees] = useState({
    tuition: safeRender(rawStructure.tuition).replace(/[^0-9.]/g, ''), // Sirf number rakhega
    exam: safeRender(rawStructure.exam).replace(/[^0-9.]/g, ''),
    van: safeRender(rawStructure.van).replace(/[^0-9.]/g, ''),
    other: safeRender(rawStructure.other).replace(/[^0-9.]/g, ''),
  });

  const [paid, setPaid] = useState(safeRender(existingFee?.paid_amount).replace(/[^0-9.]/g, ''));

  useEffect(() => {
    const newStr = existingFee?.fee_structure || {};
    setFees({
      tuition: safeRender(newStr.tuition).replace(/[^0-9.]/g, ''),
      exam: safeRender(newStr.exam).replace(/[^0-9.]/g, ''),
      van: safeRender(newStr.van).replace(/[^0-9.]/g, ''),
      other: safeRender(newStr.other).replace(/[^0-9.]/g, ''),
    });
    setPaid(safeRender(existingFee?.paid_amount).replace(/[^0-9.]/g, ''));
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
    <tr className="border-b hover:bg-yellow-50">
      <td className="p-2 border text-blue-800 font-bold">
        {/* Name render check */}
        {safeRender(student.full_name)}
      </td>
      <td className="p-2 border">
        {safeRender(student.class_name)} <br/>
        <span className="text-xs text-gray-400">Roll: {safeRender(student.roll_number)}</span>
      </td>
      
      {/* Input Fields */}
      <td className="p-1 border"><input className="w-16 border p-1 bg-white" value={fees.tuition} onChange={e => handleChange('tuition', e.target.value)} /></td>
      <td className="p-1 border"><input className="w-16 border p-1 bg-white" value={fees.exam} onChange={e => handleChange('exam', e.target.value)} /></td>
      <td className="p-1 border"><input className="w-16 border p-1 bg-white" value={fees.van} onChange={e => handleChange('van', e.target.value)} /></td>
      <td className="p-1 border"><input className="w-16 border p-1 bg-white" value={fees.other} onChange={e => handleChange('other', e.target.value)} /></td>
      
      <td className="p-2 border font-bold">₹{total}</td>
      
      <td className="p-1 border">
        <input className="w-20 border p-1 bg-green-50" value={paid} onChange={e => setPaid(e.target.value)} />
      </td>
      
      <td className="p-2 border">
        <button onClick={() => onSave(student.id, fees, paid)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
          Save
        </button>
      </td>
    </tr>
  );
};

export default ManageFees;
