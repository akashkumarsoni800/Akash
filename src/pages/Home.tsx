import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Download, ArrowRight, Network, LayoutDashboard, 
  BarChart3, Calendar, Receipt, ClipboardCheck, 
  BusFront, ShieldCheck, GraduationCap, Users2, 
  Quote, ChevronRight, Menu, X, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] font-sans selection:bg-indigo-100 italic-none">
      
      {/* --- PREMIUM NAVIGATION --- */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-900 rounded-[5px] flex items-center justify-center text-white shadow-lg shadow-indigo-100 font-black text-xl">A</div>
            <span className="text-xl font-black tracking-tighter text-indigo-950 uppercase hidden sm:block">Academic <span className="text-indigo-600">Luminary</span></span>
          </div>

          <nav className="hidden lg:flex items-center gap-10">
            {['Features', 'Solutions', 'Pricing', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">{item}</a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 p-2">Login</button>
            <button 
              onClick={() => navigate('/register-school')}
              className="px-8 py-3.5 bg-indigo-900 text-white rounded-[5px] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 tracking-widest shadow-indigo-100 active:scale-95"
            >
              Get Started
            </button>
            <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* --- HERO SECTION --- */}
        <section className="pt-40 pb-24 px-6 md:px-10 overflow-hidden relative">
          <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8 text-center lg:text-left"
            >
              <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black tracking-[0.2em] uppercase">The Future of Education</span>
              <h1 className="text-5xl md:text-8xl font-black text-slate-900 leading-[0.95] tracking-tighter uppercase">
                Empower Your <br/> Schools with One <span className="text-indigo-600 underline decoration-indigo-200">Unified Platform</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                The ultimate school management solution for growing educational institutions and chains. Synchronize data across campuses with institutional-grade security.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                <button 
                  onClick={() => navigate('/register-school')}
                  className="px-12 py-5 bg-indigo-600 text-white rounded-[5px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-900 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Register School <ArrowRight size={18} />
                </button>
                {deferredPrompt && !isInstalled && (
                  <button 
                    onClick={handleInstallClick}
                    className="px-12 py-5 bg-emerald-600 text-white rounded-[5px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-100 hover:bg-emerald-700 transition-all animate-bounce flex items-center justify-center gap-3"
                  >
                    <Download size={18} /> Install Application
                  </button>
                )}
                {isInstalled && (
                  <div className="px-12 py-5 bg-slate-100 text-slate-500 rounded-[5px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-slate-200">
                    <CheckCircle2 size={18} className="text-emerald-500" /> App Installed
                  </div>
                )}
                <button className="px-12 py-5 bg-white text-indigo-900 border-2 border-indigo-100 rounded-[5px] font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all">Book a Demo</button>
              </div>

              {/* Stats/Proof */}
              <div className="pt-10 flex flex-wrap justify-center lg:justify-start gap-12 border-t border-slate-100">
                <div>
                  <p className="text-3xl font-black text-slate-900">500+</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Schools</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900">1M+</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Users</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900">99.9%</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uptime SLA</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-[5px] p-4 bg-white border border-slate-100 shadow-2xl relative overflow-hidden">
                <img src="/logo.png" className="w-full h-full object-contain p-12 bg-slate-50 rounded-[5px]" alt="Hero Branding" />
                
                {/* Floating UI Elements */}
                <div className="absolute top-12 -right-10 bg-white p-6 rounded-[5px] shadow-2xl border border-slate-50 animate-bounce">
                    <CheckCircle2 size={32} className="text-emerald-500 mb-3" />
                    <p className="text-[10px] font-black text-slate-400 uppercase">Synced</p>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Data Integrity</p>
                </div>
              </div>
              
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-indigo-400/10 rounded-full blur-[100px] -z-10"></div>
            </motion.div>
          </div>
        </section>

        {/* --- WHY MULTI-SCHOOL --- */}
        <section id="features" className="py-32 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="text-center max-w-full mx-auto mb-20 space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">Why Multi-School Management?</h2>
              <p className="text-lg text-slate-500 leading-relaxed uppercase font-black text-[10px] tracking-widest">Centralize the complexity of diverse campuses into a single, high-performance command center.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <StatCard 
                icon={<LayoutDashboard size={32}/>} 
                title="Unified Command" 
                desc="Switch between individual school data or view aggregate statistics across your entire organization with one click." 
              />
              <StatCard 
                icon={<BarChart3 size={32}/>} 
                title="Global Insights" 
                desc="Real-time metrics on enrollment, fee collection, and academic performance from every school in your network." 
              />
              <StatCard 
                icon={<Network size={32}/>} 
                title="Seamless Sync" 
                desc="Propagate policies, calendars, and circulars across all institutions instantly from the central hub." 
              />
            </div>
          </div>
        </section>

        {/* --- BENTO GRID FEATURES --- */}
        <section className="py-32 bg-slate-50/50 border-y border-slate-100">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <div className="max-w-2xl space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">Every Tool Your Schools Need</h2>
                <p className="text-lg text-slate-500">A comprehensive ecosystem designed to automate administrative friction and let educators focus on learning.</p>
              </div>
              <button className="text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 group">
                Explore All modules <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid md:grid-cols-12 gap-6">
              {/* Massive Main Feature */}
              <div className="md:col-span-8 bg-white p-12 rounded-[5px] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all">
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Centralized Core</span>
                  <h3 className="text-3xl font-black text-slate-900 uppercase">Automated Admissions & Fees</h3>
                  <p className="text-slate-500 max-w-md">Streamline student onboarding and digital fee collection with automated invoicing and parent notifications.</p>
                </div>
                <div className="mt-12 h-64 bg-slate-50 rounded-[5px] p-8 flex items-center justify-center relative overflow-hidden">
                    <Receipt size={120} className="text-indigo-100 opacity-50 rotate-12 absolute -right-4 -bottom-4" />
                    <div className="w-full h-8 bg-indigo-100 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 w-3/4 bg-indigo-600 rounded-full animate-pulse"></div>
                    </div>
                    <span className="absolute left-8 top-8 font-black text-indigo-900 text-3xl">75% Collected</span>
                </div>
              </div>

              {/* Smaller Feature */}
              <div className="md:col-span-4 bg-indigo-900 p-12 rounded-[5px] shadow-2xl active:scale-95 tracking-widest text-white flex flex-col items-center justify-center text-center group">
                <Calendar size={64} className="mb-6 opacity-30 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Intelligent Timetable</h3>
                <p className="text-indigo-200 text-sm leading-relaxed">AI-powered scheduling that eliminates faculty clashes and optimizes room utilization automatically.</p>
              </div>

              {/* Three bottom features */}
              <FeatureBox icon={<ClipboardCheck size={24}/>} title="Smart Attendance" desc="Biometric and mobile-based tracking with instant SMS alerts." />
              <FeatureBox icon={<BarChart3 size={24}/>} title="Exams & Grading" desc="Digital examination management and automated report cards." />
              <FeatureBox icon={<BusFront size={24}/>} title="Transport Hub" desc="Real-time GPS tracking of school buses with arrival updates." />
            </div>
          </div>
        </section>

        {/* --- STAKEHOLDERS --- */}
        <section id="solutions" className="py-32 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-20 items-center">
             <div className="space-y-12">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">One Experience, <br/> Every User.</h2>
                <div className="space-y-10">
                  <StakeholderItem 
                    icon={<ShieldCheck size={24}/>} 
                    title="For Administrators" 
                    desc="Total institutional control with multi-layered permissions and financial oversight." 
                  />
                  <StakeholderItem 
                    icon={<Users2 size={24}/>} 
                    title="For Teachers" 
                    desc="Reduced paperwork with digital lesson plans and automated grading tools." 
                  />
                  <StakeholderItem 
                    icon={<GraduationCap size={24}/>} 
                    title="For Students & Parents" 
                    desc="Mobile app for homework, attendance, fee payments, and communication." 
                  />
                </div>
             </div>
             <div className="relative">
                <img src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=80&w=1000" className="rounded-[5px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] grayscale hover:grayscale-0 transition-all duration-700" alt="Students" />
                <div className="absolute -bottom-10 -right-10 bg-indigo-600 p-10 rounded-[5px] text-white shadow-2xl animate-float">
                  <p className="text-4xl font-black">98%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">Satisfaction Rate</p>
                </div>
             </div>
          </div>
        </section>

        {/* --- TESTIMONIALS --- */}
        <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
          <Quote className="absolute -top-10 -left-10 text-white/5 w-64 h-64" />
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center space-y-16 relative">
            <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Voice of Leadership</h2>
            <div className="max-w-full mx-auto space-y-10">
              <p className="text-3xl md:text-5xl font-black leading-tight tracking-tighter italic">
                "Academic Luminary has completely transformed how we manage our network of 12 international schools. The unified reporting alone saved us hundreds of manual labor hours per month."
              </p>
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full border-4 border-indigo-500/30 overflow-hidden ring-4 ring-slate-900">
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Director" />
                </div>
                <div>
                  <p className="text-xl font-black text-white uppercase tracking-tight">Dr. Richard Henderson</p>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Director of Operations, Global Education Group</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- FINAL CTA --- */}
        <section className="py-24 bg-white relative">
          <div className="max-w-full mx-auto px-6">
            <div className="p-16 md:p-24 bg-indigo-950 rounded-[5px] text-center text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-10 animate__animated animate__pulse">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">Ready to unify <br/> your institution?</h2>
                <p className="text-lg text-indigo-300 max-w-xl mx-auto">Join the hundreds of forward-thinking schools that have simplified their operations and elevated experience.</p>
                <div className="flex flex-col sm:flex-row gap-5 justify-center">
                   <button onClick={() => navigate('/register-school')} className="px-12 py-5 bg-white text-indigo-950 font-black rounded-[5px] text-xs uppercase tracking-widest hover:bg-indigo-300 transition-all shadow-2xl active:scale-95 tracking-widest">Complete Registration</button>
                   <button className="px-12 py-5 bg-indigo-900/50 border border-indigo-700 text-white font-black rounded-[5px] text-xs uppercase tracking-widest hover:bg-indigo-800 transition-all">Schedule a Call</button>
                </div>
              </div>
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]"></div>
              <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-400/10 rounded-full blur-[120px]"></div>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-50 py-20 border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2 md:col-span-1 space-y-8 text-left">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-900 rounded-lg flex items-center justify-center text-white font-black text-sm uppercase">A</div>
                <span className="text-sm font-black text-indigo-950 uppercase">Academic Luminary</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed uppercase font-black">Redefining institutional management through precision engineering and editorial design.</p>
            </div>
            
            <FooterColumn title="Platform" links={['Features', 'Pricing', 'Solutions', 'API Docs']} />
            <FooterColumn title="Resources" links={['About Us', 'Case Studies', 'Support', 'Blog']} />
            <FooterColumn title="Legal" links={['Privacy Policy', 'Terms of Service', 'Data Security']} />
          </div>

          <div className="pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">© 2024 Academic Luminary. All rights reserved.</p>
            <div className="flex gap-8 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <span>Engage globally. Manage locally.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-8 space-y-10 lg:hidden"
          >
            {['Features', 'Solutions', 'Pricing', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="block text-4xl font-black text-slate-900 uppercase tracking-tighter">{item}</a>
            ))}
            <div className="pt-10 border-t border-slate-100 space-y-4">
              <button onClick={() => navigate('/login')} className="w-full py-5 text-xl font-black text-slate-900 uppercase tracking-tighter border-2 border-slate-100 rounded-[5px]">Login</button>
              <button 
                onClick={() => { navigate('/register-school'); setIsMenuOpen(false); }}
                className="w-full py-5 bg-indigo-900 text-white text-xl font-black rounded-[5px] uppercase tracking-tighter"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ icon, title, desc }: any) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="p-10 rounded-[5px] bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-indigo-100 transition-all group"
  >
    <div className="w-16 h-16 bg-white rounded-[5px] flex items-center justify-center text-indigo-600 shadow-sm mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all">
      {icon}
    </div>
    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed font-black uppercase text-[10px] tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{desc}</p>
  </motion.div>
);

const FeatureBox = ({ icon, title, desc }: any) => (
  <div className="md:col-span-4 bg-white p-10 rounded-[5px] border border-slate-100 shadow-sm hover:shadow-2xl active:scale-95 tracking-widest transition-all group flex flex-col justify-between h-72">
    <div className="w-12 h-12 bg-indigo-50 rounded-[5px] flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
      {icon}
    </div>
    <div className="space-y-2">
      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h3>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed leading-none">{desc}</p>
    </div>
  </div>
);

const StakeholderItem = ({ icon, title, desc }: any) => (
  <div className="flex gap-6 group">
    <div className="w-14 h-14 bg-indigo-50 rounded-[5px] flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
      {icon}
    </div>
    <div className="space-y-1">
      <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed max-w-sm">{desc}</p>
    </div>
  </div>
);

const FooterColumn = ({ title, links }: any) => (
  <div className="space-y-6 text-left">
    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">{title}</h4>
    <ul className="space-y-3">
      {links.map((link: string) => (
        <li key={link}><a href="#" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors">{link}</a></li>
      ))}
    </ul>
  </div>
);

export default Home;



















