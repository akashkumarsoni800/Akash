import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
 CheckCircle, XCircle, UserCheck, 
 ShieldAlert, Clock, Search, 
 RefreshCw, MoreVertical, 
 ArrowRight, ShieldCheck, Mail,
 GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ApprovalsManagement() {
 const [approvals, setApprovals] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  fetchApprovals();
 }, []);

 const fetchApprovals = async () => {
  setLoading(true);
  try {
   const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('is_approved', 'pending')
    .order('created_at', { ascending: false });

   if (error) throw error;
   setApprovals(data || []);
  } catch (err: any) {
   toast.error("Sync Error: " + err.message);
  } finally {
   setLoading(false);
  }
 };

 const handleAction = async (id: string, action: 'approved' | 'rejected') => {
  try {
   if (action === 'rejected' && !window.confirm("Delete this registration request?")) return;
   
   const { error } = await supabase
    .from('students')
    .update({ is_approved: action })
    .eq('student_id', id);

   if (error) throw error;
   
   toast.success(action === 'approved' ? "Approved ✅" : "Rejected ❌");
   fetchApprovals();
  } catch (err: any) {
   toast.error(err.message);
  }
 };

 return (
  <div className="space-y-8">
   <div className="flex justify-between items-center">
     <div className="space-y-1">
      <h3 className="text-2xl font-black text-slate-900  leading-none uppercase">Pending Approvals</h3>
      <p className="text-[10px] font-black text-slate-400 tracking-widest mt-1">Confirm new registrations</p>
     </div>
     <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${approvals.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-200'}`}></div>
      <span className="text-[10px] font-black text-slate-400 tracking-widest">{approvals.length} Awaiting</span>
     </div>
   </div>
 
   <div className="grid grid-cols-1 gap-6">
     <AnimatePresence mode="popLayout">
      {approvals.map((req, idx) => (
        <motion.div 
         key={req.student_id}
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ delay: idx * 0.05 }}
         className="premium-card p-8 hover:shadow-2xl active:scale-95 tracking-widest transition-all group flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden"
        >
         <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />
         
         <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
           <div className="w-16 h-16 bg-amber-50 rounded-[5px] flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm shrink-0">
            <Clock size={28} />
           </div>
           <div className="space-y-1 overflow-hidden">
            <h4 className="text-xl font-black text-slate-900  leading-none truncate">{req.full_name}</h4>
            <div className="flex flex-wrap gap-4 items-center mt-2">
              <div className="flex items-center gap-2 text-slate-400">
               <GraduationCap size={12} className="text-slate-300" />
               <p className="text-[10px] font-black tracking-tight">Grade {req.class_name}</p>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
               <Mail size={12} className="text-slate-300" />
               <p className="text-[10px] font-black tracking-tight">{req.email}</p>
              </div>
            </div>
           </div>
         </div>
 
         <div className="flex gap-3 w-full md:w-auto">
           <button 
            onClick={() => handleAction(req.student_id, 'approved')}
            className="premium-button-admin flex-1 md:flex-none bg-slate-900 text-white hover:bg-blue-600 border-none shadow-2xl active:scale-95 tracking-widest"
           >
            <CheckCircle size={16} /> Approve
           </button>
           <button 
            onClick={() => handleAction(req.student_id, 'rejected')}
            className="premium-button-admin flex-1 md:flex-none bg-white text-rose-500 border border-rose-100 hover:bg-rose-50 shadow-sm"
           >
            <XCircle size={16} /> Reject
           </button>
         </div>
        </motion.div>
      ))}
     </AnimatePresence>

     {approvals.length === 0 && !loading && (
      <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[5px] bg-slate-50/30">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner">
         <ShieldCheck size={48} />
        </div>
        <h4 className="text-[10px] font-black text-slate-400  mb-2"> All Clear</h4>
        <p className="text-[9px] font-black text-slate-300 tracking-widest leading-relaxed">No pending registration requests found.</p>
      </div>
     )}
   </div>
  </div>
 );
}
