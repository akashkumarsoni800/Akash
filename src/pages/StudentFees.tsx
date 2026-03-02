import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const StudentFees = () => {
  const navigate = useNavigate();
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [receiptLoading, setReceiptLoading] = useState<{[key: string]: boolean}>({});
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User session not found. Please login again.");
        return;
      }

      const { data: student } = await supabase
        .from('students')
        .select('id, full_name, class_name, contact_number, email')
        .eq('email', user.email)
        .maybeSingle();

      if (!student) {
        toast.error("Student profile not found. Contact Admin.");
        return;
      }

      setStudentData(student);

      const { data: feeData } = await supabase
        .from('fees')
        .select(`
          *,
          fee_receipts(receipt_no, generated_at)
        `)
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      setFees(feeData || []);
      const pending = (feeData || []).filter((f: any) => f.status === 'Pending')
        .reduce((sum: number, f: any) => sum + (Number(f.total_amount) || 0), 0);
      setTotalPending(pending);
    } catch (error: any) {
      console.error("Error:", error.message);
      toast.error("Failed to load fee data.");
    } finally {
      setLoading(false);
    }
  };

  const generateWhatsAppReceipt = async (fee: any) => {
    setReceiptLoading(prev => ({...prev, [fee.id]: true}));
    
    try {
      let receiptNo = fee.fee_receipts?.receipt_no;
      if (!receiptNo) {
        const { data } = await supabase
          .from('fee_receipts')
          .insert({ fee_id: fee.id, student_id: fee.student_id })
          .select('receipt_no')
          .single();
        receiptNo = data?.receipt_no || `REC-${Date.now()}`;
        // Refresh fees to get new receipt
        await fetchFees();
      }

      const totalAmount = Number(fee.total_amount);
      const receiptDate = new Date().toLocaleDateString('en-IN');
      
      const receiptMessage = `📄 *FEE RECEIPT - Adarsh Shishu Mandir*

🔢 *Receipt No:* ${receiptNo}
📅 *Date:* ${receiptDate}

👨‍🎓 *Student:* ${studentData?.full_name} (${studentData?.class_name})
📅 *Month:* ${fee.month}
💰 *Total Amount:* ₹${totalAmount.toLocaleString()}

💵 *FEE BREAKDOWN:*
${fee.fee_breakdown && Object.entries(fee.fee_breakdown)
  .filter(([_, value]: any) => Number(value) > 0)
  .map(([key, value]: any) => `• ${key.replace(/_/g, ' ').toUpperCase()}: ₹${Number(value).toLocaleString()}`)
  .join('\n')}

═══════════════════════════════
*NET PAYABLE: ₹${totalAmount.toLocaleString()}*
═══════════════════════════════

✅ *Status:* ${fee.status}
📋 *Receipt Valid Till:* ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-IN')}

*PAYMENT METHODS:*
• UPI: schoolupi@pay
• Cash: School Office (9AM-2PM)
• Bank: [Account Details]

🙏 *Thank you for your timely payment!*
*Adarsh Shishu Mandir Team*`;

      if (studentData?.contact_number) {
        let phone = studentData.contact_number.toString().replace(/\D/g, '');
        if (phone.length === 10) phone = "91" + phone;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(receiptMessage)}`, '_blank');
      } else {
        toast.info("No WhatsApp number. Receipt copied to clipboard!");
        navigator.clipboard.writeText(receiptMessage);
      }
      
      toast.success("📱 Receipt sent/copied successfully!");
    } catch (error: any) {
      toast.error("Failed to generate receipt");
    } finally {
      setReceiptLoading(prev => ({...prev, [fee.id]: false}));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <div className="text-blue-900 font-bold text-2xl">Loading Fee Records...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <button 
        onClick={() => navigate('/student/dashboard')} 
        className="mb-8 flex items-center gap-3 text-blue-900 font-bold hover:underline text-xl transition-all duration-300 hover:scale-105"
      >
        ← Back to Dashboard
      </button>

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            💰 My Fee Records
          </h1>
          <div className="bg-white/80 backdrop-blur-xl p-10 rounded-4xl shadow-2xl border border-blue-100 max-w-md mx-auto">
            <div className={`text-5xl font-black mb-4 ${totalPending > 0 ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
              ₹{totalPending.toLocaleString()}
            </div>
            <p className="text-xl font-semibold text-gray-700 uppercase tracking-wider">
              Total Pending Dues
            </p>
          </div>
        </div>

        <div className="grid gap-8">
          {fees.length === 0 ? (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-20 rounded-4xl text-center border-4 border-dashed border-gray-300 col-span-full">
              <div className="text-8xl mb-8">📭</div>
              <h3 className="text-3xl font-bold text-gray-600 mb-4">No Fee Records Found</h3>
              <p className="text-xl text-gray-500">Fees will appear here when assigned by admin</p>
            </div>
          ) : (
            fees.map((fee: any) => (
              <div key={fee.id} className="bg-white/90 backdrop-blur-xl rounded-4xl shadow-2xl hover:shadow-3xl transition-all duration-500 border border-white/60 group hover:-translate-y-2">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8 text-white rounded-t-4xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-4xl font-black">{fee.month}</h3>
                      <p className="text-blue-100 opacity-90">{studentData?.full_name}</p>
                    </div>
                    <span className={`px-8 py-4 rounded-3xl text-2xl font-bold shadow-2xl ${
                      fee.status === 'Paid' 
                        ? 'bg-green-500/30 border-4 border-green-500/50 backdrop-blur-sm' 
                        : 'bg-red-500/30 border-4 border-red-500/50 backdrop-blur-sm animate-pulse'
                    }`}>
                      {fee.status}
                    </span>
                  </div>
                </div>
                
                {/* Fee Breakdown */}
                <div className="p-10">
                  <div className="space-y-6 mb-10">
                    {fee.fee_breakdown && Object.entries(fee.fee_breakdown).map(([key, value]: any) => (
                      Number(value) > 0 && (
                        <div key={key} className="flex justify-between items-center p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl group-hover:shadow-lg transition-all">
                          <span className="text-2xl font-bold text-gray-800 capitalize tracking-wide">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ₹{Number(value).toLocaleString()}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                  
                  {/* Total & Actions */}
                  <div className="border-t-4 border-dashed border-blue-200 pt-10">
                    <div className="flex justify-between items-center mb-10">
                      <span className="text-3xl font-bold text-gray-600 uppercase tracking-widest">Net Payable</span>
                      <span className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ₹{Number(fee.total_amount).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <button
                        onClick={() => generateWhatsAppReceipt(fee)}
                        disabled={receiptLoading[fee.id]}
                        className="group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-6 px-10 rounded-4xl font-black text-2xl uppercase tracking-wider shadow-3xl hover:shadow-4xl transition-all duration-500 flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                      >
                        {receiptLoading[fee.id] ? (
                          <>
                            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            📱 <span>Send Receipt</span>
                          </>
                        )}
                      </button>
                      
                      {fee.status === 'Pending' && (
                        <button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-6 px-10 rounded-4xl font-black text-2xl uppercase tracking-wider shadow-3xl hover:shadow-4xl transition-all duration-500 hover:scale-105">
                          💳 Pay Now
                        </button>
                      )}
                    </div>
                    
                    {fee.fee_receipts && (
                      <div className="mt-8 p-6 bg-green-50 border-2 border-green-200 rounded-3xl text-center">
                        <div className="text-2xl font-bold text-green-800 mb-2">✅ Receipt Generated</div>
                        <p className="text-lg text-green-700">Receipt No: {fee.fee_receipts.receipt_no}</p>
                      </div>
                    )}
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
