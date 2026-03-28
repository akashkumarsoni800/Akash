import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { 
 ShieldCheck, User, Mail, Lock, 
 Loader2, AlertCircle, Info, Star, 
 ChevronRight, Layout, Zap, RefreshCw,
 UserPlus, ShieldAlert, Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TeachersManagement from '../../components/admin/TeachersManagement';


const CreateAdmin = () => {
 const [loading, setLoading] = useState(false);
 const [formData, setFormData] = useState({
  full_name: '',
  email: '',
  password: ''
 });

 const handleCreateAdmin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
   if (formData.password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
   }

   // 1.0 Identity Conflict Check
   const { data: existing } = await supabase.from('teachers').select('full_name').eq('email', formData.email).maybeSingle();
   if (existing) throw new Error(`Identity conflict: Email registered to faculty (${existing.full_name})`);

   const schoolId = localStorage.getItem('current_school_id');

   // 1. Initialize identity synchronization via Edge Function
   const { data: result, error: fnError } = await supabase.functions.invoke('create-user', {
    body: {
     email: formData.email,
     password: formData.password,
     full_name: formData.full_name,
     role: 'admin',
     school_id: schoolId,
     subject: 'Administration'
    }
   });

   if (fnError) throw fnError;
   if (result?.error) throw new Error(result.error);

   toast.success(`New Admin Paid: ${formData.full_name}`);
   toast.info("Access permissions propagated across institutional nodes.");
   
   setFormData({ full_name: '', email: '', password: '' });

  } catch (err: any) {
   console.error("Admin Creation Failed:", err);
   toast.error(err.message || "Something went wrong.");
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="min-h-screen bg-[var(--bg-main)] py-12 px-4 md:px-10 pb-32">
   <div className="max-w-full mx-auto space-y-12">
    
    {/* --- HEADER --- */}
    <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-center md:text-left">
       <h1 className="text-5xl md:text-7xl font-black text-slate-900  leading-none uppercase">
        Master<br/>
        <span className="text-blue-600"></span>
       </h1>
       <p className="text-slate-400 font-black text-[10px] mt-4 flex items-center justify-center md:justify-start gap-2">
        <ShieldCheck size={12} className="text-blue-500" /> Paid School Node Architect v4.2
       </p>
      </motion.div>
 
      <div className="flex bg-white px-8 py-5 rounded-[5px] border border-slate-100 shadow-sm items-center gap-6 group hover:shadow-2xl active:scale-95 tracking-widest transition-all">
       <div className="w-14 h-14 bg-blue-50 rounded-[5px] flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 group-hover:scale-110 transition-transform">
         <Fingerprint size={28} />
       </div>
       <div className="pr-4">
         <p className="text-[10px] font-black text-slate-400 tracking-widest mb-1 leading-none">Security Level</p>
         <p className="text-xl font-black text-slate-900 leading-none">Standard 09</p>
       </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      
      {/* --- LEFT: REGISTRATION FORM --- */}
      <motion.div 
       initial={{ opacity: 0, y: 30 }}
       animate={{ opacity: 1, y: 0 }}
       className="lg:col-span-3 premium-card p-10 md:p-14 space-y-12 relative overflow-hidden group"
      >
       <div className="absolute top-0 left-0 w-full h-[8px] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
       <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 blur-[100px] rounded-full -mr-40 -mt-40 transition-transform duration-[4s] group-hover:scale-110 pointer-events-none"></div>
 
       <div className="space-y-10 relative z-10">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-[5px] flex items-center justify-center text-blue-600 shadow-inner">
           <UserPlus size={24} />
          </div>
          <h2 className="text-3xl font-black text-slate-900  uppercase">Induction Flow</h2>
        </div>

        <div className="bg-amber-50/50 p-6 rounded-[5px] border border-amber-100 flex gap-5 items-start">
         <ShieldAlert className="text-amber-500 shrink-0 mt-1" size={24} />
         <p className="text-[11px] font-black text-amber-700 leading-relaxed">
          <span className="block font-black tracking-widest mb-1 text-amber-600">Operational Warning</span>
          Inducting a Super Admin grants unrestricted access to all institutional data nodes including financial, personnel, and scholastic records.
         </p>
        </div>

        <form onSubmit={handleCreateAdmin} className="space-y-10">
          <div className="space-y-8">
           <InputField 
            label="Architect Nomenclature *" 
            placeholder="Ex: Dinesh Prasad" 
            required 
            icon={User}
            value={formData.full_name}
            onChange={(e: any) => setFormData({...formData, full_name: e.target.value})} 
           />

           <InputField 
            label="Identity Mail Access *" 
            type="email"
            placeholder="admin@institutional.node" 
            required 
            icon={Mail}
            value={formData.email}
            onChange={(e: any) => setFormData({...formData, email: e.target.value})} 
           />

           <InputField 
            label="Cryptographic Hash (Password) *" 
            type="text"
            placeholder="Generate secure sequence..." 
            required 
            icon={Lock}
            value={formData.password}
            onChange={(e: any) => setFormData({...formData, password: e.target.value})} 
           />
          </div>

          <div className="pt-6 border-t border-slate-50">
           <button 
            type="submit"
            disabled={loading}
            className="premium-button-admin w-full bg-slate-900 text-white hover:bg-blue-600 border-none shadow-2xl"
           >
             {loading ? (
              <RefreshCw className="animate-spin" size={24} />
             ) : (
              <><ShieldCheck size={24} className="group-hover:rotate-12 transition-transform" /> Authorize Induction</>
             )}
           </button>
          </div>
        </form>
       </div>
      </motion.div>

      {/* --- RIGHT: INSIGHTS & PROTOCOL --- */}
      <div className="lg:col-span-2 space-y-10">
       <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900 rounded-[5px] p-12 text-white shadow-2xl relative overflow-hidden group"
       >
         <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 opacity-20 blur-3xl rounded-full" />
         <h3 className="text-[10px] font-black text-blue-400  mb-12 relative z-10 text-center md:text-left uppercase">Protocol Insights</h3>
         
         <div className="space-y-10 relative z-10">
          <div className="flex justify-between items-end border-b border-white/5 pb-8">
            <p className="text-[9px] font-black text-slate-400 tracking-widest leading-none">Encryption Level</p>
            <p className="text-3xl font-black text-blue-400 leading-none">AES-256</p>
          </div>
          <div className="flex justify-between items-end border-b border-white/5 pb-8">
            <p className="text-[9px] font-black text-slate-400 tracking-widest leading-none">Propagation</p>
            <p className="text-xl font-black  leading-none">Zero-Latency</p>
          </div>
          <div className="flex justify-between items-end border-b border-white/5 pb-8">
            <p className="text-[9px] font-black text-slate-400 tracking-widest leading-none">MFA Status</p>
            <p className="text-xl font-black  text-emerald-400 leading-none">Optional</p>
          </div>
         </div>

         <div className="mt-12 bg-white/5 backdrop-blur-md p-6 rounded-[5px] border border-white/5">
          <p className="text-[9px] font-black text-white/30  leading-relaxed">
            Notice: induction logs are recorded in the institutional audit vault for perpetual monitoring. Sequential authorization required.
          </p>
         </div>
       </motion.div>

       <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-[5px] border border-slate-100 p-12 shadow-sm space-y-10"
       >
         <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-[5px] flex items-center justify-center text-blue-500 shadow-inner">
            <Info size={20} />
          </div>
          <h4 className="text-lg font-black text-slate-900 ">Operational Help</h4>
         </div>
         <ul className="space-y-6">
          <li className="flex items-start gap-5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shadow-lg shadow-blue-200 shrink-0" />
            <p className="text-[11px] font-black text-slate-500 leading-relaxed">Input precise nomenclature for institutional indexing.</p>
          </li>
          <li className="flex items-start gap-5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shadow-lg shadow-blue-200 shrink-0" />
            <p className="text-[11px] font-black text-slate-500 leading-relaxed">Passwords must meet Standard complexity protocols (6+ chars).</p>
          </li>
          <li className="flex items-start gap-5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shadow-lg shadow-blue-200 shrink-0" />
            <p className="text-[11px] font-black text-slate-500 leading-relaxed">Identity mail is used for node-to-node communication.</p>
          </li>
         </ul>
       </motion.div>
      </div>

    </div>
 
     {/* --- ADMIN LIST SECTION --- */}
     <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white border border-slate-100 rounded-[5px] p-10 md:p-14 shadow-sm"
     >
      <TeachersManagement roleFilter="admin" />
     </motion.div>
 
     {/* --- FOOTER DECOR --- */}
    <div className="pt-12 text-center">
      <div className="inline-flex items-center gap-3 bg-white px-6 py-2.5 rounded-full border border-slate-100 shadow-sm opacity-50 transition-opacity hover:opacity-100 group cursor-default">
       <Zap size={14} className="text-blue-500" />
       <p className="text-[9px] font-black text-slate-400 tracking-widest transition-colors group-hover:text-blue-600">School Standard ASM v4.2 Powered by Supabase Edge</p>
      </div>
    </div>

   </div>
  </div>
 );
};

const InputField = ({ label, icon: Icon, ...props }: any) => (
 <div className="space-y-1 group">
  <label className="block text-[9px] font-black text-slate-400  ml-2 transition-colors group-focus-within:text-blue-600">{label}</label>
  <div className="relative">
   {Icon && <Icon className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-blue-400 transition-colors" size={20} />}
   <input className="premium-input text-sm placeholder:text-slate-200" style={{ paddingLeft: Icon ? '4rem' : '2rem' }} {...props} />
  </div>
 </div>
);

export default CreateAdmin;
