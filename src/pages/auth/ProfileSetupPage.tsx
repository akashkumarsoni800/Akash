import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { 
 User, Mail, Phone, MapPin, 
 ChevronLeft, Camera, ShieldCheck, 
 Zap, Info, RefreshCw, Save, 
 BookOpen, Fingerprint, Layout,
 Smartphone, UserCheck, ShieldAlert,
 Lock as LucideLock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileSetupPage = () => {
 const { id } = useParams(); 
 const location = useLocation();
 const navigate = useNavigate();

 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [uploading, setUploading] = useState(false);

 const [currentAuthEmail, setCurrentAuthEmail] = useState('');
 const [viewerRole, setViewerRole] = useState<string>('checking...'); 
 const [targetType, setTargetType] = useState<'student' | 'teacher' | null>(null);
 const [profileId, setProfileId] = useState<any>(null);

 const [formData, setFormData] = useState({
  full_name: '',
  email: '',
  phone: '',
  address: '',
  avatar_url: '',
  parent_name: '',
  subject: ''
 });

 useEffect(() => {
  const initPage = async () => {
   setLoading(true);
   try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/'); return; }

    setCurrentAuthEmail(user.email || '');

    let detectedRole = 'student'; 
    const { data: teacherData } = await supabase
     .from('teachers')
     .select('*')
     .eq('email', user.email)
     .limit(1)
     .maybeSingle();

    if (teacherData) {
     detectedRole = teacherData.role === 'admin' ? 'admin' : 'teacher';
    }
    setViewerRole(detectedRole);

    let tableToFetch = '';
    let idToFetch = id; 

    if (location.pathname.includes('/edit-teacher')) {
     tableToFetch = 'teachers'; setTargetType('teacher');
    } else if (location.pathname.includes('/edit-student')) {
     tableToFetch = 'students'; setTargetType('student');
    } else {
     if (detectedRole === 'admin' || detectedRole === 'teacher') {
      tableToFetch = 'teachers'; setTargetType('teacher'); idToFetch = user.id;
     } else {
      tableToFetch = 'students'; setTargetType('student'); idToFetch = user.id;
     }
    }

    if (tableToFetch && idToFetch) {
      let idCol = 'id';
      if (tableToFetch === 'students') {
       idCol = id ? 'student_id' : 'email';
      } else {
       idCol = id ? 'id' : 'email';
      }
      
      const targetQueryValue = (idCol === 'email' && !id) ? user.email : idToFetch;
      const { data: profile } = await supabase.from(tableToFetch).select('*').eq(idCol, targetQueryValue).limit(1).maybeSingle();
     if (profile) {
      setProfileId(tableToFetch === 'students' ? profile.student_id : profile.id);
      setFormData({
       full_name: profile.full_name || '',
       email: profile.email || '',
       phone: profile.phone || profile.contact_number || '',
       address: profile.address || '',
       avatar_url: profile.avatar_url || '',
       parent_name: profile.parent_name || '',
       subject: profile.subject || ''
      });
     }
    }
   } catch (err) { console.error(err); } finally { setLoading(false); }
  };
  initPage();
 }, [id, location.pathname, navigate]);

 const uploadAvatar = async (event: any) => {
  try {
   setUploading(true);
   const file = event.target.files[0];
   if (!file) return;
   
   const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
   const filePath = `avatars/${fileName}`;
   const { error } = await supabase.storage.from('avatars').upload(filePath, file);
   if (error) throw error;
   const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
   setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
   toast.success("Biometric capture successful!");
  } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
 };

 const handleUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);

  try {
   const { error } = await supabase.rpc('force_update_user', {
    target_id: profileId,
    new_email: formData.email,
    new_name: formData.full_name,
    new_phone: formData.phone,
    new_subject: targetType === 'teacher' ? formData.subject : '',
    new_address: formData.address,
    new_parent: formData.parent_name,
    new_avatar: formData.avatar_url,
    table_type: targetType
   });

   if (error) throw error;
   toast.success("Identity Refined: Authorization Confirmed ✅");

   const { data: { user } } = await supabase.auth.getUser();
   const isSelfEdit = user?.id === profileId;

   if (isSelfEdit && formData.email !== currentAuthEmail) {
    await supabase.auth.signOut();
    navigate('/');
   } else {
    if (viewerRole === 'admin') {
     navigate('/admin/dashboard');
    } else if (viewerRole === 'teacher') {
     navigate('/teacher/dashboard');
    } else {
     navigate('/student/dashboard');
    }
   }

  } catch (err: any) {
   toast.error(err.message);
  } finally {
   setSaving(false);
  }
 };

 if (loading) return (
   <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
    <div className="relative">
      <RefreshCw size={60} className="animate-spin text-blue-600/20"/>
      <Fingerprint size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
    </div>
    <p className="font-black  text-slate-400 text-[10px] mt-8 text-center px-10">Synchronizing Identity Protocols...</p>
   </div>
 );

 return (
  <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-10 pb-32 font-inter">
   <div className="max-w-4xl mx-auto space-y-12">
    
    {/* --- HEADER --- */}
    <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className=" text-center md:text-left">
       <h1 className="text-5xl md:text-7xl font-black text-slate-900  leading-none uppercase">
        Protocol<br/>
        <span className="text-blue-600">Initialization</span>
       </h1>
       <p className="text-slate-400 font-black text-[10px] mt-4 flex items-center justify-center md:justify-start gap-2">
        <ShieldCheck size={12} className="text-blue-500" /> Paid Identity Calibration Flow
       </p>
      </motion.div>
      
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex items-center gap-10 group hover:shadow-xl transition-all relative z-20">
       <div className="w-16 h-16 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-3xl shadow-2xl shadow-slate-200 group-hover:scale-110 transition-transform">👤</div>
       <div>
        <p className="text-[10px] font-black text-slate-400  mb-2 leading-none">Access Level</p>
        <p className="text-3xl font-black text-slate-900  leading-none">{viewerRole}</p>
       </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      
      {/* --- LEFT: BIOMETRIC & CORE --- */}
      <motion.div 
       initial={{ opacity: 0, y: 30 }}
       animate={{ opacity: 1, y: 0 }}
       className="lg:col-span-3 bg-white p-10 md:p-14 rounded-[4rem] shadow-sm border border-slate-100 space-y-12 relative overflow-hidden group"
      >
       <div className="absolute top-0 left-0 w-full h-[8px] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
       <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 blur-[100px] rounded-full -mr-40 -mt-40 transition-transform duration-[4s] group-hover:scale-110 pointer-events-none"></div>

       <div className="text-center md:text-left relative z-10 border-b border-slate-50 pb-10">
         <h2 className="text-3xl font-black text-slate-900  leading-none uppercase">{id ? `Update ${targetType} Identity` : "Identity Refinement"}</h2>
         <p className="text-[10px] font-black text-slate-400  mt-3">Sequential Data Alignment</p>
       </div>

       <form onSubmit={handleUpdate} className="space-y-12 relative z-10">
         
         {/* Biometric Capture */}
         <div className="flex justify-center md:justify-start">
          <div className="relative group/avatar w-40 h-40">
            <motion.div 
             whileHover={{ scale: 1.05 }}
             className="w-full h-full rounded-[3.5rem] bg-slate-50 border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center relative z-10 group-hover/avatar:border-blue-100 transition-all duration-500"
            >
             {uploading ? (
               <RefreshCw className="animate-spin text-blue-600" size={40} />
             ) : (
               <img src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.full_name}&background=f8fafc&color=cbd5e1&bold=true`} className="w-full h-full object-cover grayscale group-hover/avatar:grayscale-0 transition-all duration-500" />
             )}
            </motion.div>
            <label className="absolute -bottom-4 -right-4 bg-slate-950 text-white w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-all border-4 border-white shadow-2xl z-20 active:scale-95 group/cam">
             <Camera size={24} className="group-hover/cam:rotate-12 transition-transform" />
             <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>
         </div>

         <div className="grid gap-10">
          <InputField 
           label="School Nomenclature" 
           value={formData.full_name} 
           onChange={(e: any) => setFormData({...formData, full_name: e.target.value})} 
           icon={User}
           placeholder="Enter identity name..."
          />

          <InputField 
           label="Communication Node (Mail)" 
           type="email"
           value={formData.email} 
           onChange={(e: any) => setFormData({...formData, email: e.target.value})} 
           icon={Mail}
           placeholder="node@institutional.asm"
          />

          <InputField 
           label="Satellite Contact (Mobile)" 
           value={formData.phone} 
           onChange={(e: any) => setFormData({...formData, phone: e.target.value})} 
           icon={Smartphone}
           placeholder="Direct line sync..."
          />

          {targetType === 'teacher' && (
           <InputField 
            label="Specialization Domain" 
            value={formData.subject} 
            onChange={(e: any) => setFormData({...formData, subject: e.target.value})} 
            icon={BookOpen}
            placeholder="Core subject alignment..."
           />
          )}

          {targetType === 'student' && (
           <div className="grid gap-10">
             <InputField 
              label="Guardian Authority" 
              value={formData.parent_name} 
              onChange={(e: any) => setFormData({...formData, parent_name: e.target.value})} 
              icon={UserCheck}
              placeholder="Parent nomenclature..."
             />
             <InputField 
              label="Geospatial Hub (Address)" 
              value={formData.address} 
              onChange={(e: any) => setFormData({...formData, address: e.target.value})} 
              icon={MapPin}
              placeholder="Residential coordinates..."
             />
           </div>
          )}
         </div>

         <div className="pt-6 border-t border-slate-50">
          <button 
           type="submit" 
           disabled={saving || uploading} 
           className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black  text-xs shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 group/btn"
          >
           {saving ? (
             <RefreshCw className="animate-spin" size={24} />
           ) : (
             <><Save size={24} className="group-hover/btn:translate-y-[-2px] transition-transform" /> Authorize Calibration</>
           )}
          </button>
         </div>
       </form>
      </motion.div>

      {/* --- RIGHT: INSIGHTS & HELP --- */}
      <div className="lg:col-span-2 space-y-10">
       <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-950 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden group"
       >
         <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 opacity-20 blur-3xl rounded-full" />
         <h3 className="text-[10px] font-black text-blue-400  mb-12 relative z-10 text-center md:text-left uppercase">Calibration Pulse</h3>
         
         <div className="space-y-10 relative z-10">
          <div className="flex justify-between items-end border-b border-white/5 pb-8">
            <p className="text-[9px] font-black text-slate-400 tracking-widest leading-none">Sync Integrity</p>
            <p className="text-3xl font-black  text-blue-400 leading-none">100%</p>
          </div>
          <div className="flex justify-between items-end border-b border-white/5 pb-8">
            <p className="text-[9px] font-black text-slate-400 tracking-widest leading-none">Node Response</p>
            <p className="text-xl font-black  leading-none text-emerald-400">Stable</p>
          </div>
          <div className="flex justify-between items-end border-b border-white/5 pb-8">
            <p className="text-[9px] font-black text-slate-400 tracking-widest leading-none">Protocol ASM</p>
            <p className="text-xl font-black  text-indigo-400 leading-none">v3.0.4</p>
          </div>
         </div>

         <div className="mt-12 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/5">
          <p className="text-[9px] font-black text-white/30  leading-relaxed">
           Notice: Identity calibration requires absolute nomenclature accuracy for institutional indexing.
          </p>
         </div>
       </motion.div>

       <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm space-y-10"
       >
         <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shadow-inner">
            <Info size={20} />
          </div>
          <h4 className="text-lg font-black text-slate-900  ">Identity Guide</h4>
         </div>
         <ul className="space-y-6">
          <li className="flex items-start gap-5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shadow-lg shadow-blue-200 shrink-0" />
            <p className="text-[11px] font-black text-slate-500 leading-relaxed">Update nomenclature to match official identification cards.</p>
          </li>
          <li className="flex items-start gap-5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shadow-lg shadow-blue-200 shrink-0" />
            <p className="text-[11px] font-black text-slate-500 leading-relaxed">Biometric capture (photo) should feature a clear, neutral background.</p>
          </li>
          <li className="flex items-start gap-5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shadow-lg shadow-blue-200 shrink-0" />
            <p className="text-[11px] font-black text-slate-500 leading-relaxed">Mail node updates will require a terminal sign-out for re-authentication.</p>
          </li>
         </ul>
         
         <div className="pt-6 border-t border-slate-50">
           <button 
            type="button"
            onClick={() => navigate('/reset-password')}
            className="w-full flex items-center justify-center gap-3 py-4 bg-slate-50 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95 border border-slate-100 shadow-sm"
           >
            <LucideLock size={16} /> Change Password Protocol
           </button>
         </div>
        </motion.div>
      </div>
    </div>

   </div>
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

export default ProfileSetupPage;
