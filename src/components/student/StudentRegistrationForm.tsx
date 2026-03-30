import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; 
import { 
  UserPlus, User, ShieldCheck, 
  Mail, Lock, Smartphone, 
  GraduationCap, ChevronRight, 
  ArrowRight, Info, RefreshCw,
  CheckCircle2, Compass, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import MetaData from '../shared/MetaData';

export default function StudentRegistrationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    school_code: '', // ✅ New field
    fullName: '',
    guardianName: '',
    contactNumber: '',
    classAssignment: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 0. Resolve School Code
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .ilike('school_code', formData.school_code.trim())
        .maybeSingle();

      if (schoolError || !school) {
        throw new Error("Invalid School Code! Please contact your administrator.");
      }

      const toTitleCase = (str: string) => str.replace(/\b\w/g, (char) => char.toUpperCase());
      const formattedName = toTitleCase(formData.fullName.trim());
      const formattedFather = toTitleCase(formData.guardianName.trim());
      const formattedClass = formData.classAssignment.trim().toUpperCase();

      // 1. Register User in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formattedName,
            father_name: formattedFather,
            class_name: formattedClass
          }
        }
      });

      if (authError) throw authError;

      // 2. Insert into Students Table (Status: pending)
      const { error: dbError } = await supabase
        .from('students')
        .insert([{
          full_name: formattedName,
          father_name: formattedFather,
          contact_number: formData.contactNumber,
          class_name: formattedClass,
          email: formData.email,
          is_approved: 'pending',
          roll_no: '0', 
          registration_no: `TEMP-${Date.now()}`,
          school_id: school.id // ✅ Associated with school
        }]);

      if (dbError) throw dbError;

      toast.success('Registration Submitted Successfully! 🛰️');
      navigate('/'); 

    } catch (error: any) {
      toast.error(error.message || 'Transmission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-inter selection:bg-blue-100 selection:text-blue-900">
      <MetaData title="Student Registration" description="Register as a student at your school through Adukul." />
      
      {/* --- MESH DECORATION --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/20 blur-[120px] rounded-full animate-pulse"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse decoration-700"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-full relative z-10"
      >
        <div className="bg-white rounded-[5px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden group">
           <div className="flex flex-col lg:flex-row">
              
              {/* Left Side: Illustration / Info */}
              <div className="lg:w-1/3 bg-slate-900 p-12 flex flex-col justify-between relative overflow-hidden">
                 <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,#1e40af_0%,transparent_70%)]"></div>
                 </div>
                 
                 <div className="relative z-10 space-y-8">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[5px] flex items-center justify-center text-blue-400 border border-white/10">
                       <Compass size={32} />
                    </div>
                    <div>
                       <h2 className="text-3xl font-black text-white    leading-none uppercase">
                          Scholar<br/>Induction
                       </h2>
                       <p className="text-[10px] font-black text-blue-400   mt-4">Version 4.0</p>
                    </div>
                 </div>

                 <div className="relative z-10 space-y-6">
                    <div className="flex items-start gap-4">
                       <div className="mt-1"><CheckCircle2 size={16} className="text-emerald-500" /></div>
                       <p className="text-[11px] font-black text-slate-400 leading-relaxed">Secure Student Record</p>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="mt-1"><CheckCircle2 size={16} className="text-emerald-500" /></div>
                       <p className="text-[11px] font-black text-slate-400 leading-relaxed">Encrypted Secure Credentialing</p>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="mt-1"><CheckCircle2 size={16} className="text-emerald-500" /></div>
                       <p className="text-[11px] font-black text-slate-400 leading-relaxed">Immediate Admin Sync</p>
                    </div>
                 </div>

                 <div className="relative z-10 pt-10 border-t border-white/5">
                    <p className="text-[9px] font-black text-slate-500  tracking-widest leading-relaxed">
                       Adarsh Shishu Mandir<br/>
                       Digital Admission Terminal
                    </p>
                 </div>
              </div>

              {/* Right Side: Form */}
              <div className="flex-1 p-10 md:p-14 space-y-10">
                 <div className="flex items-center justify-between">
                    <div>
                       <h3 className="text-2xl font-black text-slate-900    uppercase">Registration</h3>
                       <p className="text-[10px] font-black text-slate-400  tracking-widest mt-1">Personnel Entry Matrix</p>
                    </div>
                    <div className="text-right hidden sm:block">
                       <p className="text-[10px] font-black text-blue-600  tracking-widest leading-none">Authority Check</p>
                       <p className="text-[10px] font-black text-slate-300  tracking-widest mt-1">Scholastic Registry</p>
                    </div>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-8">
                    {/* ✅ School Identifier */}
                    <div className="bg-blue-50/50 p-6 rounded-[5px] border border-blue-100/50">
                        <InputField 
                          label="Institutional Identifier (School Code)" 
                          icon={ShieldCheck} 
                          placeholder="Ex: ASM01"
                          required
                          value={formData.school_code}
                          onChange={(e: any) => setFormData({ ...formData, school_code: e.target.value.toUpperCase() })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <InputField 
                         label="Scholar Nomenclature" 
                         icon={User} 
                         placeholder="Legal Full Name..."
                         onChange={(e: any) => setFormData({ ...formData, fullName: e.target.value })}
                         required
                       />
                       <InputField 
                         label="Father's/Guardian's Name" 
                         icon={ShieldCheck} 
                         placeholder="Guardian Name..."
                         onChange={(e: any) => setFormData({ ...formData, guardianName: e.target.value })}
                         required
                       />
                       <InputField 
                         label="Email Address" 
                         type="email" 
                         icon={Mail} 
                         placeholder="email@institution.com"
                         onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                         required
                       />
                       <InputField 
                         label="Secure Matrix (Password)" 
                         type={showPassword ? "text" : "password"} 
                         icon={Lock} 
                         placeholder="Min. 6 characters"
                         onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                         required
                         isPassword
                         showPassword={showPassword}
                         setShowPassword={setShowPassword}
                       />
                       <InputField 
                         label="Comms Frequency (Mobile)" 
                         icon={Smartphone} 
                         placeholder="10 digit identifier..."
                         onChange={(e: any) => setFormData({ ...formData, contactNumber: e.target.value })}
                         required
                       />
                       <InputField 
                         label="Assigned Batch (Class)" 
                         icon={GraduationCap} 
                         placeholder="e.g., 10th A"
                         onChange={(e: any) => setFormData({ ...formData, classAssignment: e.target.value })}
                         required
                       />
                    </div>

                    <div className="pt-6 space-y-6">
                       <button 
                         type="submit" 
                         disabled={loading}
                         className="w-full bg-slate-900 text-white py-6 rounded-[5px] font-black   text-xs shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50  group/btn"
                       >
                         {loading ? <RefreshCw className="animate-spin" size={20} /> : <><UserPlus size={20} /> Submit Registration</>}
                       </button>
                       
                       <button 
                         type="button"
                         onClick={() => navigate('/')}
                         className="w-full bg-slate-50 text-slate-400 py-6 rounded-[5px] font-black   text-[10px] hover:text-slate-900 transition-all flex items-center justify-center gap-4 active:scale-95 "
                       >
                          Already have an account? Login <ArrowRight size={14} />
                       </button>
                    </div>
                 </form>

                 <div className="bg-slate-50 p-8 rounded-[5px] border border-slate-100 flex items-start gap-4">
                    <Info size={18} className="text-blue-500 mt-1" />
                    <p className="text-[10px] font-black text-slate-400 leading-relaxed">
                       Notice: All registrations are reviewed for accuracy and security. 
                       Approval may take up to 24 institutional hours.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

const InputField = ({ label, icon: Icon, isPassword, showPassword, setShowPassword, ...props }: any) => (
  <div className="space-y-2 group">
    <label className="block text-[9px] font-black text-slate-400   ml-2 transition-colors group-focus-within:text-blue-600 ">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-blue-400 transition-colors" size={18} />}
      <input className={`w-full ${Icon ? 'pl-16' : 'px-8'} ${isPassword ? 'pr-14' : 'px-8'} py-5 bg-slate-50 border-none rounded-[5px] font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all  text-sm placeholder:text-slate-200`} {...props} />
      {isPassword && (
        <button 
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  </div>
);
