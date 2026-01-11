import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1a202c] overflow-x-hidden relative" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* 🟢 Mesh Background Component */}
      <div className="absolute top-0 left-0 w-full h-full z-[-1]" 
           style={{ backgroundImage: 'radial-gradient(at 0% 0%, hsla(225,39%,30%,0.05) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(45,100%,50%,0.05) 0, transparent 50%)' }}>
      </div>

      {/* 🟢 Navigation */}
      <nav className="container mx-auto px-8 py-6 flex justify-between items-center animate__animated animate__fadeIn">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">A</div>
          <span className="text-xl font-extrabold tracking-tight text-slate-800 uppercase">
            ADARSH <span className="text-blue-600">SHISHU</span> MANDIR
          </span>
        </div>
        <div className="hidden md:flex space-x-10 font-medium text-slate-600">
          <a href="#" className="hover:text-blue-600 transition-colors">Curriculum</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Admissions</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Portal</a>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="px-6 py-2 border-2 border-slate-800 rounded-full font-bold hover:bg-slate-800 hover:text-white transition-all active:scale-95"
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
          <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tighter">
            Where Young <br /> Minds <span className="text-blue-600 underline decoration-yellow-400">Dream big.</span>
          </h1>
          <p className="text-lg text-slate-500 mb-10 leading-relaxed max-w-lg">
            Experience a modern management system designed to bring teachers, parents, and students together in one seamless white-label environment.
          </p>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:scale-105 transition-transform relative overflow-hidden group"
            >
              <span className="relative z-10">Explore Dashboard</span>
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-45 transition-all duration-500 group-hover:left-[100%]"></div>
            </button>
            
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
              Student Portal
            </button>
          </div>
        </div>

        {/* 🟢 Right Decoration Section */}
        <div className="relative animate__animated animate__fadeInRight flex justify-center">
            {/* School Illustration or Image Placeholder */}
            <div className="w-full h-[400px] bg-blue-50 rounded-[3rem] border-4 border-white shadow-2xl relative overflow-hidden flex items-center justify-center">
                 <div className="text-blue-200 font-black text-9xl select-none"><img src="./public/logo.png"/></div>
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






