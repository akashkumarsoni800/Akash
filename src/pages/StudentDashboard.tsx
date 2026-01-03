import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut, User, GraduationCap } from 'lucide-react';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('students')
            .select(`
              *,
              fees ( total_amount, paid_amount, status, fee_structure )
            `)
            .eq('auth_id', user.id)
            .single();
          
          if (data) setStudent(data);
        }
      } catch (e) {
        console.error("Error loading profile", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("adarsh_school_login");
    navigate('/login');
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Profile...</div>;

  // Safe variables create karein taaki crash na ho
  const feeRecord = student?.fees?.[0];
  const structure = feeRecord?.fee_structure || {}; 
  // Agar structure null hai to empty object {} use karega

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-blue-900">Student Portal</h1>
          <p className="text-sm text-gray-500">Adarsh Shishu Mandir</p>
        </div>
        <button onClick={handleLogout} className="text-red-500 flex items-center gap-2 text-sm font-semibold">
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Profile Card */}
      {student ? (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{student.full_name}</h2>
              <p className="opacity-90">Class: {student.class_name} | Roll No: {student.roll_number}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-red-500">Student Profile Not Found</div>
      )}

      {/* Fee Receipt Card (CRASH PROOF VERSION) */}
      {feeRecord ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mt-6 overflow-hidden">
          <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <h3 className="text-lg font-bold">📜 Fee Breakdown</h3>
            <span className={`px-3 py-1 rounded text-xs font-bold ${
              feeRecord.status === 'Paid' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {feeRecord.status?.toUpperCase() || 'PENDING'}
            </span>
          </div>

          <div className="p-6">
            <table className="w-full text-left border-collapse mb-6">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-2 text-gray-500 uppercase text-xs">Description</th>
                  <th className="py-2 text-right text-gray-500 uppercase text-xs">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b">
                  <td className="py-3">Tuition Fee</td>
                  <td className="py-3 text-right font-medium">{structure.tuition || 0}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Exam Fee</td>
                  <td className="py-3 text-right font-medium">{structure.exam || 0}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Van / Transport</td>
                  <td className="py-3 text-right font-medium">{structure.van || 0}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Other Charges</td>
                  <td className="py-3 text-right font-medium">{structure.other || 0}</td>
                </tr>
                <tr className="bg-gray-50 font-bold text-lg">
                  <td className="py-3 pl-2">Total Payable</td>
                  <td className="py-3 text-right pr-2 text-blue-900">₹{feeRecord.total_amount || 0}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Paid Amount</p>
                <p className="text-xl font-bold text-green-600">₹{feeRecord.paid_amount || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Remaining Dues</p>
                <p className="text-xl font-bold text-red-600">
                  ₹{(feeRecord.total_amount || 0) - (feeRecord.paid_amount || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 mt-6 text-center text-yellow-800">
          Fees details not updated yet by Admin.
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
