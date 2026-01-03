import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const ManageFees = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Data fetch karna
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Students aur unki Fees ek saath layein
      const { data, error } = await supabase
        .from('students')
        .select(`
          id, full_name, class_name, roll_number,
          fees ( total_amount, paid_amount, status )
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

  // Fee Update karna
  const handleUpdateFee = async (studentId: string, total: string, paid: string) => {
    const totalNum = Number(total);
    const paidNum = Number(paid);
    let status = 'Pending';

    if (paidNum >= totalNum && totalNum > 0) status = 'Paid';
    else if (paidNum > 0) status = 'Partial';

    try {
      // Check karein agar fee record pehle se hai
      const { data: existingFee } = await supabase
        .from('fees')
        .select('id')
        .eq('student_id', studentId)
        .single();

      let error;
      
      if (existingFee) {
        // Update karein
        const { error: updateError } = await supabase
          .from('fees')
          .update({ total_amount: totalNum, paid_amount: paidNum, status })
          .eq('student_id', studentId);
        error = updateError;
      } else {
        // Naya record banayein
        const { error: insertError } = await supabase
          .from('fees')
          .insert([{ student_id: studentId, total_amount: totalNum, paid_amount: paidNum, status }]);
        error = insertError;
      }

      if (error) throw error;
      toast.success("Fee Updated Successfully!");
      fetchData(); // Table refresh karein

    } catch (err: any) {
      toast.error("Update Failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Student Fees</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Fee (₹)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid (₹)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => {
              // Current values nikalein (agar pehle se set hain)
              const currentFee = student.fees?.[0] || { total_amount: 0, paid_amount: 0 };
              
              return (
                <FeeRow key={student.id} student={student} currentFee={currentFee} onSave={handleUpdateFee} />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Alag Component har row ke liye taaki input handle ho sake
const FeeRow = ({ student, currentFee, onSave }: any) => {
  const [total, setTotal] = useState(currentFee.total_amount);
  const [paid, setPaid] = useState(currentFee.paid_amount);

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap font-medium">{student.full_name}</td>
      <td className="px-6 py-4 whitespace-nowrap">{student.class_name} ({student.roll_number})</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input 
          type="number" 
          value={total} 
          onChange={(e) => setTotal(e.target.value)} 
          className="w-24 border rounded p-1"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input 
          type="number" 
          value={paid} 
          onChange={(e) => setPaid(e.target.value)} 
          className="w-24 border rounded p-1"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button 
          onClick={() => onSave(student.id, total, paid)}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
        >
          Save
        </button>
        <span className={`ml-3 text-xs font-bold px-2 py-1 rounded ${
            paid >= total && total > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
            {paid >= total && total > 0 ? 'PAID' : 'PENDING'}
        </span>
      </td>
    </tr>
  );
};

export default ManageFees;
