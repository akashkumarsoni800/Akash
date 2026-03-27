import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';
import { 
 ChevronLeft, Megaphone, Send, 
 Calendar, FileText, ShieldCheck, Zap,
 Clock, Info, Layout, RefreshCw
} from 'lucide-react';

const AddEvent = () => {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 const [formData, setFormData] = useState({
  title: '',
  description: '',
  event_date: ''
 });

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
   const { error } = await supabase
    .from('events')
    .insert([
     {
      title: formData.title,
      description: formData.description,
      event_date: formData.event_date
     }
    ]);

   if (error) throw error;

   toast.success("Event Published Successfully! 📢");
   navigate('/admin/dashboard'); 

  } catch (error: any) {
   console.error(error);
   toast.error("Error: " + error.message);
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-10 pb-32 font-inter">
   <div className="max-w-full mx-auto space-y-12">
    
    {/* --- NAVIGATION --- */}
    <div className="flex justify-between items-center">
     <button 
      onClick={() => navigate(-1)} 
      className="group flex items-center gap-3 bg-white px-6 py-3 rounded-[5px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all active:scale-95"
     >
      <ChevronLeft size={18} className="text-blue-600 group-hover:-translate-x-1 transition-transform" />
      <span className="font-black tracking-widest text-[10px] text-slate-600">Portal Dashboard</span>
     </button>

     <div className="bg-slate-900 px-6 py-3 rounded-[5px] border border-slate-800 shadow-xl flex items-center gap-4 group">
       <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
       <span className="text-[10px] font-black  text-blue-400 ">Ready to Save</span>
     </div>
    </div>

    {/* --- DYNAMIC HEADER --- */}
    <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="">
       <h1 className="text-5xl md:text-7xl font-black text-slate-900  leading-none uppercase">
        Broadcast<br/>
        <span className="text-blue-600">Hub</span>
       </h1>
       <p className="text-slate-400 font-black text-[10px] mt-4 flex items-center gap-2">
        <ShieldCheck size={12} className="text-blue-500" /> Write and Publish Notices
       </p>
      </motion.div>
      
      <div className="bg-white border border-slate-100 rounded-[5px] p-6 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all">
       <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl shadow-slate-200 group-hover:scale-110 transition-transform">📢</div>
       <div>
        <p className="text-[9px] font-black text-slate-400  mb-1">Status</p>
        <p className="text-3xl font-black text-slate-900  ">Active</p>
       </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
     
     {/* --- DRAFTING CHAMBER --- */}
     <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="lg:col-span-7 bg-white rounded-[5px] shadow-sm border border-slate-100 overflow-hidden group"
     >
       <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center px-12">
        <h3 className="font-black text-[10px] text-slate-400  flex items-center gap-3 uppercase">
          <Layout size={16} className="text-blue-600"/> Compose Notice
        </h3>
       </div>

       <form onSubmit={handleSubmit} className="p-12 space-y-10">
        <div className="grid gap-10">
          {/* Title Input */}
          <div className="space-y-4">
           <label className="flex items-center gap-3 text-[10px] font-black text-slate-400 tracking-widest pl-2">
             <Info size={14} className="text-blue-500" /> Broadcast Title
           </label>
           <input
            type="text"
            required
            placeholder="e.g. School Maintenance Protocol"
            className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-8 py-5 text-lg font-black text-slate-900 placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all shadow-inner "
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
           />
          </div>

          {/* Date Input */}
          <div className="space-y-4">
           <label className="flex items-center gap-3 text-[10px] font-black text-slate-400 tracking-widest pl-2">
             <Calendar size={14} className="text-blue-500" /> Effective Date
           </label>
           <input
            type="date"
            required
            className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-8 py-5 text-lg font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all shadow-inner "
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
           />
          </div>

          {/* Description Input */}
          <div className="space-y-4">
           <label className="flex items-center gap-3 text-[10px] font-black text-slate-400 tracking-widest pl-2">
             <FileText size={14} className="text-blue-500" /> Narrative Content
           </label>
           <textarea
            required
            rows={6}
            placeholder="Detail the operational notice here..."
            className="w-full bg-slate-50 border border-slate-100 rounded-[5px] px-8 py-6 text-base font-black text-slate-600 placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all shadow-inner leading-relaxed"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
           />
          </div>
        </div>

        <div className="pt-6">
          <button
           type="submit"
           disabled={loading}
           className="w-full bg-slate-900 text-white py-6 rounded-[5px] hover:bg-blue-600 font-black  shadow-2xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 group/btn overflow-hidden relative"
          >
           {loading ? (
            <RefreshCw className="animate-spin" size={20} />
           ) : (
            <>
             <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             <span className="relative z-10">Initiate Distribution</span>
            </>
           )}
          </button>
        </div>
       </form>
     </motion.div>

     {/* --- PREVIEW PANEL --- */}
     <div className="lg:col-span-5 space-y-8">
       <div className="bg-slate-900 p-10 rounded-[5px] shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 text-blue-500/10 group-hover:rotate-12 transition-transform duration-1000">
          <Megaphone size={200} />
        </div>
        
        <h4 className="text-blue-400 font-black text-[10px]  mb-8 flex items-center gap-2 ">
          <Zap size={10} /> Transmission Preview
        </h4>
        
        <div className="space-y-6">
          <div className="space-y-2">
           <p className="text-slate-500 font-black text-[9px] tracking-widest">Header Signal</p>
           <h5 className="text-2xl font-black text-white  min-h-[3rem]">
            {formData.title || "Waiting for signal..."}
           </h5>
          </div>
          
          <div className="space-y-2">
           <p className="text-slate-500 font-black text-[9px] tracking-widest">Content Total</p>
           <p className="text-slate-400 text-sm leading-relaxed min-h-[8rem]">
            {formData.description || "Synthesize content to generate preview payload..."}
           </p>
          </div>
          
          <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
           <div className="flex items-center gap-3">
             <Calendar className="text-blue-500" size={14} />
             <span className="text-white font-black text-[10px] tracking-widest">
              {formData.event_date ? new Date(formData.event_date).toLocaleDateString() : "No Date Set"}
             </span>
           </div>
           <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
        </div>
       </div>

       <div className="bg-white p-8 rounded-[5px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
        <div className="w-12 h-12 bg-blue-50 rounded-[5px] flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <Clock size={20} />
        </div>
        <p className="text-slate-600 font-black text-[10px] tracking-widest leading-relaxed">
         Notices are instantly distributed to all active <span className="text-blue-600">Scholar s</span>.
        </p>
       </div>
     </div>

    </div>
   </div>
  </div>
 );
};

export default AddEvent;
