import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Code, Layout, Server, Cpu, Globe, User, Mail, ArrowUpRight } from 'lucide-react';
import { ShimmerButton } from '../components/ui/ShimmerButton';
import Character from '../components/portfolio/Character';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const AboutMe = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade in animations
      gsap.from(".reveal-item", {
        opacity: 0,
        y: 30,
        stagger: 0.2,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".reveal-item",
          start: "top 85%",
        }
      });

      // Split text or large reveal for the bio
      if (textRef.current) {
        gsap.from(textRef.current, {
          opacity: 0,
          y: 50,
          duration: 1.5,
          ease: "expo.out",
          scrollTrigger: {
            trigger: textRef.current,
            start: "top 80%",
          }
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const skills = [
    { icon: <Layout className="w-5 h-5" />, name: "Frontend", items: ["React", "Vite", "GSAP", "Tailwind", "Motion"] },
    { icon: <Server className="w-5 h-5" />, name: "Backend", items: ["Node", "Express", "Postgres", "Firebase"] },
    { icon: <Cpu className="w-5 h-5" />, name: "Core", items: ["Arch", "UI/UX", "Scaling", "Database"] },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#080808] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/5 blur-[120px] rounded-full" />
      </div>

      <nav className="fixed top-0 w-full z-50 p-8 flex justify-between items-center backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center space-x-2 font-mono text-[10px] tracking-[0.3em] uppercase opacity-50">
           <span>Akash / Developer</span>
        </div>
        <div className="flex items-center space-x-6">
           <a href="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Home</a>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-40 pb-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Authentic MoncyDev 3D Layout */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-32">
            <div className="flex flex-col items-start text-left order-2 lg:order-1">
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl md:text-2xl font-normal uppercase tracking-[0.5rem] text-indigo-400 mb-12 reveal-item"
              >
                About Me
              </motion.h3>
              
              <p 
                ref={textRef}
                className="text-3xl md:text-[33px] font-semibold tracking-[1px] leading-[1.1] md:leading-[36px] text-white reveal-item"
              >
                I am a <span className="text-indigo-500 italic">Full-Stack</span> Developer building systems that simplify life through digital excellence. My focus is on creating scalable solutions that solve real-world problems.
              </p>
              
              <div className="mt-12 reveal-item">
                <ShimmerButton className="h-14 px-10 rounded-[5px] text-[10px] font-black uppercase tracking-[0.2em] bg-white text-black hover:bg-slate-100 transition-all flex items-center gap-3">
                  Check Resume <ArrowUpRight size={14} />
                </ShimmerButton>
              </div>
            </div>

            {/* 3D Character Column */}
            <div className="order-1 lg:order-2">
               <Character />
            </div>
          </div>

          <section className="grid lg:grid-cols-2 gap-24 items-start mb-32">
            <div className="space-y-8 reveal-item">
              <div className="flex items-center space-x-3 text-indigo-400">
                <Terminal size={18} />
                <span className="font-mono text-xs uppercase tracking-widest">Philosophy</span>
              </div>
              <p className="text-xl md:text-2xl text-slate-400 leading-relaxed font-medium">
                My approach to development is centered on **scalability** and **performance**. Whether it's a School Management System or a real-time dashboard, I believe every line of code should contribute to a seamless user experience.
              </p>
              <div className="pt-8">
                <ShimmerButton className="h-14 px-10 rounded-[5px] text-[10px] font-black uppercase tracking-[0.2em] bg-white text-black hover:bg-slate-100 transition-all flex items-center gap-3">
                  Download Resume <ArrowUpRight size={14} />
                </ShimmerButton>
              </div>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 reveal-item">
              {skills.map((skill, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  className="glass p-8 rounded-[5px] border border-white/5 hover:border-indigo-500/20 group transition-all duration-500 h-full flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-12">
                    <div className="p-3 bg-indigo-500/10 rounded-[5px] text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                      {skill.icon}
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight mb-4">{skill.name}</h3>
                    <div className="flex flex-wrap gap-2">
                       {skill.items.map((item, i) => (
                         <span key={i} className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                           {item}
                         </span>
                       ))}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Specialized Bento Section */}
              <div className="glass p-8 rounded-[5px] border border-indigo-500/10 bg-indigo-500/[0.02] flex flex-col justify-center items-center text-center">
                 <div className="relative mb-6">
                    <Globe size={40} className="text-indigo-400 animate-pulse" />
                    <div className="absolute inset-0 bg-indigo-400 blur-2xl opacity-20" />
                 </div>
                 <p className="text-sm font-black uppercase tracking-tighter text-white">Full Cycle Dev</p>
                 <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Scale / Security / UI</p>
              </div>
            </div>
          </section>

          {/* Social / Contact Banner */}
          <motion.section 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="reveal-item py-20 px-8 glass rounded-[5px] flex flex-col md:flex-row items-center justify-between gap-12 border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] pointer-events-none" />
            <div className="relative z-10 max-w-2xl text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 leading-none">
                Bring your vision to the <span className="text-indigo-400 italic">browser</span>.
              </h2>
              <p className="text-slate-400 font-medium text-lg">Currently available for high-impact projects and collaborations.</p>
            </div>
            <div className="flex gap-4 relative z-10">
               <a href="mailto:hello@akash.com" className="p-4 glass rounded-full hover:bg-white hover:text-black transition-all">
                  <Mail size={24} />
               </a>
               <a href="#" className="p-4 glass rounded-full hover:bg-white hover:text-black transition-all">
                  <Layout size={24} />
               </a>
            </div>
          </motion.section>
        </div>
      </main>

      <footer className="pt-20 pb-10 text-center relative z-10">
        <div className="w-12 h-px bg-white/10 mx-auto mb-10" />
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">Akash . MMXXIV . Portfolio</p>
      </footer>
    </div>
  );
};

export default AboutMe;
