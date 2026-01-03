import React, { useState, useEffect } from 'react';
import { toast } from 'sonner'; 
import { supabase } from '../supabaseClient'; // ✅ Supabase Import kiya

const ManageFees = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. REAL DATA FETCHING ---
  const fetchStudents = async () => {
    try {
      setLoading(true);
      // 'students' table se data la rahe hain
      // Agar apke paas 'fees' table alag hai, to hame join lagana padega
      // Filhal hum students list la rahe hain
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;

      if (data) {
        setStudents(data);
      }
    } catch (error: any) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students list.");
    } finally {
      setLoading(false);
    }
  };

  // Page load hote hi data layega
  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSaveFee = async (studentId: string, structure: any, paid: string) => {
    console.log("Saving data for:", studentId);
    // Yahan hum Database Update ka logic baad me lagayenge
    toast.success("Save function clicked (Database logic pending)");
  };

  // --- SAFE VALUE HELPER ---
  const safeVal = (v: any) => {
    if (v === null || v === undefined) return "";
    if (typeof v === 'object') return ""; 
    return String(v);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Fee Management</h1>
        <button onClick={fetchStudents} className="text-sm text-blue-600 underline">
          Refresh List
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Student Name</th>
              <th className="px-2 py-3 text-left">Class</th>
              <th className="px-2 py-3 text-left">Tuition</th>
              <th className="px-2 py-3 text-left">Exam</th>
              <th className="px-2 py-3 text-left">Other</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Paid</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  Loading students... ⏳
                </td>
              </tr>
            ) : (
              // --- REAL DATA LOOP ---
              Array.isArray(students) && students.length > 0 ? (
                students.map((student) => {
                  if (!student) return null;
                  
                  // Filhal Fees data empty maan rahe hain, kyunki join query abhi nahi lagayi
                  // Jab aap fees table bana lenge, tab hum usse jod denge
                  const tVal = "0"; 
                  const eVal = "0";
                  const oVal = "0";
                  const pVal = "0";
                  const total = 0;
  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold">{safeVal(student?.full_name)}</td>
                      <td className="px-2 text-gray-500">{safeVal(student?.class_name)}</td>
                      
                      <td className="px-2"><input className="w-16 border p-1" placeholder="0" /></td>
                      <td className="px-2"><input className="w-16 border p-1" placeholder="0" /></td>
                      <td className="px-2"><input className="w-16 border p-1" placeholder="0" /></td>
                      
                      <td className="px-4 py-3 font-bold text-blue-700">₹{total}</td>
                      
                      <td className="px-2"><input className="w-16 border bg-green-50 p-1" placeholder="0" /></td>
                      
                      <td className="px-4 py-3">
                        <button onClick={() => handleSaveFee(student.id, {}, "0")} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-red-500">
                    No students found in Database.
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageFees;
