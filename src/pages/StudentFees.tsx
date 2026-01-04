import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const StudentFees = () => {
  const navigate = useNavigate();
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: student } = await supabase.from('students').select('id').eq('contact_number', user.phone).maybeSingle();

        if (student) {
          const { data: feeData } = await supabase
            .from('fees')
            .select('*')
            .eq('student_id', student.id)
            .order('id', { ascending: false });

          if (feeData) {
            setFees(feeData);
            const pending = feeData
              .filter(f => f.status === 'Pending')
              .reduce((sum, f) => sum + (f.total_amount || 0), 0);
            setTotalPending(pending);
          }
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchFees();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button onClick={() => navigate('/student/dashboard')} className="mb-4 text-blue-600 font-bold">← Back</button>
      <h1 className="text-2xl font-bold text-yellow-700 mb-6">My Fee Details</h1>

      <div className="bg-white p-6 rounded shadow border-l-4 border-red-500 mb-6 flex justify-between">
        <h2 className="font-bold">Total Pending Dues</h2>
        <span className="text-2xl font-bold text-red-600">₹{totalPending}</span>
      </div>

      <div className="space-y-4">
        {loading ? <p>Loading...</p> : fees.map((fee) => (
          <div key={fee.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex justify-between border-b pb-2 mb-2">
              <h3 className="font-bold text-blue-900">{fee.month}</h3>
              <span className={`px-2 py-1 text-xs font-bold rounded ${fee.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{fee.status}</span>
            </div>

            {/* 🔥 DYNAMIC BREAKDOWN DISPLAY */}
            <div className="text-sm text-gray-600 space-y-1">
              {/* Check karte hain ki fee_breakdown exist karta hai ya nahi */}
              {fee.fee_breakdown && Object.entries(fee.fee_breakdown).map(([key, value]: any) => (
                Number(value) > 0 && (
                  <div key={key} className="flex justify-between">
                    <span>{key}</span>
                    <span className="font-medium text-gray-900">₹{value}</span>
                  </div>
                )
              ))}
            </div>

            <div className="border-t mt-3 pt-2 flex justify-between font-bold text-gray-800">
              <span>Total</span>
              <span>₹{fee.total_amount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default StudentFees;
