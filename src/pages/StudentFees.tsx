import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const StudentFees = () => {
  const navigate = useNavigate();
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        setLoading(true);
        // 1. Get current logged in user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("User session not found. Please login again.");
          return;
        }

        // 2. Fetch student ID using email (Email is more reliable than phone)
        const { data: student, error: stdError } = await supabase
          .from('students')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (stdError) throw stdError;

        if (student) {
          // 3. Fetch fees for this specific student ID
          const { data: feeData, error: feeError } = await supabase
            .from('fees')
            .select('*')
            .eq('student_id', student.id)
            .order('id', { ascending: false });

          if (feeError) throw feeError;

          if (feeData) {
            setFees(feeData);
            // Calculate total pending amount
            const pending = feeData
              .filter(f => f.status === 'Pending')
              .reduce((sum, f) => sum + (Number(f.total_amount) || 0), 0);
            setTotalPending(pending);
          }
        } else {
          toast.error("Student profile not found. Contact Admin.");
        }
      } catch (error: any) { 
        console.error("Error:", error.message);
        toast.error("Failed to load fee data.");
      } finally { 
        setLoading(false); 
      }
    };
    fetchFees();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-blue-900 font-bold animate-pulse text-xl">Loading Fee Records...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/student/dashboard')} 
        className="mb-6 flex items-center gap-2 text-blue-900 font-bold hover:underline"
      >
        ← Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">My Fee Records</h1>

        {/* Total Dues Summary Card */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border-l-8 border-red-500 mb-8 flex justify-between items-center">
          <div>
            <p className="text-gray-500 font-bold uppercase text-xs">Total Pending Dues</p>
            <h2 className="text-3xl font-black text-gray-800">₹{totalPending}</h2>
          </div>
          <div className="text-4xl">💰</div>
        </div>

        {/* Fee List */}
        <div className="space-y-6">
          {fees.length === 0 ? (
            <div className="bg-white p-10 rounded-xl text-center border border-dashed border-gray-300">
              <p className="text-gray-400">No fee records found for your account.</p>
            </div>
          ) : (
            fees.map((fee) => (
              <div key={fee.id} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b">
                  <h3 className="font-black text-lg text-blue-900">{fee.month}</h3>
                  <span className={`px-4 py-1 rounded-full text-xs font-black uppercase ${
                    fee.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'
                  }`}>
                    {fee.status}
                  </span>
                </div>

                <div className="p-6">
                  {/* Dynamic Breakdown Display */}
                  <div className="space-y-3">
                    {fee.fee_breakdown && Object.entries(fee.fee_breakdown).map(([key, value]: any) => (
                      Number(value) > 0 && (
                        <div key={key} className="flex justify-between text-sm text-gray-600">
                          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-gray-900">₹{value}</span>
                        </div>
                      )
                    ))}
                  </div>

                  <div className="border-t mt-4 pt-4 flex justify-between items-center">
                    <span className="font-bold text-gray-400 text-sm uppercase">Net Payable</span>
                    <span className="text-2xl font-black text-blue-900">₹{fee.total_amount}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentFees;
