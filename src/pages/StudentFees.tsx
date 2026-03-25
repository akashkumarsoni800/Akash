import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  Wallet, ChevronLeft, Send, 
  Printer, CheckCircle2, AlertCircle, 
  RefreshCw, ShieldCheck, Zap, 
  Info, Star, ChevronRight, Layout, Download, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const breakdown = Object.entries(fee.fee_structure || {})
      .filter(([_, val]) => Number(val) > 0)
      .map(([key, val]) => `• ${key.toUpperCase()}: ₹${val}`)
      .join('%0A');

    const message = `*📄 FEE RECEIPT - Adarsh Shishu Mandir*%0A%0A*Student:* ${studentData.full_name}%0A*Month:* ${fee.month}%0A%0A*BREAKDOWN:*%0A${breakdown}%0A%0A*TOTAL PAID:* ₹${fee.total_amount}%0A*STATUS:* ${fee.status}%0A%0A_Thank you for choosing ASM!_`;
    window.open(`https://wa.me/91${studentData.contact_number}?text=${message}`, '_blank');
    toast.success("Receipt shared on WhatsApp!");
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
       <div className="relative">
          <RefreshCw size={60} className="animate-spin text-blue-600/20"/>
          <Wallet size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
       </div>
       <p className="font-medium   text-slate-400 text-[10px] mt-8 text-center px-10">Syncing Financial Ledger...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-10 pb-32 font-inter">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* --- BACK BUTTON --- */}
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)} 
          className="group flex items-center gap-3 bg-white px-6 py-3 rounded-2xl text-[10px] font-medium  tracking-widest text-slate-400 border border-slate-100 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Return to Dashboard
        </motion.button>

        {/* --- HEADER / OUTSTANDING --- */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-[4rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden group"
        >
           <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600 opacity-10 rounded-full blur-[80px] -mr-40 -mt-40 transition-transform duration-[4s] group-hover:scale-110" />
           
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
              <div className="text-center md:text-left space-y-6">
                 <div className="space-y-2">
                    <p className="text-[10px] font-medium text-blue-400   ">Financial Management</p>
                    <h1 className="text-5xl md:text-7xl font-medium   leading-none ">Personal<br/>Ledger</h1>
                 </div>
                 <div className="flex items-center justify-center md:justify-start gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40">
                       <User size={20} />
                    </div>
                    <div>
                       <p className="text-[8px] font-medium text-white/30  tracking-widest">Authorized Candidate</p>
                       <p className="text-sm font-medium text-white   tracking-tight">{studentData?.full_name}</p>
                    </div>
                 </div>
              </div>

              <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/10 text-center min-w-[280px] shadow-inner group/stat relative overflow-hidden">
                 <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover/stat:opacity-5 transition-opacity" />
                 <p className="text-[10px] font-medium  text-blue-300 mb-2  ">Outstanding Balance</p>
                 <p className={`text-6xl font-medium   ${totalPending > 0 ? 'text-blue-400' : 'text-emerald-400 '}`}>₹{totalPending.toLocaleString()}</p>
                 <div className="mt-4 flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${totalPending > 0 ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                    <p className="text-[8px] font-medium text-white/20  tracking-widest">Real-time Sync Active</p>
                 </div>
              </div>
           </div>
        </motion.div>

        {/* --- TRANSACTION FEED --- */}
        <div className="space-y-8">
           <div className="flex items-center gap-4 px-6">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 border border-slate-100 font-medium text-xs  shadow-sm">IV</div>
              <h3 className="text-xl font-medium text-slate-900   ">Invoiced Settlements</h3>
           </div>

           <div className="grid grid-cols-1 gap-8">
              {fees.map((fee, idx) => (
                <motion.div 
                  key={fee.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl hover:border-blue-100 transition-all duration-700"
                >
                   <div className="flex flex-col md:flex-row">
                      <div className={`p-10 md:w-72 flex flex-col justify-center items-center text-center relative overflow-hidden transition-colors duration-700 ${fee.status === 'Paid' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-slate-900 text-white'}`}>
                         <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                            <Zap size={200} className="rotate-12 translate-x-10 translate-y-10" />
                         </div>
                         <p className="text-[10px] font-medium   mb-2  relative z-10">{fee.month}</p>
                         <h3 className="text-4xl font-medium    relative z-10">{fee.status}</h3>
                         {fee.status === 'Paid' ? (
                            <CheckCircle2 size={40} className="mt-6 opacity-40 group-hover:scale-110 transition-transform relative z-10"/>
                         ) : (
                            <div className="mt-6 bg-blue-600/20 p-4 rounded-full animate-pulse relative z-10">
                               <AlertCircle size={30} className="text-blue-400"/>
                            </div>
                         )}
                      </div>

                      <div className="flex-1 p-10 md:p-14 space-y-10 group/content">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                            {fee.fee_structure && Object.entries(fee.fee_structure).map(([key, val]: any) => (
                              Number(val) > 0 && (
                                <div key={key} className="flex justify-between items-end border-b border-slate-50 pb-3 group/item">
                                   <span className="text-[10px] font-medium text-slate-300  tracking-widest group-hover/content:text-slate-400 group-hover/item:text-blue-500 transition-colors">{key}</span>
                                   <span className="font-medium text-slate-900  tracking-tight">₹{Number(val).toLocaleString()}</span>
                                </div>
                              )
                            ))}
                         </div>

                         <div className="flex flex-col lg:flex-row justify-between items-center pt-10 border-t border-slate-50 gap-10">
                            <div className="text-center lg:text-left transition-transform group-hover/content:-translate-y-1 duration-500">
                               <p className="text-[9px] font-medium text-slate-300  tracking-widest mb-1">Authenticated Aggregate</p>
                               <h4 className="text-5xl font-medium text-slate-900  ">₹{Number(fee.total_amount).toLocaleString()}</h4>
                            </div>
                            <div className="flex gap-4 w-full lg:w-auto">
                               <button 
                                 onClick={() => handleWhatsApp(fee)} 
                                 className="flex-1 lg:px-10 lg:py-5 py-4 rounded-2xl bg-white border border-emerald-100 text-emerald-600 font-medium text-[10px]  tracking-widest shadow-sm hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95 "
                               >
                                  <Send size={16}/> Share
                               </button>
                               <button 
                                 onClick={() => window.print()} 
                                 className="flex-1 lg:px-10 lg:py-5 py-4 rounded-2xl bg-slate-900 text-white font-medium text-[10px]  tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95  group/print"
                               >
                                  <Download size={16} className="group-hover/print:translate-y-1 transition-transform" /> Download PDF
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
              ))}
              
              {fees.length === 0 && (
                <div className="bg-white p-24 rounded-[4rem] border border-dashed border-slate-200 text-center space-y-8 group">
                   <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto transition-transform duration-1000 group-hover:rotate-12">
                      <Wallet size={40} className="text-slate-200"/>
                   </div>
                   <div className="space-y-2">
                      <p className="text-slate-900 font-medium   text-2xl ">Manifest Clean</p>
                      <p className="text-[10px] font-medium text-slate-300   ">No institutional billing nodes detected in current cycle.</p>
                   </div>
                </div>
              )}
           </div>
        </div>

        {/* --- FOOTER DECOR --- */}
        <div className="pt-12 text-center">
           <div className="inline-flex items-center gap-3 bg-white px-6 py-2.5 rounded-full border border-slate-100 shadow-sm opacity-50">
              <ShieldCheck size={14} className="text-blue-500" />
              <p className="text-[9px] font-medium text-slate-400  tracking-widest">Institutional Standard ASM v3.0 Authorized</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default StudentFees;
