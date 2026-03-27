import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Download } from 'lucide-react';

const Home = () => {
 const navigate = useNavigate();
 const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

 useEffect(() => {
  const handler = (e: any) => {
   e.preventDefault();
   setDeferredPrompt(e);
  };
  window.addEventListener('beforeinstallprompt', handler);
  return () => window.removeEventListener('beforeinstallprompt', handler);
 }, []);

 const handleInstallClick = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
   setDeferredPrompt(null);
  }
 };

 return (
  <div className="min-h-screen bg-[#ffffff] text-[#1a202c] overflow-x-hidden relative" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
   {/* 🟢 Mesh Background Component */}
   <div className="absolute top-0 left-0 w-full h-full z-[-1]" 
      style={{ backgroundImage: 'radial-gradient(at 0% 0%, hsla(225,39%,30%,0.05) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(45,100%,50%,0.05) 0, transparent 50%)' }}>
   </div>

   {/* 🟢 Navigation */}
   <nav className="container mx-auto px-4 md:px-8 py-4 md:py-6 flex justify-between items-center animate__animated animate__fadeIn">
    <div className="flex items-center space-x-2">
     <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg">A</div>
     <span className="text-base md:text-xl font-extrabold tracking-tight text-slate-800 uppercase">
      ADARSH <span className="text-blue-600">SHISHU</span> <span className="hidden xs:inline">MANDIR</span>
     </span>
    </div>
     <div className="hidden md:flex space-x-10 font-black text-slate-600 text-[10px] uppercase tracking-widest">
      <a href="#" className="hover:text-blue-600 transition-colors">Our Vision</a>
      <a href="#" className="hover:text-blue-600 transition-colors cursor-pointer" onClick={() => navigate('/register-school')}>Register School</a>
      <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
     </div>
     <button 
      onClick={() => navigate('/login')}
      className="px-8 py-3 bg-slate-950 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-xl"
     >
      Login
     </button>
   </nav>

   {/* 🟢 Hero Section */}
   <section className="container mx-auto px-8 pt-20 pb-32 grid md:grid-cols-2 gap-12 items-center">
    <div className="animate__animated animate__fadeInLeft">
     <span className="inline-block px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-bold mb-6 tracking-wide uppercase">
      ✨ Excellence in Education
     </span>
     <h1 className="text-4xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-4 md:mb-6 tracking-tighter">
      Where Young <br className="hidden md:block" /> Minds <span className="text-blue-600 underline decoration-yellow-400">Dream big.</span>
     </h1>
     <p className="text-base md:text-lg text-slate-500 mb-8 md:mb-10 leading-relaxed max-w-lg">
      Experience a modern management system designed to bring teachers, parents, and students together in one seamless white-label environment.
     </p>

     <div className="flex flex-col sm:flex-row gap-5">
      <button 
       onClick={() => navigate('/login')}
       className="w-full sm:w-auto px-10 py-5 bg-slate-950 text-white font-black rounded-[2rem] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 text-xs uppercase tracking-widest"
      >
       Enter Portal
      </button>

      <button 
       onClick={() => navigate('/register-school')}
       className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 font-black rounded-[2rem] border-2 border-blue-600 shadow-xl hover:bg-blue-50 transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-3"
      >
       <Sparkles size={18} /> Register School
      </button>

      {deferredPrompt && (
       <button 
        onClick={handleInstallClick}
        className="w-full sm:w-auto px-10 py-5 bg-emerald-600 text-white font-black rounded-[2rem] shadow-2xl hover:bg-emerald-700 transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-3 animate-pulse"
       >
        <Download size={18} /> Install App
       </button>
      )}
     </div>
    </div>

    {/* 🟢 Right Decoration Section */}
    <div className="relative animate__animated animate__fadeInRight flex justify-center">
      {/* School Illustration or Image Placeholder */}
      <div className=" rounded-[3rem] border-0 border-white shadow-2xl relative overflow-hidden flex items-center justify-center">
         <div className="text-blue-200 font-black text-9xl select-none"><img src="/logo.png"/></div>
         {/* Floating Card UI Mockup */}
         <div className="absolute bottom-10 left-10 bg-white p-4 rounded-2xl shadow-xl animate-bounce flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Attendance</p>
            <p className="text-sm font-black text-gray-800">Completed</p>
          </div>
         </div>
      </div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
    </div>
   </section>

   {/* 🟢 Footer Info */}
   <div className="container mx-auto px-8 border-t border-slate-100 py-12 flex flex-wrap justify-between items-center opacity-60">
    <p className="font-bold text-slate-400">TRUSTED BY 50+ INSTITUTIONS</p>
    <div className="flex gap-4 text-slate-400 font-bold">
      <span>CBSE AFFILIATED</span> • <span>ISO CERTIFIED</span> • <span>DIGITAL CAMPUS</span>
    </div>
   </div>
  </div>
 );
};

export default Home;



















