import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck, Zap, 
  Users, GraduationCap, BarChart3, 
  Globe, Layout, Star, BookOpen,
  ChevronRight, ArrowUpRight, Smartphone,
  Layers, Lock, Database
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden font-inter selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* --- MESH GRADIENT OVERLAY --- */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 blur-[120px] rounded-full animate-pulse decoration-700"></div>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-100/50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
               <Layers size={24} />
            </div>
            <div className="">
               <span className="text-xl font-black tracking-tighter text-slate-900 uppercase leading-none block">ASM <span className="text-indigo-600">COMMAND</span></span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none">Institutional OS v3.0</span>
            </div>
          </motion.div>

          <div className="hidden lg:flex items-center gap-12">
             <NavLink label="Academic Logic" />
             <NavLink label="Infrastructure" />
             <NavLink label="Security" />
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
             <button 
               onClick={() => navigate('/login')}
               className="hidden sm:flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors  italic"
             >
                Node Auth <ChevronRight size={14} />
             </button>
             <button 
               onClick={() => navigate('/login')}
               className="bg-slate-950 text-white px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95  italic"
             >
               Initialize Terminal
             </button>
          </motion.div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
           
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="space-y-10 text-center lg:text-left relative z-10"
           >
              <div className="inline-flex items-center gap-3 bg-white px-5 py-2.5 rounded-full border border-slate-100 shadow-sm">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]  italic italic leading-none">Next-Gen Educational Framework</span>
              </div>

              <h1 className="text-6xl md:text-8xl font-black text-slate-950 leading-[0.9] tracking-tighter uppercase  italic">
                Empowering <br/><span className="text-indigo-600 font-black">Digital</span> Minds.
              </h1>

              <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                A high-fidelity institutional management ecosystem synchronized for teachers, administrators, and students.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-6">
                 <button 
                   onClick={() => navigate('/login')}
                   className="w-full sm:w-auto px-10 py-6 bg-indigo-600 text-white font-black rounded-3xl shadow-[0_25px_50px_-12px_rgba(79,70,229,0.4)] hover:bg-slate-950 transition-all active:scale-95 flex items-center justify-center gap-4 text-xs uppercase tracking-[0.2em]  italic group relative overflow-hidden"
                 >
                    <span className="relative z-10">Access Dashboard</span>
                    <ArrowUpRight size={20} className="relative z-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                 </button>
                 
                 <button 
                   onClick={() => navigate('/login')}
                   className="w-full sm:w-auto px-10 py-6 bg-white text-slate-900 font-black rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all flex items-center justify-center gap-4 text-xs uppercase tracking-[0.2em]  italic active:scale-95"
                 >
                    <Smartphone size={20} className="text-indigo-500" />
                    Student Portal
                 </button>
              </div>

              <div className="pt-12 flex flex-wrap justify-center lg:justify-start items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                 <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><ShieldCheck size={16} /> Secure Ledger</div>
                 <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><Zap size={16} /> Neural Sync</div>
                 <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><Database size={16} /> Cloud Vault</div>
              </div>
           </motion.div>

           {/* --- HERO VISUAL --- */}
           <motion.div 
             initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
             animate={{ opacity: 1, scale: 1, rotate: 0 }}
             transition={{ delay: 0.4 }}
             className="relative z-10 hidden lg:block"
           >
              <div className="relative">
                 {/* Main Visual */}
                 <div className="w-[500px] h-[500px] bg-slate-200/20 backdrop-blur-3xl rounded-[5rem] border-[10px] border-white/50 shadow-2xl flex items-center justify-center overflow-hidden group">
                    <img src="/logo.png" className="w-[300px] h-auto object-contain opacity-20 filter drop-shadow-2xl group-hover:scale-110 group-hover:opacity-40 transition-all duration-[2s]" alt="Logo"/>
                    
                    {/* Floating Pulse */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-blue-500/10 group-hover:opacity-100 opacity-0 transition-opacity duration-[2s]"></div>
                 </div>

                 {/* Interactive UI Mockups */}
                 <motion.div 
                   animate={{ y: [0, -20, 0] }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute -top-10 -right-10 bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white/30 flex items-center gap-4"
                 >
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                       <ShieldCheck size={24} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Attendance Sync</p>
                       <p className="text-xl font-black text-slate-900 tracking-tighter italic  uppercase">Verified</p>
                    </div>
                 </motion.div>

                 <motion.div 
                   animate={{ y: [0, 20, 0] }}
                   transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute -bottom-10 -left-10 bg-slate-950 p-8 rounded-[3rem] shadow-2xl border border-white/10 text-white min-w-[240px]"
                 >
                    <div className="flex justify-between items-start mb-6">
                       <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em]  italic">Academic Yield</p>
                       <Zap size={18} className="text-indigo-400" />
                    </div>
                    <div className="flex items-end gap-3">
                       <p className="text-5xl font-black tracking-tighter italic  italic leading-none">98.4</p>
                       <span className="text-indigo-400 font-black text-xs uppercase mb-1">%</span>
                    </div>
                    <div className="mt-6 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                         animate={{ width: ["0%", "98.4%"] }}
                         transition={{ duration: 2, delay: 1 }}
                         className="h-full bg-indigo-500"
                       ></motion.div>
                    </div>
                 </motion.div>

                 {/* Decorative Bubbles */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-200/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
              </div>
           </motion.div>
        </div>
      </section>

      {/* --- KPI SECTION --- */}
      <section className="bg-white border-y border-slate-100 py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 md:gap-20">
              <KPIMetric label="Enrolled Students" value="12,400" icon={Users} color="indigo" />
              <KPIMetric label="Authorized Faculty" value="850" icon={GraduationCap} color="blue" />
              <KPIMetric label="Daily Operations" value="99.9%" icon={ShieldCheck} color="emerald" />
              <KPIMetric label="Digital Assets" value="25.5TB" icon={Database} color="purple" />
           </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-50 py-20 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 opacity-50 hover:opacity-100 transition-opacity">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white">
                 <Layout size={20} />
              </div>
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest ">Adarsh Shishu Mandir <br/><span className="text-[9px] opacity-40">Architectural Node v3.0</span></p>
           </div>

           <div className="flex flex-wrap justify-center gap-10 font-black uppercase text-[10px] tracking-[0.3em]  italic">
              <span className="hover:text-indigo-600 transition-colors cursor-pointer">Security Protocol</span>
              <span className="hover:text-indigo-600 transition-colors cursor-pointer">Privacy Matrix</span>
              <span className="hover:text-indigo-600 transition-colors cursor-pointer">Endpoint API</span>
              <span className="hover:text-indigo-600 transition-colors cursor-pointer">Institutional Audit</span>
           </div>

           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]  italic">© 2026 ASM Institutional. All nodes encrypted.</p>
        </div>
      </footer>

    </div>
  );
};

const NavLink = ({ label }: { label: string }) => (
  <a href="#" className=" text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-indigo-600 transition-all hover:translate-y-[-1px] italic">
    {label}
  </a>
);

const KPIMetric = ({ label, value, icon: Icon, color }: any) => {
  const colorMap = {
    indigo: "text-indigo-600",
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    purple: "text-purple-600"
  };

  return (
    <div className="text-center md:text-left space-y-4 group">
      <div className={`w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto md:mx-0 shadow-inner group-hover:scale-110 transition-transform ${colorMap[color as keyof typeof colorMap]}`}>
        <Icon size={24} />
      </div>
      <div>
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-1  italic italic leading-none">{label}</p>
         <p className="text-3xl font-black text-slate-900 tracking-tighter uppercase  italic italic">{value}</p>
      </div>
    </div>
  );
};

export default Home;
