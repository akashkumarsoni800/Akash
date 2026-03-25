import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, GraduationCap, Clock, Plus, Search, 
  Trash2, Edit2, CheckCircle, CreditCard,
  Wallet, PieChart, Package, ShieldAlert, UserPlus,
  Printer, LayoutDashboard, Zap, Activity, FileStack, Settings,
  Upload, Camera, FlipHorizontal, X, ChevronDown, Calendar
} from 'lucide-react';
import StudentsManagement from '../components/admin/StudentsManagement';
import TeachersManagement from '../components/admin/TeachersManagement';
import ExamsManagement from '../components/admin/ExamsManagement';
import ApprovalsManagement from '../components/admin/ApprovalsManagement';

// --- ANIMATION VARIANTS ---
const containerVar = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVar = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

// --- HELPER COMPONENTS ---
const ActionCard = ({ icon: Icon, label, color, onClick }: any) => {
  const themes = {
    blue: 'border-blue-100 bg-blue-50/30 text-blue-600 hover:bg-blue-600 hover:text-white',
    purple: 'border-purple-100 bg-purple-50/30 text-purple-600 hover:bg-purple-600 hover:text-white',
    orange: 'border-orange-100 bg-orange-50/30 text-orange-600 hover:bg-orange-600 hover:text-white',
    amber: 'border-amber-100 bg-amber-50/30 text-amber-600 hover:bg-amber-600 hover:text-white',
    red: 'border-rose-100 bg-rose-50/30 text-rose-600 hover:bg-rose-600 hover:text-white',
    indigo: 'border-indigo-100 bg-indigo-50/30 text-indigo-600 hover:bg-indigo-600 hover:text-white',
    emerald: 'border-emerald-100 bg-emerald-50/30 text-emerald-600 hover:bg-emerald-600 hover:text-white',
  };

  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center justify-center gap-2 p-5 bg-white border rounded-2xl shadow-sm transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 ${themes[color as keyof typeof themes]}`}
    >
       <div className="p-3 rounded-xl transition-all duration-300">
          <Icon size={20} className="group-hover:scale-110 transition-transform" />
       </div>
       <span className="text-[10px] font-medium  tracking-widest text-center leading-tight">{label}</span>
    </button>
  );
};

const StatCard = ({ icon: Icon, title, value, color, subText }: any) => {
  const colorStyles = {
    blue: 'text-blue-600 bg-blue-50/50',
    amber: 'text-amber-600 bg-amber-50/50',
    emerald: 'text-emerald-600 bg-emerald-50/50',
  };

  return (
    <motion.div variants={itemVar} className="premium-card p-6 md:p-8 bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-[10px] font-medium  tracking-widest mb-4">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-medium text-slate-900  leading-none">{value}</h3>
            {subText && <span className="text-[10px] text-slate-400 font-medium  tracking-tight">{subText}</span>}
          </div>
        </div>
        <div className={`p-4 rounded-xl ${colorStyles[color as keyof typeof colorStyles]}`}>
          <Icon size={24} className="opacity-80" />
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color === 'blue' ? 'bg-blue-500 animate-pulse' : color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
            <span className="text-[9px] font-medium  text-slate-400 tracking-wider">Live System Sync</span>
         </div>
         <Activity size={14} className="text-slate-200" />
      </div>
    </motion.div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'overview';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ students: 0, teachers: 0, pending: 0 });
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => { 
    fetchInitialData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [stdRes, tchRes, penRes] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_approved', 'approved'),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_approved', 'pending')
      ]);
      setCounts({ students: stdRes.count || 0, teachers: tchRes.count || 0, pending: penRes.count || 0 });
      
      const { data: pending } = await supabase.from('students').select('*').eq('is_approved', 'pending').limit(10);
      setPendingStudents(pending || []);
    } catch (e) { toast.error("Database Error"); } 
    finally { setLoading(false); }
  };

  const handleAction = async (action: string, table: string, idValue: any) => {
    if (action === 'delete' && !window.confirm("Confirm deletion?")) return;
    setLoading(true);
    let err;
    const pkColumn = table === 'students' ? 'student_id' : 'id';
    
    if (action === 'delete') ({ error: err } = await supabase.from(table).delete().eq(pkColumn, idValue));
    if (action === 'approve') ({ error: err } = await supabase.from('students').update({ is_approved: 'approved' }).eq('student_id', idValue));
    
    if (!err) { toast.success("Done!"); fetchInitialData(); } 
    else { toast.error(err.message); setLoading(false); }
  };

  if (loading && !counts.students) return <div className="h-screen flex items-center justify-center font-medium text-slate-400   text-xs">ASM SYNCING...</div>;

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVar} className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 pb-32">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* --- HEADER & TOP ACTIONS --- */}
        <motion.div variants={itemVar} className="bg-white border border-slate-100 rounded-3xl p-8 md:p-10 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-10">
            <div className="flex items-center gap-4 text-center lg:text-left">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 animate-float">
                <LayoutDashboard size={28}/>
              </div>
              <div>
                <h1 className="text-3xl font-medium text-slate-900   leading-none">Command Center</h1>
                <p className="text-[10px] font-medium text-blue-500  tracking-widest mt-2">Administrative Authority Level 4</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
               <button onClick={() => navigate('/admin/create-exam')} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-medium  tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2">
                 <Zap size={14} className="text-yellow-400"/> Examination
               </button>
               <button onClick={() => navigate('/admin/manage-fees')} className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-medium  tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm flex items-center gap-2">
                 <CreditCard size={14}/> Financials
               </button>
               <button onClick={() => navigate('/admin/upload-result')} className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-medium  tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm flex items-center gap-2">
                 <CheckCircle size={14}/> Assessments
               </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
             <ActionCard icon={Wallet} label="Accounting" color="blue" onClick={() => navigate('/admin/manage-salaries')} />
             <ActionCard icon={FileStack} label="Docs Hub" color="orange" onClick={() => navigate('/admin/documents')} />
             <ActionCard icon={PieChart} label="Staff Payroll" color="purple" onClick={() => navigate('/admin/teacher-salary')} />
             <ActionCard icon={Package} label="Logistics" color="amber" onClick={() => navigate('/admin/inventory')} />
             <ActionCard icon={ShieldAlert} label="Security" color="red" onClick={() => navigate('/admin/create-admin')} />
             <ActionCard icon={UserPlus} label="Enrollment" color="indigo" onClick={() => navigate('/admin/add-student')} />
             <ActionCard icon={Plus} label="Faculty" color="emerald" onClick={() => navigate('/admin/add-teacher')} />
          </div>
        </motion.div>

        {/* --- STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard icon={GraduationCap} title="Enrolled Students" value={counts.students} color="blue" subText="Live admission data" />
          <StatCard icon={Clock} title="Awaiting Approval" value={counts.pending} color="amber" subText="Action required" />
          <StatCard icon={Users} title="Academic Staff" value={counts.teachers} color="emerald" subText="Faculty management" />
        </div>

        {/* --- TABLES SECTION --- */}
        <motion.div variants={itemVar} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm mt-10">
          <div className="flex flex-wrap border-b border-slate-100 p-2 gap-2 bg-slate-50/50">
            {['overview', 'students', 'teachers', 'exams', 'approvals'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`px-8 py-3.5 text-[10px] font-medium  tracking-widest rounded-2xl transition-all duration-300 ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4 md:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="ov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pendingStudents.map(s => (
                      <div key={s.student_id} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col justify-between h-48 group hover:border-blue-200 transition-all">
                        <div>
                          <h4 className="font-medium text-slate-800  text-lg leading-tight tracking-tight">{s.full_name}</h4>
                          <span className="inline-block mt-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-medium  tracking-wider">Class {s.class_name}</span>
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                           <button onClick={() => handleAction('approve', 'students', s.student_id)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-[9px] font-medium  tracking-widest hover:bg-blue-700 shadow-md transition-all">Approve</button>
                           <button onClick={() => handleAction('delete', 'students', s.student_id)} className="flex-1 bg-white text-rose-500 py-3 rounded-xl text-[9px] font-medium  tracking-widest border border-rose-100 hover:bg-rose-50 transition-all">Reject</button>
                        </div>
                      </div>
                    ))}
                    {pendingStudents.length === 0 && <div className="col-span-full py-20 text-center opacity-30 font-medium   text-[10px] text-slate-400">Zero Pending Authority Tasks</div>}
                </motion.div>
              )}

              {activeTab === 'students' && (
                <motion.div key="st" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <StudentsManagement />
                </motion.div>
              )}

              {activeTab === 'teachers' && (
                <motion.div key="tch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <TeachersManagement />
                </motion.div>
              )}

              {activeTab === 'exams' && (
                <motion.div key="exm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <ExamsManagement />
                </motion.div>
              )}

              {activeTab === 'approvals' && (
                <motion.div key="app" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <ApprovalsManagement />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
