import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
 ShieldCheck, Lock, Mail, 
 ChevronLeft, ChevronRight, Activity, 
 Zap, RefreshCw, Key, Info,
 ShieldAlert, UserCheck, Smartphone,
 User, Layout, ArrowRight, Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ResetPassword = () => {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 const [step, setStep] = useState(1); // 1: Verify, 2: New Password, 3: Success

 // Verification States (For logged-out users)
 const [fullName, setFullName] = useState('');
 const [fatherName, setFatherName] = useState('');
 const [contactNumber, setContactNumber] = useState('');
 const [targetEmail, setTargetEmail] = useState('');
 const [className, setClassName] = useState('');
 const [rollNo, setRollNo] = useState('');
 const [resetRole, setResetRole] = useState<'student' | 'staff'>('student');

 // Update States
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');

 // ✅ Check if user is already logged in
 const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Immediate check
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        setStep(2);
      }
    };
    checkUser();

    // Listen for auth changes (useful if the session is still initializing)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setStep(2);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

 // 1. Verify Identity (For Students who forgot password)
 const handleVerifyIdentity = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
   let searchResult;
   if (resetRole === 'student') {
    const { data, error } = await supabase
     .from('students')
     .select('email, full_name')
     .ilike('full_name', fullName.trim())
     .ilike('father_name', fatherName.trim()) 
     .ilike('class_name', className.trim())
     .eq('roll_no', rollNo.trim());
    if (error) throw error;
    searchResult = data;
   } else {
    // Staff lookup (Teachers/Admins)
    const { data, error } = await supabase
     .from('teachers')
     .select('email, full_name')
     .ilike('full_name', fullName.trim())
     .eq('phone', contactNumber.trim()); // Teachers use 'phone' column
    if (error) throw error;
    searchResult = data;
   }
 
   if (searchResult && searchResult.length > 0) {
    const person = searchResult[0];
    if (person.email) {
     setTargetEmail(person.email);
     
     const { error: resetError } = await supabase.auth.resetPasswordForEmail(person.email, {
      redirectTo: `${window.location.origin}/reset-password`,
     });
 
     if (resetError) throw resetError;
 
     toast.success(`${resetRole.toUpperCase()} Verified: Calibration Link Dispatched 📡`);
     setStep(3);
    } else {
     toast.error("Node error: Email not indexed. Contact Admin.");
    }
   } else {
    toast.error("Identity mismatch: No records found check Name/Phone.");
   }
  } catch (err: any) {
   toast.error(err.message);
  } finally {
   setLoading(false);
  }
 };

 // 2. Direct Password Update (For Logged-in Users)
 const handleDirectUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  if (newPassword !== confirmPassword) return toast.error("Credential mismatch: Passwords do not align.");

  setLoading(true);
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
   toast.error(error.message);
  } else {
   toast.success("Identity Secured: Credential Refined ✅");
   navigate((isLoggedIn ? -1 : '/') as any);
  }
  setLoading(false);
 };

 return (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-inter selection:bg-blue-100 selection:text-blue-900">
   
   {/* --- MESH DECORATION --- */}
   <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
     <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/20 blur-[120px] rounded-full animate-pulse"></div>
     <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse decoration-700"></div>
   </div>

   <motion.div 
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full max-w-lg relative z-10"
   >
    <div className="bg-white rounded-[4rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[8px] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
      
      <div className="p-10 md:p-14 space-y-12">
       
       {/* Header */}
       <div className="text-center space-y-4">
         <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] border-4 border-white shadow-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all">
          <ShieldCheck size={36} className="text-blue-600" />
         </div>
         <h2 className="text-4xl font-black text-slate-900  leading-none uppercase">
          Credential<br/>
          <span className="text-blue-600">Restoration</span>
         </h2>
         <p className="text-[10px] font-black text-slate-400 ">Secure Synchronization Protocol</p>
       </div>

       <AnimatePresence mode="wait">
         {step === 1 && (
          <motion.form 
           key="step1"
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: 20 }}
           onSubmit={handleVerifyIdentity} 
           className="space-y-8"
          >
            <div className="flex bg-slate-50 p-2 rounded-2xl gap-2">
             {(['student', 'staff'] as const).map(r => (
              <button 
               key={r}
               type="button"
               onClick={() => setResetRole(r)}
               className={`flex-1 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all ${
                resetRole === r ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'
               }`}
              >
               {r}
              </button>
             ))}
            </div>

            <div className="grid gap-8">
             <InputField 
              label={`${resetRole === 'student' ? 'Scholar' : 'Faculty'} Full Nomenclature`} 
              value={fullName} 
              onChange={(e: any) => setFullName(e.target.value)} 
              icon={User}
              placeholder="Enter legal name..."
             />
             {resetRole === 'student' ? (
              <>
               <InputField 
                label="Guardian Name (Identity Anchor)" 
                value={fatherName} 
                onChange={(e: any) => setFatherName(e.target.value)} 
                icon={UserCheck}
                placeholder="Father/Guardian name..."
               />
               <div className="grid grid-cols-2 gap-8">
                <InputField 
                 label="Scholastic Batch (Class)" 
                 value={className} 
                 onChange={(e: any) => setClassName(e.target.value)} 
                 icon={Layout}
                 placeholder="Ex: 10A"
                />
                <InputField 
                 label="Scholastic Index (Roll No)" 
                 value={rollNo} 
                 onChange={(e: any) => setRollNo(e.target.value)} 
                 icon={Fingerprint}
                 placeholder="Ex: 24"
                />
               </div>
              </>
             ) : (
              <InputField 
               label="Registered Comms (Phone)" 
               value={contactNumber} 
               onChange={(e: any) => setContactNumber(e.target.value)} 
               icon={Smartphone}
               placeholder="10-digit number..."
              />
             )}
            </div>

            <div className="pt-6 space-y-6">
             <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black  text-xs shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 group/btn"
             >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <><ShieldAlert size={20} /> Authorize Verification</>}
             </button>
             
             <button 
              type="button"
              onClick={() => navigate('/')}
              className="w-full bg-slate-50 text-slate-400 py-6 rounded-[2rem] font-black  text-[10px] hover:text-slate-900 transition-all flex items-center justify-center gap-4 active:scale-95 "
             >
               <ChevronLeft size={16} /> Revert to 
             </button>
            </div>
          </motion.form>
         )}

         {step === 2 && (
          <motion.form 
           key="step2"
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: 20 }}
           onSubmit={handleDirectUpdate} 
           className="space-y-8"
          >
            <div className="grid gap-8">
             <InputField 
              label="New Cryptographic Key" 
              type="password"
              value={newPassword} 
              onChange={(e: any) => setNewPassword(e.target.value)} 
              icon={Lock}
              placeholder="••••••••"
             />
             <InputField 
              label="Confirm Security Table" 
              type="password"
              value={confirmPassword} 
              onChange={(e: any) => setConfirmPassword(e.target.value)} 
              icon={Key}
              placeholder="••••••••"
             />
            </div>

            <div className="pt-6">
             <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black  text-xs shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 group/btn"
             >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <><Zap size={20} /> Commit Credentials</>}
             </button>
            </div>
          </motion.form>
         )}

         {step === 3 && (
          <motion.div 
           key="step3"
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-center space-y-10 py-10"
          >
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto shadow-inner relative">
             <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
             <Mail size={40} className="text-emerald-600 relative z-10" />
            </div>
            
            <div className="space-y-4">
             <h3 className="text-2xl font-black text-slate-900  leading-none uppercase">Dispatched</h3>
             <p className="text-slate-500 font-black text-[11px] leading-relaxed max-w-xs mx-auto">
               An institutional restoration link has been transmitted to <span className="text-blue-600">{targetEmail}</span>. 
               Access the mail node to initialize re-calibration.
             </p>
            </div>

            <button 
             onClick={() => navigate('/')}
             className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black  text-xs shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 "
            >
             Return to <ArrowRight size={18} />
            </button>
          </motion.div>
         )}
       </AnimatePresence>

      </div>

      {/* Footer Alert */}
      <div className="bg-slate-50 p-10 border-t border-slate-100 flex items-center gap-6">
       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-slate-100">
         <Info size={24} />
       </div>
       <p className="text-[10px] font-black text-slate-400 leading-relaxed">
         Security Notice: All restoration attempts are logged with institutional IP coordinates for security audits.
       </p>
      </div>
    </div>
   </motion.div>
  </div>
 );
};

const InputField = ({ label, icon: Icon, ...props }: any) => (
 <div className="space-y-1 group">
  <label className="block text-[9px] font-black text-slate-400  ml-2 transition-colors group-focus-within:text-blue-600 ">{label}</label>
  <div className="relative">
   {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-blue-400 transition-colors" size={20} />}
   <input className={`w-full ${Icon ? 'pl-16' : 'px-8'} py-5 bg-slate-50 border-none rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all text-sm placeholder:text-slate-200`} {...props} />
  </div>
 </div>
);

export default ResetPassword;
