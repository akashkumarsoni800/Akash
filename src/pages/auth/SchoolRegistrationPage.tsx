import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { 
  Building2, User, Mail, 
  Lock, Smartphone, ShieldCheck, 
  ArrowRight, RefreshCw, Sparkles,
  Info, Eye, EyeOff, Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SchoolRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ name: string; code: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    schoolName: '',
    schoolCode: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    password: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Check if School Code is already taken
      const { data: existingSchool } = await supabase
        .from('schools')
        .select('id')
        .ilike('school_code', formData.schoolCode.trim())
        .maybeSingle();

      if (existingSchool) {
        throw new Error("School Code already exists! Please choose another (Ex: SCHOOL02).");
      }

      // 1.5 Upload Logo if present
      let logoUrl = null;
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${formData.schoolCode}-${Math.random()}.${fileExt}`;
        const filePath = `school-logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(filePath);
        
        logoUrl = publicUrl;
      }

      // 2. Register School
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert([{
          name: formData.schoolName,
          school_code: formData.schoolCode.toUpperCase().trim(),
          logo_url: logoUrl
        }])
        .select()
        .single();

      if (schoolError) throw schoolError;

      // 3. Register Admin User in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.adminEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.adminName,
            role: 'admin',
          }
        }
      });

      if (authError) throw authError;

      // 4. Insert into Teachers/Staff Table
      if (authData.user) {
        const { error: dbError } = await supabase.from('teachers').insert([{
          full_name: formData.adminName,
          email: formData.adminEmail,
          phone: formData.adminPhone,
          role: 'admin',
          school_id: school.id,
          subject: 'Administration'
        }]);

        if (dbError) throw dbError;
      }

      setSuccessData({ name: school.name, code: school.school_code });
      toast.success("Institution Onboarded Successfully! 🏫");

    } catch (error: any) {
      toast.error(error.message || "Onboarding failed");
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-inter">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full text-center space-y-10"
        >
          <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20">
            <Sparkles size={48} className="text-white" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">Welcome to the Network</h1>
            <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Your institution is now digitally synchronized</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] space-y-8 backdrop-blur-xl">
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Institutional Name</p>
              <h2 className="text-2xl font-black tracking-tight">{successData.name}</h2>
            </div>
            
            <div className="pt-8 border-t border-white/10">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Unique School Code</p>
              <div className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl">
                {successData.code}
              </div>
              <p className="text-xs font-bold text-slate-500 mt-6 max-w-xs mx-auto">
                Share this code with your students and teachers to allow them to join your school.
              </p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 hover:bg-white hover:text-slate-950 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-4 group"
          >
            Enter Management Console <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-inter selection:bg-blue-100">
      
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100 blur-[120px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl relative z-10"
      >
        <div className="bg-white rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            
            {/* Left: Branding */}
            <div className="lg:w-2/5 bg-slate-950 p-12 md:p-16 flex flex-col justify-between text-white relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
              
              <div className="relative z-10 space-y-10">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 border border-white/10">
                  <Building2 size={32} />
                </div>
                <div>
                  <h2 className="text-4xl font-black leading-none uppercase italic">Register<br/>Institution</h2>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-4 italic">Corporate Onboarding v4.0</p>
                </div>
              </div>

              <div className="relative z-10 pt-16 border-t border-white/5 space-y-6">
                <FeatureItem text="Unlimited Student Nodes" />
                <FeatureItem text="Encrypted Staff Isolation" />
                <FeatureItem text="Global Academic Standards" />
              </div>
            </div>

            {/* Right: Form */}
            <div className="flex-1 p-10 md:p-16 space-y-12">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase">School Profiling</h3>
                  <p className="text-[10px] font-black text-slate-400 tracking-widest mt-1">Institutional Master Registry</p>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-black text-blue-600 tracking-widest leading-none">Status: Ready</p>
                  <p className="text-[10px] font-black text-slate-300 tracking-widest mt-1 uppercase">Cloud Archive</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-10 md:col-span-2">
                    <InputField 
                      label="Institutional Legal Name" 
                      placeholder="Ex: St. Mary's Global Academy"
                      icon={Building2}
                      required
                      value={formData.schoolName}
                      onChange={(e: any) => setFormData({...formData, schoolName: e.target.value})}
                    />
                    <InputField 
                      label="Desired School Code (Unique Identifier)" 
                      placeholder="Ex: MARY01"
                      icon={ShieldCheck}
                      required
                      value={formData.schoolCode}
                      onChange={(e: any) => setFormData({...formData, schoolCode: e.target.value.toUpperCase()})}
                    />
                    {/* Logo Upload Section */}
                    <div className="space-y-4">
                      <label className="block text-[9px] font-black text-slate-400 ml-2 uppercase tracking-widest">School Identity (Logo)</label>
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-[1.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group hover:border-blue-400 transition-all">
                          {logoPreview ? (
                            <img src={logoPreview} className="w-full h-full object-cover" alt="Preview" />
                          ) : (
                            <Image size={24} className="text-slate-300 group-hover:scale-110 transition-transform" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input 
                            type="file" 
                            id="logo-upload" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleLogoChange}
                          />
                          <label 
                            htmlFor="logo-upload" 
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all cursor-pointer"
                          >
                            Choose Image
                          </label>
                          <p className="text-[8px] font-black text-slate-300 uppercase">Recommended: Square PNG with transparent background</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-6 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Administrative Head (First Admin)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <InputField 
                        label="Full Name" 
                        placeholder="Principal / Owner Name"
                        icon={User}
                        required
                        value={formData.adminName}
                        onChange={(e: any) => setFormData({...formData, adminName: e.target.value})}
                      />
                      <InputField 
                        label="Registered Email" 
                        type="email"
                        placeholder="admin@school.com"
                        icon={Mail}
                        required
                        value={formData.adminEmail}
                        onChange={(e: any) => setFormData({...formData, adminEmail: e.target.value})}
                      />
                      <InputField 
                        label="Contact Number" 
                        placeholder="+91 XXXX-XXXXXX"
                        icon={Smartphone}
                        required
                        value={formData.adminPhone}
                        onChange={(e: any) => setFormData({...formData, adminPhone: e.target.value})}
                      />
                      <InputField 
                        label="Secure Password" 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        icon={Lock}
                        required
                        value={formData.password}
                        onChange={(e: any) => setFormData({...formData, password: e.target.value})}
                        isPassword
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 space-y-6">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : <><Sparkles size={20} /> Initialize Institution</>}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => navigate('/')}
                    className="w-full bg-slate-50 text-slate-400 py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all"
                  >
                    Cancel Onboarding
                  </button>
                </div>
              </form>

              <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100/50 flex items-start gap-4">
                <Info size={18} className="text-blue-500 mt-1" />
                <p className="text-[10px] font-black text-slate-500 leading-relaxed uppercase tracking-wider">
                  Important: This process will create a master administrative account. Keep your School Code secure but shareable with your team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:scale-150 transition-transform"></div>
    <p className="text-[11px] font-black text-slate-400 group-hover:text-white transition-colors uppercase tracking-widest">{text}</p>
  </div>
);

const InputField = ({ label, icon: Icon, isPassword, showPassword, setShowPassword, ...props }: any) => (
  <div className="space-y-2 group">
    <label className="block text-[9px] font-black text-slate-400 ml-2 uppercase tracking-widest transition-colors group-focus-within:text-blue-600">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-400 transition-colors" size={18} />}
      <input className={`w-full ${Icon ? 'pl-16' : 'px-8'} ${isPassword ? 'pr-14' : 'px-8'} py-5 bg-slate-50 border-none rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all text-sm placeholder:text-slate-200`} {...props} />
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
