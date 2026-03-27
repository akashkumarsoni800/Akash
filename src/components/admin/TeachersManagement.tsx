import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
 UserPlus, Plus, Search, 
 Trash2, Mail, Phone, 
 ShieldCheck, Zap, ChevronRight, 
 RefreshCw, GraduationCap,
 MoreVertical, CheckCircle2,
 Lock, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function TeachersManagement({ roleFilter = 'teacher' }: { roleFilter?: string }) {
 const [teachers, setTeachers] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [formData, setFormData] = useState({
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  password: 'Teacher@123'
 });

 useEffect(() => {
  fetchTeachers();
 }, []);

 const fetchTeachers = async () => {
  setLoading(true);
  try {
   const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('role', roleFilter)
    .order('full_name');

   if (error) throw error;
   setTeachers(data || []);
  } catch (err: any) {
   toast.error("Sync Error: " + err.message);
  } finally {
   setLoading(false);
  }
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.fullName || !formData.email) return toast.error("Essential parameters missing.");

  setLoading(true);
  try {
   // 1. Initial Identity Check
   const { data: existing } = await supabase.from('students').select('full_name').eq('email', formData.email).maybeSingle();
   if (existing) throw new Error(`Identity conflict: Email registered to scholar (${existing.full_name})`);

   // 2. Auth Protocol Initialization
   const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: { data: { full_name: formData.fullName, role: 'teacher' } }
   });

   if (authError) throw authError;

   // 3. Database Indexing
   if (authData.user) {
    const { error: dbError } = await supabase.from('teachers').insert([{
     full_name: formData.fullName,
     subject: formData.subject,
     email: formData.email,
     phone: formData.phone,
     role: 'teacher'
    }]);
    if (dbError) throw dbError;
   }

   toast.success("Identity Secured: Faculty Node Initialized 💎");
   setIsModalOpen(false);
   setFormData({ fullName: '', email: '', phone: '', subject: '', password: 'Teacher@123' });
   fetchTeachers();
  } catch (err: any) {
   toast.error(err.message);
  } finally {
   setLoading(false);
  }
 };

  const resetPassword = (email: string) => {
   toast.promise(
    new Promise((resolve) => setTimeout(resolve, 1200)),
    {
     loading: 'Restoring identity hash...',
     success: () => `Temporal sync active: (Teacher@123) for ${email} ✅`,
     error: 'Protocol interruption.',
    }
   );
  };
 
  const deleteTeacher = async (id: string) => {
   if (!window.confirm("Purge faculty record? This protocol is irreversible.")) return;
   try {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) throw error;
    toast.success("Faculty Node Purged");
    fetchTeachers();
   } catch (err: any) {
    toast.error(err.message);
   }
  };
 
 return (
  <div className="space-y-8">
   
   {/* --- TOP BAR --- */}
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
     <div className="space-y-1">
      <h3 className="text-2xl font-black text-slate-900  leading-none uppercase">{roleFilter} List</h3>
      <p className="text-[10px] font-black text-slate-400 tracking-widest mt-1">Manage institutional {roleFilter} records</p>
     </div>
     {roleFilter === 'teacher' && (
      <button 
       onClick={() => setIsModalOpen(true)}
       className="premium-button-admin bg-slate-950 text-white hover:bg-emerald-600 border-none shadow-xl"
      >
       <UserPlus size={16} className="group-hover:scale-110 transition-transform" /> Add Teacher
      </button>
     )}
   </div>

   {/* --- TEACHER GRID --- */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
     <AnimatePresence mode="popLayout">
      {teachers.map((t, idx) => (
        <motion.div 
         key={t.id}
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: idx * 0.05 }}
         className="bg-white border border-slate-100 p-8 rounded-[5px] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button 
             onClick={() => resetPassword(t.email)} 
             className="p-2 bg-blue-50 text-blue-500 rounded-[5px] hover:bg-blue-600 hover:text-white transition-all shadow-sm"
             title="Reset Access Node"
            >
             <RefreshCw size={16} />
            </button>
            <button onClick={() => deleteTeacher(t.id)} className="p-2 bg-rose-50 text-rose-500 rounded-[5px] hover:bg-rose-500 hover:text-white transition-all">
             <Trash2 size={16} />
            </button>
          </div>

         <div className="space-y-6">
           <div className="w-16 h-16 bg-emerald-50 rounded-[5px] flex items-center justify-center text-emerald-600 text-2xl font-black border border-emerald-100 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
            {t.full_name?.[0]}
           </div>
           
           <div className="space-y-1">
            <h4 className="text-xl font-black text-slate-900  leading-none">{t.full_name}</h4>
            <p className="text-[10px] font-black text-emerald-600 ">{t.subject || 'Staff Member'}</p>
           </div>

           <div className="space-y-3 pt-4 border-t border-slate-50">
            <div className="flex items-center gap-3 text-slate-400">
              <Mail size={14} className="text-slate-200" />
              <p className="text-[10px] font-black tracking-tight">{t.email}</p>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <Phone size={14} className="text-slate-200" />
              <p className="text-[10px] font-black tracking-tight">{t.phone || 'No Contact'}</p>
            </div>
           </div>
         </div>
        </motion.div>
      ))}
     </AnimatePresence>

     {teachers.length === 0 && !loading && (
      <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[5px]">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
         <GraduationCap size={40} />
        </div>
        <p className="text-[10px] font-black text-slate-300  mb-2">No teacher records found</p>
        <p className="text-[9px] font-black text-slate-200 tracking-widest leading-relaxed">Add a new teacher to see them here.</p>
      </div>
     )}
   </div>

   {/* --- ADD MODAL --- */}
   <AnimatePresence>
     {isModalOpen && (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
        <motion.div 
         initial={{ scale: 0.95, y: 20 }}
         animate={{ scale: 1, y: 0 }}
         exit={{ scale: 0.95, y: 20 }}
         className="bg-white w-full max-w-2xl rounded-[5px] p-10 md:p-14 shadow-2xl border border-slate-100"
        >
         <div className="flex justify-between items-center mb-10">
           <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900  leading-none uppercase">Add Teacher</h2>
            <p className="text-[10px] font-black text-slate-400 tracking-widest mt-1">Fill in details to add staff</p>
           </div>
           <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 rounded-[5px] hover:bg-slate-100 transition-all">
            <X size={20} />
           </button>
         </div>

         <form onSubmit={handleSubmit} className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputField 
             label="Full Name" 
             icon={UserPlus} 
             placeholder="Full Name..."
             value={formData.fullName}
             onChange={(e: any) => setFormData({ ...formData, fullName: e.target.value })}
            />
            <InputField 
             label="Subject" 
             icon={GraduationCap} 
             placeholder="Primary Subject..."
             value={formData.subject}
             onChange={(e: any) => setFormData({ ...formData, subject: e.target.value })}
            />
            <InputField 
             label="Email Address" 
             type="email"
             icon={Mail} 
             placeholder="faculty@institution.com"
             value={formData.email}
             onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
            />
            <InputField 
             label="Phone Number" 
             icon={Phone} 
             placeholder="Contact identifier..."
             value={formData.phone}
             onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })}
            />
            <div className="md:col-span-2">
              <InputField 
               label="Password" 
               type="password"
               icon={Lock} 
               value={formData.password}
               onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
           </div>

           <div className="flex gap-4 pt-6">
            <button type="submit" disabled={loading} className="flex-1 premium-button-admin bg-slate-950 text-white py-3 hover:bg-emerald-600 border-none shadow-xl">
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <><ShieldCheck size={18} /> Save Teacher</>}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 bg-slate-50 text-slate-400 py-3 rounded-[5px] font-black  text-[10px] hover:bg-slate-100 hover:text-slate-600 transition-all">Cancel</button>
           </div>
         </form>
        </motion.div>
      </div>
     )}
   </AnimatePresence>

  </div>
 );
}

const InputField = ({ label, icon: Icon, ...props }: any) => (
 <div className="space-y-2 group">
  <label className="block text-[9px] font-black text-slate-400  ml-2 transition-colors group-focus-within:text-emerald-600">{label}</label>
  <div className="relative">
   {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-emerald-400 transition-colors" size={18} />}
   <input className={`w-full ${Icon ? 'pl-16' : 'px-8'} py-3 bg-slate-50 border-none rounded-[5px] font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100 focus:bg-white transition-all text-sm placeholder:text-slate-200`} {...props} />
  </div>
 </div>
);
