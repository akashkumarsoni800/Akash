import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, UserCircle, GraduationCap, 
  ArrowRight, Lock, Mail, Globe, 
  Briefcase, CheckCircle2
} from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginData, setLoginData] = useState({
    full_name: '',
    father_name: '',
    class_name: '',
    password: '',
    email: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedRole === 'student') {
        const { data: studentRecord, error: dbError } = await supabase
          .from('students')
          .select('student_id, full_name, father_name, class_name, email, is_approved')
          .ilike('full_name', `%${loginData.full_name.trim()}%`)
          .ilike('father_name', `%${loginData.father_name.trim()}%`)
          .ilike('class_name', `%${loginData.class_name.trim()}%`)
          .limit(1)
          .maybeSingle();

        if (dbError) throw dbError;
        if (!studentRecord) {
          toast.error("Record not found! Please verify credentials.");
          setLoading(false);
          return;
        }

        if (studentRecord.is_approved !== 'approved') {
          toast.error("⏳ Account Approval Pending!");
          setLoading(false);
          return;
        }
        
        // Student static password for simple sessions
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: studentRecord.email,
            password: 'Student123'
        });
        
        if (authError) throw authError;

        setShowWelcome(true);
        setTimeout(() => navigate('/student/dashboard'), 2000);
      } 
      else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: loginData.email,
          password: loginData.password,
        });

        if (authError) throw authError;

        const { data: staffRecord } = await supabase
          .from('teachers')
          .select('role')
          .eq('email', loginData.email.trim())
          .limit(1)
          .maybeSingle();

        if (!staffRecord || staffRecord.role !== selectedRole) {
          await supabase.auth.signOut();
          throw new Error(`Unauthorized: Role mismatch.`);
        }

        setShowWelcome(true);
        setTimeout(() => navigate(`/${selectedRole === 'admin' ? 'admin' : 'teacher'}/dashboard`), 2000);
      }

    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'admin', icon: <ShieldCheck size={40} />, label: 'Administration', sub: 'Control Center', color: 'bg-blue-600' },
    { id: 'teacher', icon: <Briefcase size={40} />, label: 'Teacher', sub: 'Educator Hub', color: 'bg-emerald-600' },
    { id: 'student', icon: <GraduationCap size={40} />, label: 'Student', sub: 'Learning Portal', color: 'bg-purple-600' }
  ];

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Background Subtle Grid */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none"></div>

      <AnimatePresence mode="wait">
        {showWelcome ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-3xl text-white ${
              selectedRole === 'admin' ? 'bg-blue-600' : selectedRole === 'teacher' ? 'bg-emerald-600' : 'bg-purple-600'
            }`}>
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-5xl font-black text-slate-800 tracking-tighter uppercase mb-4">Identity<br/>Verified</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </motion.div>
        ) : !selectedRole ? (
          <motion.div 
            key="selector"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="w-full max-w-6xl"
          >
            <div className="text-center mb-16">
              <div className="w-24 h-24 bg-white shadow-xl rounded-3xl p-5 border border-slate-100 flex items-center justify-center mx-auto mb-8 hover:rotate-6 transition-transform">
                <ShieldCheck className="text-blue-600" size={48} />
              </div>
              <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] mb-4">
                School Management<br/>
                <span className="text-slate-400">System</span>
              </h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-2">
                <Globe size={14} className="text-blue-500" /> Adarsh Shishu Mandir Digital Ecosystem
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {roles.map((role) => (
                <motion.div 
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  whileHover={{ y: -10 }}
                  className={`role-card role-card-${role.id}`}
                >
                   <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white mb-4 ${role.color} shadow-lg`}>
                     {role.icon}
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{role.label}</h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{role.sub}</p>
                   </div>
                   <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mt-4 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                     <ArrowRight size={20} />
                   </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-20 text-center opacity-40">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Authorized Access Protocol v4.0</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="login"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="w-full max-w-md"
          >
             <button 
               onClick={() => setSelectedRole(null)}
               className="mb-8 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
             >
               <ArrowRight size={14} className="rotate-180" /> Change Protocol
             </button>

             <div className="premium-card p-10 bg-white border-slate-200/60 shadow-2xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-2 ${
                  selectedRole === 'admin' ? 'bg-blue-600' : selectedRole === 'teacher' ? 'bg-emerald-600' : 'bg-purple-600'
                }`}></div>
                
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">
                  {selectedRole}<br/><span className="text-slate-400">Entry</span>
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10">Verification required to proceed</p>

                <form onSubmit={handleLogin} className="space-y-6">
                  {selectedRole === 'student' ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Nomenclature</label>
                        <input type="text" placeholder="Full Student Name" required className="premium-input" 
                          onChange={e => setLoginData({...loginData, full_name: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Patrilineal Reference</label>
                        <input type="text" placeholder="Father's Name" required className="premium-input" 
                          onChange={e => setLoginData({...loginData, father_name: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Archive ID</label>
                          <input type="text" placeholder="Class (Ex: 10A)" required className="premium-input uppercase" 
                            onChange={e => setLoginData({...loginData, class_name: e.target.value})} />
                        </div>
                        <div className="flex items-end">
                           <button type="submit" disabled={loading} className="premium-button w-full text-white uppercase tracking-widest text-[10px] h-[46px] bg-purple-600">
                             {loading ? '...' : 'Unlock'}
                           </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Token</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input type="email" placeholder="staff@institution.com" required className="premium-input pl-12" 
                            onChange={e => setLoginData({...loginData, email: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Cipher</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input type={showPassword ? "text" : "password"} placeholder="••••••••" required className="premium-input pl-12" 
                            onChange={e => setLoginData({...loginData, password: e.target.value})} />
                        </div>
                      </div>
                      <button type="submit" disabled={loading} className={`premium-button w-full py-4 text-white uppercase tracking-[0.2em] font-black shadow-lg hover:shadow-xl mt-4 ${
                        selectedRole === 'admin' ? 'bg-blue-600 hover:bg-blue-700' : selectedRole === 'teacher' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'
                      }`}>
                         {loading ? 'Authenticating...' : 'Establish Link'}
                      </button>
                    </>
                  )}
                </form>

                <div className="mt-8 pt-8 border-t border-slate-50 text-center opacity-30">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Proprietary Educational System</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
