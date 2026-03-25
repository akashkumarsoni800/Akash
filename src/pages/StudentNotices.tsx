import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 Bell, Calendar, ChevronLeft, 
 RefreshCw, Megaphone, Clock, ShieldCheck, Quote, Star, Zap
} from 'lucide-react';

const StudentNotices = () => {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(true);
 const [notices, setNotices] = useState<any[]>([]);

 useEffect(() => {
  const fetchNotices = async () => {
   try {
    setLoading(true);
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (data) setNotices(data);
   } catch (err) {
    console.error(err);
   } finally {
    setLoading(false);
   }
  };
  fetchNotices();
 }, []);

 if (loading) return (
  <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
    <div className="relative">
     <RefreshCw size={60} className="animate-spin text-blue-600/20"/>
     <Megaphone size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
    </div>
    <p className="font-black  text-slate-400 text-[10px] mt-8">Syncing Bulletin Feed...</p>
  </div>
 );

 return (
  <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-10 pb-32 font-inter">
   <div className="max-w-5xl mx-auto space-y-12">
    
    {/* --- NAVIGATION & CONTEXT --- */}
    <div className="flex justify-between items-center">
     <button 
      onClick={() => navigate(-1)} 
      className="group flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all active:scale-95"
     >
      <ChevronLeft size={18} className="text-blue-600 group-hover:-translate-x-1 transition-transform" />
      <span className="font-black tracking-widest text-[10px] text-slate-600">Portal Exit</span>
     </button>

     <div className="hidden md:flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
       <Star size={16} className="text-blue-400 fill-blue-400" />
       <span className="text-[10px] font-black tracking-widest text-slate-400 ">Priority Broadcast Channel</span>
     </div>
    </div>

    {/* --- DYNAMIC HEADER --- */}
    <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="">
       <h1 className="text-5xl md:text-7xl font-black text-slate-900  leading-none uppercase">
        School<br/>
        <span className="text-blue-600">Bulletin</span>
       </h1>
       <p className="text-slate-400 font-black text-[10px] mt-4 flex items-center gap-2">
        <ShieldCheck size={12} className="text-blue-500" /> Official Communications & Updates
       </p>
      </motion.div>
      
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all">
       <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl shadow-slate-200 group-hover:scale-110 transition-transform">📢</div>
       <div>
        <p className="text-[9px] font-black text-slate-400  mb-1">Active Broadcasts</p>
        <p className="text-3xl font-black text-slate-900 ">{notices.length} Updates</p>
       </div>
      </div>
    </div>

    {/* --- ANNOUNCEMENT GRID --- */}
    <div className="space-y-10">
     <AnimatePresence>
      {notices.map((notice, idx) => (
       <motion.div 
        key={idx}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.1 }}
        className="bg-white rounded-[3.5rem] p-8 md:p-16 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-2xl hover:border-blue-100 transition-all duration-700"
       >
         <div className="absolute -right-20 -top-20 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000 rotate-12 group-hover:rotate-0">
          <Megaphone size={400}/>
         </div>
         
         <div className="relative z-10 space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
               <Bell size={28} className="group-hover:animate-ring" />
             </div>
             <div className="space-y-1">
               <h3 className="text-2xl md:text-4xl font-black text-slate-900  leading-none uppercase">{notice.title}</h3>
               <p className="text-[10px] font-black text-slate-400 tracking-widest flex items-center gap-2">
                <Zap size={10} className="text-blue-500" /> Paid Publication
               </p>
             </div>
            </div>
            
            <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
             <Calendar size={16} className="text-blue-500 group-hover:text-blue-100" />
             <span className="text-[10px] font-black tracking-widest text-slate-500 group-hover:text-white">
               {new Date(notice.created_at || notice.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
             </span>
            </div>
          </div>
          
          <div className="relative">
            <Quote className="absolute -left-4 -top-4 text-blue-100/50" size={60} />
            <p className="text-slate-600 font-black text-lg md:text-xl leading-relaxed pl-12 border-l-[6px] border-blue-50 py-4 group-hover:border-blue-200 transition-colors">
             {notice.description}
            </p>
          </div>

          <div className="pt-6 flex items-center gap-4">
            <div className="h-[2px] w-12 bg-blue-100 rounded-full" />
            <span className="text-[9px] font-black text-slate-300 ">End of Transmission</span>
          </div>
         </div>
       </motion.div>
      ))}
     </AnimatePresence>

     {notices.length === 0 && (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 shadow-inner group"
      >
        <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-6xl shadow-inner group-hover:rotate-12 transition-transform duration-500">📭</div>
        <div className="space-y-4">
         <h3 className="text-3xl font-black text-slate-900  uppercase">List Locked</h3>
         <p className="max-w-md mx-auto text-slate-400 font-black text-[10px]  leading-relaxed px-10">
          The priority broadcast channel is currently silent. Please maintain operational focus until further updates are authorized.
         </p>
        </div>
      </motion.div>
     )}
    </div>
   </div>
  </div>
 );
};

export default StudentNotices;
