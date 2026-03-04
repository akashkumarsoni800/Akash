import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, GraduationCap, Clock, Plus, Search, 
  FileText, Trash2, Edit2, CheckCircle, CreditCard,
  Wallet, PieChart, Package, ShieldAlert, UserPlus, Settings,
  Printer, Calendar, LayoutDashboard, Zap, Activity
} from 'lucide-react';

const containerVar = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVar = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const StatCard = ({ icon: Icon, title, value, color, subText }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100/50',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100/50',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50',
  };

  return (
    <motion.div 
      variants={itemVar}
      whileHover={{ y: -8, shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
      className={`relative overflow-hidden bg-white rounded-[2.5rem] p-8 border ${colorStyles[color]?.split(' ')[2] || 'border-gray-100'} shadow-xl transition-all duration-500`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</p>
          <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{value}</h3>
          {subText && <div className="flex items-center gap-1 mt-3">
             <Activity size={12} className="text-emerald-500" />
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{subText}</p>
          </div>}
        </div>
        <div className={`p-5 rounded-[1.5rem] ${colorStyles[color]?.split(' ').slice(0,2).join(' ')}`}>
          <Icon size={28} />
        </div>
      </div>
    </motion.div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [counts, setCounts] = useState({ students: 0, teachers: 0, pending: 0 });
  const [pendingStudents, setPendingStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => { 
    fetchInitialData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      const { data: students } = await supabase.from('students').select('*').eq('is_approved', 'approved').order('full_name');
      const { data: teachers } = await supabase.from('teachers').select('*').order('full_name');
      setPendingStudents(pending || []);
      setAllStudents(students || []);
      setAllTeachers(teachers || []);
      if (students) setClasses(['All', ...new Set(students.map(s => s.class_name))]);
    } catch (e) { toast.error("Database Sync Error"); } 
    finally { setLoading(false); }
  };

  const handleAction = async (action, table, id, payload = {}) => {
    if (action === 'delete' && !window.confirm("क्या आप वाकई इसे हमेशा के लिए डिलीट करना चाहते हैं?")) return;
    setLoading(true);
    let err;
    if (action === 'delete') ({ error: err } = await supabase.from(table).delete().eq('id', id));
    if (action === 'approve') ({ error: err } = await supabase.from('students').update({ is_approved: 'approved' }).eq('id', id));
    if (action === 'update') ({ error: err } = await supabase.from(table).update(payload).eq('id', id));
    
    if (!err) { 
      toast.success("कार्य सफलतापूर्वक संपन्न!"); 
      fetchInitialData(); 
      setIsEditModalOpen(false); 
    } else { 
      toast.error(err.message); 
      setLoading(false); 
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await handleAction('update', 'students', editingStudent.id, { 
      full_name: editingStudent.full_name, 
      class_name: editingStudent.class_name 
    });
  };

  const filteredStudents = allStudents.filter(s => 
    (classFilter === 'All' || s.class_name === classFilter) &&
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredTeachers = allTeachers.filter(t => t.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading && !counts.students) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-16 h-16 border-b-4 border-indigo-600 rounded-full mb-6" />
      <p className="text-gray-900 font-black uppercase tracking-[0.3em] animate-pulse">Initializing ASM v3.0...</p>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVar} className="min-h-screen bg-[#fcfdfe] p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* --- SMART ENTERPRISE HEADER --- */}
        <motion.div variants={itemVar} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 flex flex-col gap-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="space-y-2">
               <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-xl text-white"><LayoutDashboard size={20}/></div>
                  <h1 className="text-5xl font-black text-gray-900 uppercase italic tracking-tighter">Admin Portal</h1>
               </div>
               <div className="flex items-center gap-4 text-gray-400 font-black text-[10px] uppercase tracking-widest pl-1">
                  <span>{currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  <span className="text-indigo-500">•</span>
                  <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{currentTime.toLocaleTimeString()}</span>
               </div>
            </div>

            <div className="flex flex-wrap gap-3">
               <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate('/admin/create-exam')} className="flex items-center gap-2 bg-gray-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black shadow-xl uppercase italic"><Zap size={14}/> Exam</motion.button>
               <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate('/admin/manage-fees')} className="flex items-center gap-2 bg-rose-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black shadow-xl uppercase italic"><CreditCard size={14}/> Fees</motion.button>
               <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate('/admin/documents')} className="flex items-center gap-2 bg-orange-500 text-white px-6 py-4 rounded-2xl text-[10px] font-black shadow-xl uppercase italic"><Printer size={14}/> Documents</motion.button>
               <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate('/admin/upload-result')} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black shadow-xl uppercase italic"><CheckCircle size={14}/> Results</motion.button>
            </div>
          </div>

          {/* --- NEON ACTION GRID --- */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
             <ActionCard icon={Wallet} label="Accounting" color="blue" onClick={() => navigate('/admin/manage-salaries')} />
             <ActionCard icon={PieChart} label="Staff Pay" color="purple" onClick={() => navigate('/admin/teacher-salary')} />
             <ActionCard icon={Package} label="Inventory" color="orange" onClick={() => navigate('/admin/inventory')} />
             <ActionCard icon={ShieldAlert} label="System Access" color="red" onClick={() => navigate('/admin/create-admin')} />
             <ActionCard icon={UserPlus} label="New Student" color="indigo" onClick={() => navigate('/admin/add-student')} />
             <ActionCard icon={Plus} label="New Teacher" color="emerald" onClick={() => navigate('/admin/add-teacher')} />
          </div>
        </motion.div>

        {/* --- MAIN KPI STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard icon={GraduationCap} title="Enrolled Students" value={counts.students} color="blue" subText="Live Admission Data" />
          <StatCard icon={Clock} title="Awaiting Approval" value={counts.pending} color="amber" subText="Action Required" />
          <StatCard icon={Users} title="Academic Staff" value={counts.teachers} color="emerald" subText="Faculty Management" />
        </div>

        {/* --- ANALYTICS & TABLES TABS --- */}
        <motion.div variants={itemVar} className="bg-white rounded-[4rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden min-h-[700px]">
          <div className="flex border-b border-gray-50 p-6 gap-6 bg-gray-50/30">
            {['overview', 'students', 'teachers'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-10 py-5 text-[11px] font-black uppercase tracking-[0.2em] rounded-[2rem] transition-all relative ${activeTab === tab ? 'bg-white text-indigo-600 shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>
                {tab}
                {activeTab === tab && <motion.div layoutId="activeTabDot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-600 rounded-full" />}
              </button>
            ))}
          </div>

          <div className="p-10">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="ov" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="flex items-center justify-between mb-10">
                     <h2 className="text-2xl font-black text-gray-900 uppercase italic flex items-center gap-3">
                       <Clock size={24} className="text-amber-500" /> Pending Approvals
                     </h2>
                     <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{pendingStudents.length} Students Pending</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingStudents.length > 0 ? pendingStudents.map(s => (
                      <motion.div key={s.id} layout className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-6 hover:border-indigo-100 transition-all">
                        <div>
                           <h3 className="font-black text-gray-900 uppercase text-lg">{s.full_name}</h3>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Class: {s.class_name}</p>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => handleAction('approve', 'students', s.id)} className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl text-[10px] font-black tracking-[0.1em] uppercase shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all">Approve</button>
                          <button onClick={() => handleAction('delete', 'students', s.id)} className="flex-1 bg-gray-50 text-gray-400 py-4 rounded-2xl text-[10px] font-black tracking-[0.1em] uppercase hover:bg-red-50 hover:text-red-500 transition-all">Reject</button>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="col-span-full py-32 text-center">
                         <div className="text-7xl mb-6">🥂</div>
                         <p className="text-gray-300 font-black uppercase tracking-[0.3em] text-xl italic">No Pending Tasks</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'students' && (
                <motion.div key="st" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-1 group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                      <input onChange={(e) => setSearchTerm(e.target.value)} type="text" placeholder="Search students by name or roll number..." className="w-full pl-16 pr-8 py-5 bg-gray-50 border-none rounded-[2rem] font-bold text-gray-900 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                    </div>
                    <select onChange={(e) => setClassFilter(e.target.value)} className="py-5 px-10 bg-gray-50 border-none rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-inner cursor-pointer outline-none hover:bg-gray-100 transition-all">
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="overflow-hidden rounded-[3rem] border border-gray-50 shadow-inner">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="p-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Student Profile</th>
                          <th className="p-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Class Grade</th>
                          <th className="p-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredStudents.map(s => (
                          <tr key={s.id} className="hover:bg-indigo-50/30 transition-all group">
                            <td className="p-8 font-black text-gray-800 uppercase text-sm">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border flex items-center justify-center text-indigo-600 font-black">{s.full_name[0]}</div>
                                  {s.full_name}
                               </div>
                            </td>
                            <td className="p-8 text-center">
                              <span className="bg-indigo-50 text-indigo-700 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-wider">
                                {s.class_name}
                              </span>
                            </td>
                            <td className="p-8 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                              <ActionIconButton icon={Edit2} color="indigo" onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} />
                              <ActionIconButton icon={Users} color="blue" onClick={() => navigate(`/admin/student/${s.id}`)} />
                              <ActionIconButton icon={Trash2} color="red" onClick={() => handleAction('delete', 'students', s.id)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'teachers' && (
                <motion.div key="tch" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredTeachers.map(t => (
                      <div key={t.id} className="bg-white border border-gray-100 p-10 rounded-[3.5rem] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full group-hover:scale-150 transition-all duration-700 opacity-50" />
                        
                        <div className="relative">
                          <div className="flex justify-between items-start mb-8">
                            <div className="h-20 w-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-emerald-200">
                              {t.full_name[0]}
                            </div>
                            <div className="flex gap-2">
                               <button className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-emerald-600 transition-colors"><Edit2 size={16}/></button>
                               <button onClick={() => handleAction('delete', 'teachers', t.id)} className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                            </div>
                          </div>
                          
                          <h3 className="font-black text-gray-900 text-xl uppercase tracking-tighter mb-2">{t.full_name}</h3>
                          <p className="text-emerald-600 text-[11px] font-black uppercase tracking-[0.2em] mb-8 italic">{t.subject || 'Lead Faculty'}</p>
                          
                          <div className="space-y-4 pt-6 border-t border-gray-50">
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-tight">
                               <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400"><Activity size={14}/></div>
                               ID: {t.id.toString().slice(0,8)}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-tight">
                               <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400"><Users size={14}/></div>
                               Mob: {t.contact_number || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* --- RE-USABLE STUDENT EDIT MODAL --- */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-[0_0_100px_-20px_rgba(0,0,0,0.3)]">
              <h2 className="text-4xl font-black text-gray-900 uppercase italic mb-10 flex items-center gap-4 tracking-tighter">
                <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><Edit2 size={24} /></div>
                Edit Profile
              </h2>
              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-4">Full Name</label>
                  <input type="text" value={editingStudent.full_name} onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})} className="w-full bg-gray-50 border-none rounded-[2rem] px-8 py-5 font-black text-gray-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-4">Class Grade</label>
                  <select value={editingStudent.class_name} onChange={(e) => setEditingStudent({...editingStudent, class_name: e.target.value})} className="w-full bg-gray-50 border-none rounded-[2rem] px-8 py-5 font-black text-gray-900 uppercase cursor-pointer outline-none">
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-4 pt-6">
                  <button type="submit" className="flex-2 bg-indigo-600 text-white font-black py-5 px-10 rounded-[2rem] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase tracking-widest text-[11px]">Save Updates</button>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 font-black py-5 rounded-[2rem] hover:bg-gray-200 transition-all uppercase tracking-widest text-[11px]">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

// --- MODERN HELPER COMPONENTS ---

const ActionCard = ({ icon: Icon, label, color, onClick }) => {
  const themes = {
    blue: 'hover:bg-blue-600 shadow-blue-100',
    purple: 'hover:bg-purple-600 shadow-purple-100',
    orange: 'hover:bg-orange-500 shadow-orange-100',
    red: 'hover:bg-red-600 shadow-red-100',
    indigo: 'hover:bg-indigo-600 shadow-indigo-100',
    emerald: 'hover:bg-emerald-600 shadow-emerald-100',
  };

  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-4 p-6 bg-white border border-gray-50 rounded-[2.5rem] shadow-xl transition-all duration-500 group ${themes[color] || 'hover:bg-gray-900'}`}>
       <div className={`p-4 rounded-2xl bg-gray-50 group-hover:bg-white/20 group-hover:text-white transition-all duration-500`}>
          <Icon size={24} className="group-hover:scale-110 transition-transform" />
       </div>
       <span className="text-[10px] font-black uppercase italic group-hover:text-white transition-colors tracking-tighter">{label}</span>
    </button>
  );
};

const ActionIconButton = ({ icon: Icon, color, onClick }) => {
  const colors = {
    indigo: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-600',
    blue: 'text-blue-600 bg-blue-50 hover:bg-blue-600',
    red: 'text-red-600 bg-red-50 hover:bg-red-600',
  };
  return (
    <button onClick={onClick} className={`p-4 rounded-2xl ${colors[color]} hover:text-white transition-all duration-300 shadow-sm`}>
       <Icon size={18} />
    </button>
  );
};

export default AdminDashboard;
