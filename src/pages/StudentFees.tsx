import React from 'react';
import { useNavigate } from 'react-router-dom';

const StudentFees = () => {
  const navigate = useNavigate();

  // Abhi hum dummy data dikha rahe hain.
  // Baad me isse Supabase 'fees' table se connect kar denge.
  const feeRecords = [
    { id: 1, month: 'April 2025', amount: 1500, status: 'Paid', date: '10-Apr-2025' },
    { id: 2, month: 'May 2025', amount: 1500, status: 'Paid', date: '12-May-2025' },
    { id: 3, month: 'June 2025', amount: 1500, status: 'Pending', date: '-' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button 
        onClick={() => navigate('/student/dashboard')} 
        className="mb-6 flex items-center gap-2 text-blue-600 font-bold hover:underline"
      >
        ← Back to Dashboard
      </button>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-700 mb-6">💰 Fee Status</h1>

        {/* 1. Summary Card */}
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-yellow-500 mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Total Pending Due</h2>
            <p className="text-gray-500">For Academic Year 2025-26</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-red-600">₹1,500</span>
            <button className="block mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded">
              Pay Online (Coming Soon)
            </button>
          </div>
        </div>

        {/* 2. Fee History Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 bg-gray-100 font-bold text-gray-700 border-b">
            Payment History
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-sm text-gray-500 border-b">
                <th className="p-4">Month</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {feeRecords.map((fee) => (
                <tr key={fee.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-medium">{fee.month}</td>
                  <td className="p-4">₹{fee.amount}</td>
                  <td className="p-4 text-sm text-gray-500">{fee.date}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      fee.status === 'Paid' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {fee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default StudentFees;
