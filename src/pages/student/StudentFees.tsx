import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { 
  Wallet, ChevronLeft, Send, 
  Printer, CheckCircle2, AlertCircle, 
  RefreshCw, ShieldCheck, Zap, 
  Info, Star, ChevronRight, Layout, Download, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetStudentProfile, useGetStudentFees } from '../../hooks/useQueries';

const StudentFees = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 1. Identify User
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      } else {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  // 2. ✅ Persistent Hooks for Offline Support
  const { data: student, isLoading: profileLoading } = useGetStudentProfile(userEmail || '');
  const studentId = student?.student_id || student?.id;
  
  const { data: fees = [], isLoading: feesLoading } = useGetStudentFees(studentId);

  const isLoading = profileLoading || feesLoading;

  // 3. Compute Pending Dues
  const pending = (fees || []).filter((f: any) => f.status === 'Pending').reduce((sum: number, f: any) => sum + Number(f.total_amount), 0);

  const handleWhatsApp = (fee: any) => {
    if (!student?.contact_number) return toast.error("Contact number not found in profile");

    // ✅ Clean Phone Number
    let phone = student.contact_number.replace(/\D/g, ''); 
    if (phone.length === 10) phone = `91${phone}`;
    else if (phone.length === 12 && phone.startsWith('91')) phone = phone;
    else if (phone.length > 10 && !phone.startsWith('91')) phone = `91${phone.slice(-10)}`;

    const breakdown = Object.entries(fee.fee_structure || {})
      .filter(([_, val]) => Number(val) > 0)
      .map(([key, val]) => {
        // Try to find the head name (key might be an ID or a name depending on legacy)
        return `• ${key.toUpperCase()}: ₹${val}`;
      })
      .join('%0A');

    const schoolName = localStorage.getItem('current_school_name') || 'Adarsh Shishu Mandir';
    const message = `*📄 FEE RECEIPT - ${schoolName.toUpperCase()}*%0A%0A*Student:* ${student?.full_name}%0A*Month:* ${fee.month}%0A%0A*BREAKDOWN:*%0A${breakdown}%0A%0A*TOTAL PAID:* ₹${fee.total_amount}%0A*STATUS:* ${fee.status}%0A%0A_Thank you for your payment!_%0A_ASM Management_`;
    
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    toast.success("Receipt shared on WhatsApp!");
  };

  if (isLoading && !student) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <div className="relative">
        <RefreshCw size={60} className="animate-spin text-blue-600/20"/>
        <Wallet size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
      </div>
      <p className="font-black  text-slate-400 text-[10px] mt-8 text-center px-10 uppercase">Loading Fees...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-10 pb-32 font-inter">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* --- NAVIGATION --- */}
        <div className="flex justify-between items-center">
          <motion.button 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)} 
            className="group flex items-center gap-3 bg-white px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest text-slate-400 border border-slate-100 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95 uppercase"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
          </motion.button>

          <div className="hidden md:flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <ShieldCheck size={14} className="text-emerald-500" />
            <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Verified Student Portal</p>
          </div>
        </div>

        {/* --- HEADER BLOCK --- */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 opacity-20 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
            <div className="relative z-10 space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Financial Overview</p>
                <h1 className="text-5xl md:text-7xl font-black leading-none uppercase tracking-tighter">Your<br/>Fees</h1>
              </div>
              
              <div className="flex flex-wrap gap-12 pt-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Student Name</p>
                  <p className="text-sm font-black uppercase text-white">{student?.full_name}</p>
                </div>
                <div className="space-y-1 border-l border-white/10 pl-12">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Class / Sec</p>
                  <p className="text-sm font-black uppercase text-white">{student?.class_name || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-12 flex flex-col justify-center items-center text-center border border-slate-100 shadow-xl group hover:border-blue-100 transition-all">
            <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Total Outstanding</p>
            <p className={`text-6xl font-black uppercase tracking-tighter transition-colors ${pending > 0 ? 'text-blue-600' : 'text-emerald-500'}`}>
              ₹{pending.toLocaleString()}
            </p>
            <div className="mt-6 flex items-center gap-3 px-6 py-2 bg-slate-50 rounded-full">
              <div className={`w-2 h-2 rounded-full ${pending > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                {pending > 0 ? 'Payment Required' : 'All Dues Clear'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* --- TIMELINE SECTION --- */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 border border-slate-100 font-black text-xs shadow-sm shadow-slate-100">
                <Layout size={20} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Fee Timeline</h3>
            </div>
            
            <div className="flex items-center gap-2">
               <span className="w-3 h-3 bg-blue-100 rounded-full"></span>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Paid</span>
               <span className="w-3 h-3 bg-slate-900 rounded-full ml-4"></span>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {fees.map((fee: any, idx: number) => (
              <motion.div 
                key={fee.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden group hover:shadow-2xl hover:border-blue-100 transition-all"
              >
                <div className="flex flex-col md:flex-row">
                  <div className={`p-10 md:w-64 flex flex-col justify-center items-center text-center relative transition-colors duration-500 ${fee.status === 'Paid' ? 'bg-blue-50 text-blue-600' : 'bg-slate-900 text-white'}`}>
                    <p className="text-[10px] font-black mb-1 uppercase tracking-widest opacity-60">{fee.month}</p>
                    <h3 className="text-3xl font-black uppercase tracking-tighter">{fee.status}</h3>
                    <div className="mt-4 p-3 rounded-full bg-white/10">
                      {fee.status === 'Paid' ? <CheckCircle2 size={24}/> : <AlertCircle size={24} className="text-amber-500"/>}
                    </div>
                  </div>

                  <div className="flex-1 p-10 md:p-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                      {fee.fee_structure && Object.entries(fee.fee_structure).map(([key, val]: any) => (
                        Number(val) > 0 && (
                          <div key={key} className="space-y-1">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">{key}</p>
                            <p className="text-lg font-black text-slate-900 tracking-tight">₹{Number(val).toLocaleString()}</p>
                          </div>
                        )
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-slate-50 gap-6">
                      <div>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1 text-center sm:text-left">Settlement Amount</p>
                        <h4 className="text-4xl font-black text-slate-900 tracking-tight uppercase">₹{Number(fee.total_amount).toLocaleString()}</h4>
                      </div>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <button 
                          onClick={() => handleWhatsApp(fee)} 
                          className="flex-1 sm:px-8 py-4 rounded-xl bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-emerald-100 shadow-sm shadow-emerald-50 active:scale-95"
                        >
                          <Send size={14}/> Share Receipt
                        </button>
                        <button 
                          onClick={() => window.print()}
                          className="flex-1 sm:px-8 py-4 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95"
                        >
                          <Printer size={14}/> Print
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {fees.length === 0 && (
              <div className="bg-white p-24 rounded-[3rem] border-2 border-dashed border-slate-100 text-center space-y-6">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                  <Wallet size={32} />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-black text-slate-900 uppercase">Archive Empty</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No fee records found in your account.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- FOOTER FEEDBACK --- */}
        <div className="pt-20 text-center space-y-6 opacity-30 group cursor-default">
           <div className="w-px h-12 bg-slate-200 mx-auto group-hover:bg-blue-300 transition-colors"></div>
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] group-hover:text-blue-500 transition-colors">ASM Secured Transaction Engine</p>
        </div>

      </div>
    </div>
  );
};

export default StudentFees;
