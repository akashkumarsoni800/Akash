import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from "react-webcam";
import { 
  Users, GraduationCap, Clock, Plus, Search, 
  Trash2, Edit2, CheckCircle, CreditCard,
  Wallet, PieChart, Package, ShieldAlert, UserPlus,
  Printer, LayoutDashboard, Zap, Activity, FileStack, Settings,
  Upload, Camera, FlipHorizontal, X, ChevronDown
} from 'lucide-react';

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
       <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{label}</span>
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
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
            {subText && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{subText}</span>}
          </div>
        </div>
        <div className={`p-4 rounded-xl ${colorStyles[color as keyof typeof colorStyles]}`}>
          <Icon size={24} className="opacity-80" />
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color === 'blue' ? 'bg-blue-500 animate-pulse' : color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Live System Sync</span>
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
  const [searchTerm, setSearchTerm] = useState('');
  
  // Photo States
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef<any>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user"); 

  const [counts, setCounts] = useState({ students: 0, teachers: 0, pending: 0 });
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
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
      
      const { data: pending } = await supabase.from('students').select('*').eq('is_approved', 'pending');
      const { data: students } = await supabase.from('students').select('*').eq('is_approved', 'approved').order('roll_no', { ascending: true });
      const { data: teachers } = await supabase.from('teachers').select('*').order('full_name');
      
      setPendingStudents(pending || []);
      setAllStudents(students || []);
      setAllTeachers(teachers || []);
      if (students) setClasses(['All', ...new Set(students.map(s => s.class_name))]);
    } catch (e) { toast.error("Database Error"); } 
    finally { setLoading(false); }
  };

  const handleAction = async (action: string, table: string, idValue: any, payload: any = {}) => {
    if (action === 'delete' && !window.confirm("Confirm deletion?")) return;
    setLoading(true);
    let err;
    const pkColumn = table === 'students' ? 'student_id' : 'id';
    
    if (action === 'delete') ({ error: err } = await supabase.from(table).delete().eq(pkColumn, idValue));
    if (action === 'approve') ({ error: err } = await supabase.from('students').update({ is_approved: 'approved' }).eq('student_id', idValue));
    if (action === 'update') ({ error: err } = await supabase.from(table).update(payload).eq(pkColumn, idValue));
    
    if (!err) { toast.success("Done!"); fetchInitialData(); setIsEditModalOpen(false); } 
    else { toast.error(err.message); setLoading(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let photoUrl = editingStudent.photo_url;
      if (newPhotoFile) {
        const fileName = `${Date.now()}_update.jpg`;
        const { error: uploadError } = await supabase.storage.from("student-photos").upload(fileName, newPhotoFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("student-photos").getPublicUrl(fileName);
        photoUrl = data.publicUrl;
      }
      await handleAction('update', 'students', editingStudent.student_id, { 
        full_name: editingStudent.full_name, class_name: editingStudent.class_name,
        roll_no: editingStudent.roll_no, father_name: editingStudent.father_name, photo_url: photoUrl
      });
      setNewPhotoFile(null); setNewPhotoPreview(null);
    } catch (err: any) {
      console.error("Photo Update Error Details:", err);
      const msg = err.message || "Unknown error";
      if (msg.includes("bucket")) {
        toast.error("Storage Bucket Error: Please ensure 'student-photos' bucket is public and has proper RLS policies.");
      } else {
        toast.error(`Update Failed: ${msg}`);
      }
    } 
    finally { setLoading(false); }
  };
const toggleCamera = () => {
  setFacingMode(prev => prev === "user" ? "environment" : "user");
};
  const capturePhoto = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    const blob = await fetch(imageSrc).then((res) => res.blob());
    const file = new File([blob], "edit.jpg", { type: "image/jpeg" });
    setNewPhotoFile(file); setNewPhotoPreview(imageSrc); setShowWebcam(false);
  };
  
  

  const filteredStudents = allStudents.filter(s => 
    (classFilter === 'All' || s.class_name === classFilter) &&
    (s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.roll_no?.toString().includes(searchTerm))
  );

  if (loading && !counts.students) return <div className="h-screen flex items-center justify-center font-black">ASM SYNCING...</div>;

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
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Command Center</h1>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-2">Administrative Authority Level 4</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
               <button onClick={() => navigate('/admin/create-exam')} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2">
                 <Zap size={14} className="text-yellow-400"/> Examination
               </button>
               <button onClick={() => navigate('/admin/manage-fees')} className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm flex items-center gap-2">
                 <CreditCard size={14}/> Financials
               </button>
               <button onClick={() => navigate('/admin/upload-result')} className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm flex items-center gap-2">
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
            {['overview', 'students', 'teachers'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300 ${
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
                          <h4 className="font-black text-slate-800 uppercase text-lg leading-tight tracking-tight">{s.full_name}</h4>
                          <span className="inline-block mt-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">Class {s.class_name}</span>
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                           <button onClick={() => handleAction('approve', 'students', s.student_id)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-md transition-all">Approve</button>
                           <button onClick={() => handleAction('delete', 'students', s.student_id)} className="flex-1 bg-white text-rose-500 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-50 transition-all">Reject</button>
                        </div>
                      </div>
                    ))}
                    {pendingStudents.length === 0 && <div className="col-span-full py-20 text-center opacity-30 font-black uppercase tracking-[0.4em] text-[10px] italic text-slate-400">Zero Pending Authority Tasks</div>}
                </motion.div>
              )}

              {activeTab === 'students' && (
                <motion.div key="st" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1 group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        type="text" 
                        placeholder="Search system records..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-bold text-slate-900" 
                      />
                    </div>
                    <div className="relative">
                       <select 
                         onChange={(e) => setClassFilter(e.target.value)} 
                         className="appearance-none bg-slate-50 border border-slate-200 rounded-2xl pl-6 pr-12 py-4 outline-none focus:bg-white focus:border-blue-400 text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer"
                       >
                         {classes.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                       <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="px-8 py-5">Roll Logic</th>
                          <th className="px-8 py-5">Identity Meta</th>
                          <th className="px-8 py-5 text-center">Batch</th>
                          <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredStudents.map(s => (
                          <tr key={s.student_id} className="hover:bg-slate-50/80 group transition-all text-[11px] font-bold">
                            <td className="px-8 py-5 font-black text-blue-600 tracking-widest italic">#{s.roll_no}</td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <img src={s.photo_url || `https://ui-avatars.com/api/?name=${s.full_name}&background=1e293b&color=fff`} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-100" />
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                </div>
                                <span className="font-black text-slate-900 uppercase tracking-tight">{s.full_name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter">Grade {s.class_name}</span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16}/></button>
                                <button onClick={() => navigate(`/admin/student/${s.student_id}`)} className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Users size={16}/></button>
                                <button onClick={() => handleAction('delete', 'students', s.student_id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                    {/* Mobile Card View for Students */}
                    <div className="md:hidden space-y-4">
                      {filteredStudents.map(s => (
                        <div key={s.student_id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                           <div className="flex justify-between items-start">
                             <div className="flex items-center gap-3">
                               <img src={s.photo_url || `https://ui-avatars.com/api/?name=${s.full_name}&background=1e293b&color=fff`} className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
                               <div>
                                 <h3 className="font-black text-slate-800 uppercase text-sm leading-tight">{s.full_name}</h3>
                                 <p className="font-black text-blue-600 italic text-[10px] mt-1">#{s.roll_no}</p>
                               </div>
                             </div>
                             <span className="bg-slate-100 border border-slate-50 px-3 py-1 rounded-lg text-[9px] font-black tracking-widest text-slate-500">{s.class_name}</span>
                           </div>
                           <div className="flex gap-2">
                             <button onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} className="flex-1 flex justify-center items-center py-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"><Edit2 size={12} className="mr-2"/> Edit</button>
                             <button onClick={() => navigate(`/admin/student/${s.student_id}`)} className="flex-1 flex justify-center items-center py-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-500 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"><Users size={12} className="mr-2"/> View</button>
                             <button onClick={() => handleAction('delete', 'students', s.student_id)} className="flex-1 flex justify-center items-center py-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"><Trash2 size={12} className="mr-2"/> Drop</button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
              )}

              {activeTab === 'teachers' && (
                <motion.div key="tch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allTeachers.map(t => (
                    <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group hover:border-emerald-200 transition-all">
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-emerald-100">{t.full_name?.[0]}</div>
                          <button onClick={() => handleAction('delete', 'teachers', t.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2 bg-slate-50 rounded-xl"><Trash2 size={16}/></button>
                       </div>
                        <div className="flex flex-col pl-2">
                           <h3 className="font-black uppercase text-slate-800 leading-tight text-lg tracking-tight mb-1">{t.full_name}</h3>
                           <div className="flex items-center gap-2 mb-4">
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${
                                t.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {t.role || 'teacher'}
                              </span>
                              <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight">{t.email}</p>
                           </div>
                           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic border-t border-slate-50 pt-3">{t.subject || 'Staff Member'}</p>
                        </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isEditModalOpen && editingStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh] relative border border-slate-100">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                    <Edit2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800">System Record</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Profile Authority Management</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="flex flex-col items-center gap-6 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl relative group">
                    <img src={newPhotoPreview || editingStudent.photo_url || "/default-avatar.png"} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <label className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                      <div className="text-center">
                        <Upload className="text-white mx-auto mb-2" size={20} />
                        <span className="text-[9px] font-black text-white uppercase tracking-wider">Replace</span>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { setNewPhotoFile(e.target.files[0]); setNewPhotoPreview(URL.createObjectURL(e.target.files[0])); } }} />
                    </label>
                  </div>
                  <button type="button" onClick={() => setShowWebcam(true)} className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest transition-all">
                    <Camera size={14} className="text-blue-600" /> Remote Capture
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Full Identity</label>
                    <input type="text" value={editingStudent.full_name} onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-blue-400 font-bold text-slate-900 transition-all" placeholder="Full Name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Parent Identity</label>
                    <input type="text" value={editingStudent.father_name} onChange={(e) => setEditingStudent({...editingStudent, father_name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-blue-400 font-bold text-slate-900 transition-all" placeholder="Father's Name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Registry Logic</label>
                    <input type="number" value={editingStudent.roll_no} onChange={(e) => setEditingStudent({...editingStudent, roll_no: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-blue-400 font-bold text-slate-900 transition-all" placeholder="Roll No" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Active Batch</label>
                    <div className="relative">
                      <select value={editingStudent.class_name} onChange={(e) => setEditingStudent({...editingStudent, class_name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-blue-400 font-bold text-slate-900 appearance-none cursor-pointer transition-all">{classes.map(c => <option key={c} value={c}>{c}</option>)}</select>
                      <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">Verify & Save</button>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-10 bg-slate-50 text-slate-400 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] hover:bg-slate-100 hover:text-slate-600 transition-all">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CAMERA POPUP --- */}
      {showWebcam && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center justify-center p-6">
          <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="rounded-[3rem] border-4 border-white shadow-2xl max-w-sm w-full" />
          <div className="flex gap-4 mt-8"><button onClick={capturePhoto} className="bg-emerald-500 text-white px-12 py-5 rounded-2xl font-black uppercase shadow-xl">Capture</button><button onClick={() => setShowWebcam(false)} className="bg-red-500 text-white px-12 py-5 rounded-2xl font-black uppercase">Close</button></div>
       

 {/* ✅ FIXED CAMERA FLIP BUTTON */}
    <button 
      type="button" 
      onClick={toggleCamera}
      className="mt-6 p-3 bg-white/20 hover:bg-white/40 text-white rounded-2xl backdrop-blur-sm flex items-center gap-2 font-bold uppercase text-sm"
    >
      <FlipHorizontal size={20} />
      Flip Camera
    </button>
        </div>
      )}
    </motion.div>
  );
};

export default AdminDashboard;
