import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  UserPlus, GraduationCap, Mail, 
  Phone, ShieldCheck, Zap, 
  ChevronRight, Layout, Info, Star, ChevronLeft, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AddTeacher = () => {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      // 0. Check if email already exists in Students table
      const { data: existingStudent } = await supabase
        .from('students')
        .select('full_name')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingStudent) {
        throw new Error(`This email is already registered as a student (${existingStudent.full_name}).`);
      }

      // 1. Create Auth User
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: 'Teacher@123',
        options: {
          data: {
            full_name: formData.name,
            role: 'teacher',
          },
        },
      });

      if (authError) throw authError;

      // 2. Insert into Teachers Table
      if (data.user) {
        const { error: dbError } = await supabase.from('teachers').insert([{
          full_name: formData.name,
          subject: formData.subject,
          email: formData.email,
          phone: formData.phone,
          auth_id: data.user.id,
          role: 'teacher'
        }]);
        
        if (dbError) throw dbError;
      }

      toast.success("Teacher Created Successfully!");
      navigate('/admin/dashboard');

    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] py-12 px-4 md:px-10 pb-32 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        
        {/* --- HEADER --- */}
        <div className="mb-12 text-center space-y-4">
           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900   leading-none uppercase">
                Faculty<br/>
                <span className="text-[var(--accent-admin)]">Induction</span>
              </h1>
              <p className="text-slate-400 font-black  text-[10px]  mt-4 flex items-center justify-center gap-2">
                <ShieldCheck size={12} className="text-[var(--accent-admin)]" /> Paid Academic Staff Records System v4.2
              </p>
           </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="premium-card p-10 md:p-14 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[8px] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
          
          <div className="flex items-center gap-6 border-b border-slate-50 pb-8 mb-10">
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                <UserPlus size={24} />
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900   uppercase">Credential Entry</h2>
                <p className="text-[9px] font-black text-slate-300  tracking-widest leading-none">ASM REGISTRY INDEX: STAFF_NEW</p>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
               <InputField 
                 label="Official Full Name *" 
                 name="name" 
                 placeholder="Ex: Rajesh Kumar" 
                 value={formData.name}
                 onChange={(e: any) => setFormData({...formData, name: e.target.value})} 
                 required 
                 icon={GraduationCap}
               />

               <InputField 
                 label="Primary Discipline / Role *" 
                 name="subject" 
                 placeholder="Ex: Advanced Mathematics" 
                 value={formData.subject}
                 onChange={(e: any) => setFormData({...formData, subject: e.target.value})} 
                 required 
                 icon={Layout}
               />

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InputField 
                    label="Paid Email Node *" 
                    name="email" 
                    type="email" 
                    placeholder="teacher@asm-portal.com" 
                    value={formData.email}
                    onChange={(e: any) => setFormData({...formData, email: e.target.value})} 
                    required 
                    icon={Mail}
                  />

                  <InputField 
                    label="Uplink Mobile Node *" 
                    name="phone" 
                    placeholder="+91 XXXX-XXXXXX" 
                    value={formData.phone}
                    onChange={(e: any) => setFormData({...formData, phone: e.target.value})} 
                    required 
                    icon={Phone}
                  />
               </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-2xl rounded-full" />
               <div className="flex items-center gap-3 relative z-10">
                  <Info size={16} className="text-blue-500" />
                  <p className="text-[10px] font-black text-slate-400  tracking-widest leading-none">Security Protocol Note</p>
               </div>
               <p className="text-[11px] font-black text-slate-500 leading-relaxed relative z-10">
                  Upon synchronization, a secure authentication node will be established. The default access token will be initialized as: <span className="text-blue-600 font-black notranslate">Teacher@123</span>. Instruct member to update credentials post-induction.
               </p>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
               <button 
                 type="submit"
                 disabled={isPending}
                 className="premium-button-admin flex-1"
               >
                 {isPending ? (
                    <RefreshCw className="animate-spin" size={20} />
                 ) : (
                    <><Zap size={20} className="group-hover:translate-y-[-2px] transition-transform" /> Synchronize Staff Records</>
                 )}
               </button>
               
               <button 
                 type="button"
                 onClick={() => navigate('/admin/dashboard')}
                 className="px-10 py-6 rounded-[2rem] font-black   text-[10px] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
               >
                 Abort Induction
               </button>
            </div>
          </form>
        </motion.div>

        {/* --- FOOTER DECOR --- */}
        <div className="mt-12 text-center group cursor-default">
           <div className="inline-flex items-center gap-3 bg-white px-6 py-2.5 rounded-full border border-slate-100 shadow-sm transition-all group-hover:scale-105">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <p className="text-[9px] font-black text-slate-400  tracking-widest">School Standard ASM v4.2 Paid</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, icon: Icon, ...props }: any) => (
  <div className="space-y-1 group">
    <label className="block text-[9px] font-black text-slate-400   ml-2 transition-colors group-focus-within:text-blue-500">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-400 transition-colors" size={18} />}
      <input className="premium-input pl-16" {...props} />
    </div>
  </div>
);

export default AddTeacher;
