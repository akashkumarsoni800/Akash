import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { Wallet, ChevronLeft, Send, Printer, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const StudentFees = () => {
  const navigate = useNavigate();
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => { fetchFees(); }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: student } = await supabase.from('students').select('*').eq('email', user.email).limit(1).maybeSingle();
      if (!student) return toast.error("Profile not found");
      setStudentData(student);

      const { data: feeData } = await supabase.from('fees').select('*, fee_receipts(*)').eq('student_id', student.student_id || student.id).order('created_at', { ascending: false });
      setFees(feeData || []);
      
      const pending = (feeData || []).filter(f => f.status === 'Pending').reduce((sum, f) => sum + Number(f.total_amount), 0);
      setTotalPending(pending);
    } catch (error) { toast.error("Failed to load records"); }
    finally { setLoading(false); }
  };

  const handleWhatsApp = (fee: any) => {
    const breakdown = Object.entries(fee.fee_breakdown || {})
      .filter(([_, val]) => Number(val) > 0)
      .map(([key, val]) => `• ${key.toUpperCase()}: ₹${val}`)
      .join('%0A');

    const message = `*📄 FEE RECEIPT - Adarsh Shishu Mandir*%0A%0A*Student:* ${studentData.full_name}%0A*Month:* ${fee.month}%0A%0A*BREAKDOWN:*%0A${breakdown}%0A%0A*TOTAL PAID:* ₹${fee.total_amount}%0A*STATUS:* ${fee.status}%0A%0A_Thank you for choosing ASM!_`;
    window.open(`https://wa.me/91${studentData.contact_number}?text=${message}`, '_blank');
    toast.success("Receipt shared on WhatsApp!");
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
       <RefreshCw size={40} className="animate-spin text-indigo-600 mb-4"/>
       <p className="font-black uppercase tracking-widest text-gray-400 italic">ASM Finance Syncing...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 font-sans">
      <button onClick={() => navigate(-1)} className="mb-10 flex items-center gap-2 bg-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm border border-indigo-50 hover:shadow-md transition-all">
        <ChevronLeft size={16}/> Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto space-y-10">
        {/* Outstanding Header */}
        <div className="bg-indigo-900 rounded-[3.5rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="text-center md:text-left">
                 <h1 className="text-2xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">Financial<br className="hidden md:block"/>Portfolio</h1>
                 <p className="text-indigo-300 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] mt-4 md:mt-6">Candidate: {studentData.full_name}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 text-center min-w-[200px] md:w-auto shadow-inner">
                 <p className="text-[9px] md:text-[10px] font-black uppercase text-indigo-200 mb-1 md:mb-2 tracking-widest italic">Total Pending</p>
                 <p className={`text-4xl md:text-6xl font-black tracking-tighter ${totalPending > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>₹{totalPending.toLocaleString()}</p>
              </div>
           </div>
           <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* Fee Cards List */}
        <div className="space-y-6">
           {fees.map(fee => (
             <div key={fee.id} className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden group hover:border-indigo-200 transition-all duration-500">
                <div className="flex flex-col md:flex-row">
                   <div className={`p-8 md:w-64 flex flex-col justify-center items-center text-center ${fee.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      <p className="text-[10px] font-black uppercase mb-1">{fee.month}</p>
                      <h3 className="text-3xl font-black tracking-tighter italic uppercase">{fee.status}</h3>
                      {fee.status === 'Paid' ? <CheckCircle2 size={30} className="mt-4 opacity-40"/> : <AlertCircle size={30} className="mt-4 opacity-40 animate-pulse"/>}
                   </div>
                   <div className="flex-1 p-10">
                      <div className="grid grid-cols-2 gap-6 mb-8">
                         {fee.fee_breakdown && Object.entries(fee.fee_breakdown).map(([key, val]: any) => (
                           Number(val) > 0 && (
                             <div key={key} className="flex justify-between items-center border-b border-gray-50 pb-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase">{key}</span>
                                <span className="font-black text-gray-900 italic">₹{Number(val).toLocaleString()}</span>
                             </div>
                           )
                         ))}
                      </div>
                      <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t-2 border-dashed border-gray-100 gap-6">
                         <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Net Payable</p>
                            <h4 className="text-4xl font-black text-indigo-900 tracking-tighter">₹{Number(fee.total_amount).toLocaleString()}</h4>
                         </div>
                         <div className="flex gap-3 w-full md:w-auto">
                            <button onClick={() => handleWhatsApp(fee)} className="flex-1 bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-emerald-100 hover:bg-black transition-all flex items-center justify-center gap-2">
                               <Send size={14}/> Share WhatsApp
                            </button>
                            <button onClick={() => window.print()} className="flex-1 bg-gray-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                               <Printer size={14}/> Print PDF
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           ))}
           {fees.length === 0 && (
             <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-gray-100 text-center">
                <Wallet size={80} className="mx-auto text-gray-100 mb-6"/>
                <p className="text-gray-400 font-black uppercase tracking-widest italic text-xl">Financial ledger is clean.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default StudentFees;
