import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, GraduationCap, Clock, Plus, Search, 
  Trash2, Edit2, CheckCircle, CreditCard,
  Wallet, PieChart, Package, ShieldAlert, UserPlus,
  Printer, LayoutDashboard, Zap, Activity, FileStack, Settings
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

// --- HELPER COMPONENTS (Moved up to prevent Reference Errors) ---
const ActionCard = ({ icon: Icon, label, color, onClick }) => {
  const themes = {
    blue: 'hover:bg-blue-600 shadow-blue-100',
    purple: 'hover:bg-purple-600 shadow-purple-100',
    orange: 'hover:bg-orange-500 shadow-orange-100',
    amber: 'hover:bg-amber-500 shadow-amber-100',
    red: 'hover:bg-red-600 shadow-red-100',
    indigo: 'hover:bg-indigo-600 shadow-indigo-100',
    emerald: 'hover:bg-emerald-600 shadow-emerald-100',
  };

  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-4 p-5 bg-white border border-gray-50 rounded-[2.2rem] shadow-xl transition-all duration-500 group ${themes[color] || 'hover:bg-gray-900'}`}>
       <div className={`p-4 rounded-2xl bg-gray-50 group-hover:bg-white/20 group-hover:text-white transition-all duration-500`}>
          <Icon size={24} className="group-hover:scale-110 transition-transform" />
       </div>
       <span className="text-[9px] font-black uppercase italic group-hover:text-white transition-colors tracking-tighter text-center leading-tight">{label}</span>
    </button>
  );
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

const NavBtn = ({ label, icon: Icon, color, onClick }) => (
  <motion.button whileHover={{ scale: 1.05 }} onClick={onClick} className={`flex items-center gap-2 ${color} text-white px-6 py-4 rounded-2xl text-[10px] font-black shadow-xl uppercase italic`}>
    <Icon size={14}/> {label}
  </motion.button>
);

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
      
      // ✅ Sorting Fixed: छात्रों को Roll No के हिसाब से सॉर्ट किया
      const { data: students } = await supabase
        .from('students')
        .select('*')
        .eq('is_approved', 'approved')
        .order('roll_no', { ascending: true });

      const { data: teachers } = await supabase.from('teachers').select('*').order('full_name');
      setPendingStudents(pending || []);
      setAllStudents(students || []);
      setAllTeachers(teachers || []);
      if (students) setClasses(['All', ...new Set(students.map(s => s.class_name))]);
    } catch (e) { toast.error("Database Sync Error"); } 
    finally { setLoading(false); }
  };

  const handleAction = async (action, table, idValue, payload = {}) => {
    if (action === 'delete' && !window.confirm("Confirm deletion?")) return;
    setLoading(true);
    let err;
    const pkColumn = table === 'students' ? 'student_id' : 'id';

    if (action === 'delete') ({ error: err } = await supabase.from(table).delete().eq(pkColumn, idValue));
    if (action === 'approve') ({ error: err } = await supabase.from('students').update({ is_approved: 'approved' }).eq('student_id', idValue));
    if (action === 'update') ({ error: err } = await supabase.from(table).update(payload).eq(pkColumn, idValue));
    
    if (!err) { 
      toast.success("Success!"); 
      fetchInitialData(); 
      setIsEditModalOpen(false); 
    } else { 
      toast.error(err.message); 
      setLoading(false); 
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await handleAction('update', 'students', editingStudent.student_id, { 
      full_name: editingStudent.full_name, 
      class_name: editingStudent.class_name,
      roll_no: editingStudent.roll_no,       // ✅ New field added
      father_name: editingStudent.father_name // ✅ New field added
    });
  };

  // ✅ Search Fixed: रोल नंबर और नाम दोनों से सर्च करें
  const filteredStudents = allStudents.filter(s => 
    (classFilter === 'All' || s.class_name === classFilter) &&
    (s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.roll_no?.toString().includes(searchTerm))
  );
  const filteredTeachers = allTeachers.filter(t => t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading && !counts.students) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-16 h-16 border-b-4 border-indigo-600 rounded-full mb-6" />
      <p className="text-gray-900 font-black uppercase tracking-[0.3em]">Initializing ASM Dashboard...</p>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVar} className="min-h-screen bg-[#fcfdfe] p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* --- HEADER --- */}
        <motion.div variants={itemVar} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-2xl flex flex-col gap-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="space-y-2">
               <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-xl text-white"><LayoutDashboard size={20}/></div>
                  <h1 className="text-5xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Admin Portal</h1>
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                  ASM Institutional Hub | {currentTime.toLocaleTimeString()}
               </p>
            </div>

            <div className="flex flex-wrap gap-3">
               <NavBtn label="Exam" icon={Zap} color="bg-gray-900" onClick={() => navigate('/admin/create-exam')} />
               <NavBtn label="Fees" icon={CreditCard} color="bg-rose-600" onClick={() => navigate('/admin/manage-fees')} />
               <NavBtn label="Docs" icon={Printer} color="bg-orange-600" onClick={() => navigate('/admin/documents')} />
               <NavBtn label="Results" icon={CheckCircle} color="bg-emerald-600" onClick={() => navigate('/admin/upload-result')} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
             <ActionCard icon={Wallet} label="Accounting" color="blue" onClick={() => navigate('/admin/manage-salaries')} />
             <ActionCard icon={FileStack} label="Docs Hub" color="orange" onClick={() => navigate('/admin/documents')} />
             <ActionCard icon={PieChart} label="Staff Pay" color="purple" onClick={() => navigate('/admin/teacher-salary')} />
             <ActionCard icon={Package} label="Inventory" color="amber" onClick={() => navigate('/admin/inventory')} />
             <ActionCard icon={ShieldAlert} label="Security" color="red" onClick={() => navigate('/admin/create-admin')} />
             <ActionCard icon={UserPlus} label="+ Student" color="indigo" onClick={() => navigate('/admin/add-student')} />
             <ActionCard icon={Plus} label="+ Teacher" color="emerald" onClick={() => navigate('/admin/add-teacher')} />
          </div>
        </motion.div>

        {/* --- KPI STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard icon={GraduationCap} title="Enrolled Students" value={counts.students} color="blue" subText="Live admission data" />
          <StatCard icon={Clock} title="Awaiting Approval" value={counts.pending} color="amber" subText="Action required" />
          <StatCard icon={Users} title="Academic Staff" value={counts.teachers} color="emerald" subText="Faculty management" />
        </div>

        {/* --- TABLES --- */}
        <motion.div variants={itemVar} className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 overflow-hidden min-h-[600px]">
          <div className="flex border-b border-gray-50 p-6 gap-6 bg-gray-50/30">
            {['overview', 'students', 'teachers'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-10 py-5 text-[11px] font-black uppercase tracking-[0.2em] rounded-[2rem] transition-all relative ${activeTab === tab ? 'bg-white text-indigo-600 shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="p-10">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingStudents.map(s => (
                      <div key={s.student_id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-6">
                        <div>
                           <h3 className="font-black text-gray-900 uppercase text-lg leading-tight">{s.full_name}</h3>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Class: {s.class_name}</p>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => handleAction('approve', 'students', s.student_id)} className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase">Approve</button>
                          <button onClick={() => handleAction('delete', 'students', s.student_id)} className="flex-1 bg-gray-50 text-gray-400 py-4 rounded-2xl text-[10px] font-black uppercase">Reject</button>
                        </div>
                      </div>
                    ))}
                    {pendingStudents.length === 0 && <div className="col-span-full py-20 text-center opacity-30 font-black uppercase italic">No Pending tasks</div>}
                </motion.div>
              )}

              {activeTab === 'students' && (
                <motion.div key="st" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-1 group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500" size={20} />
                      <input onChange={(e) => setSearchTerm(e.target.value)} type="text" placeholder="Search by name or roll number..." className="w-full pl-16 pr-8 py-5 bg-gray-50 border-none rounded-[2rem] font-bold text-gray-900 focus:ring-4 focus:ring-indigo-100" />
                    </div>
                    <select onChange={(e) => setClassFilter(e.target.value)} className="py-5 px-10 bg-gray-50 border-none rounded-[2rem] font-black text-[11px] uppercase tracking-widest cursor-pointer">
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="overflow-hidden rounded-[3rem] border border-gray-50">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50">
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <th className="p-8">Roll No</th>
                          <th className="p-8">Candidate Name</th>
                          <th className="p-8 text-center">Class</th>
                          <th className="p-8 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredStudents.map(s => (
                          <tr key={s.student_id} className="hover:bg-indigo-50/30 transition-all group">
                            <td className="p-8 font-black text-indigo-600 italic">#{s.roll_no}</td>
                            <td className="p-8 font-black text-gray-800 uppercase text-sm">{s.full_name}</td>
                            <td className="p-8 text-center"><span className="bg-white border px-6 py-2 rounded-full text-[10px] font-black">{s.class_name}</span></td>
                            <td className="p-8 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                              <ActionIconButton icon={Edit2} color="indigo" onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} />
                              <ActionIconButton icon={Users} color="blue" onClick={() => navigate(`/admin/student/${s.student_id}`)} />
                              <ActionIconButton icon={Trash2} color="red" onClick={() => handleAction('delete', 'students', s.student_id)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* --- EDIT MODAL --- */}
      <AnimatePresence>
        {isEditModalOpen && editingStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-lg rounded-[4rem] p-12 shadow-2xl">
              <h2 className="text-4xl font-black text-gray-900 uppercase italic mb-10 flex items-center gap-4 tracking-tighter">
                <Edit2 className="text-indigo-600" /> Edit Profile
              </h2>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Full Name</label>
                    <input type="text" value={editingStudent.full_name} onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})} className="w-full bg-gray-50 border-none rounded-[2rem] px-8 py-5 font-black text-gray-900 focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Father's Name</label>
                    <input type="text" value={editingStudent.father_name} onChange={(e) => setEditingStudent({...editingStudent, father_name: e.target.value})} className="w-full bg-gray-50 border-none rounded-[2rem] px-8 py-5 font-black text-gray-900 focus:ring-2 focus:ring-indigo-100" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Roll Number</label>
                    <input type="number" value={editingStudent.roll_no} onChange={(e) => setEditingStudent({...editingStudent, roll_no: e.target.value})} className="w-full bg-gray-50 border-none rounded-[2rem] px-8 py-5 font-black text-gray-900 focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Class Grade</label>
                    <select value={editingStudent.class_name} onChange={(e) => setEditingStudent({...editingStudent, class_name: e.target.value})} className="w-full bg-gray-50 border-none rounded-[2rem] px-8 py-5 font-black text-gray-900 uppercase cursor-pointer outline-none">
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 pt-6">
                  <button type="submit" className="flex-2 bg-indigo-600 text-white font-black py-5 px-10 rounded-[2rem] shadow-xl hover:bg-black transition-all uppercase tracking-widest text-[11px]">Save Updates</button>
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

export default AdminDashboard;
