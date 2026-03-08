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

const containerVar = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVar = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
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
      
      // ✅ छात्रों को Roll No के क्रम में फेच किया
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
    } catch (e) { 
      toast.error("डेटा सिंक करने में विफल!"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleAction = async (action, table, idValue, payload = {}) => {
    if (action === 'delete' && !window.confirm("क्या आप इसे हमेशा के लिए मिटाना चाहते हैं?")) return;
    setLoading(true);
    let err;

    // ✅ स्टूडेंट के लिए student_id और बाकी के लिए id का उपयोग
    const pkColumn = table === 'students' ? 'student_id' : 'id';

    if (action === 'delete') ({ error: err } = await supabase.from(table).delete().eq(pkColumn, idValue));
    if (action === 'approve') ({ error: err } = await supabase.from('students').update({ is_approved: 'approved' }).eq('student_id', idValue));
    if (action === 'update') ({ error: err } = await supabase.from(table).update(payload).eq(pkColumn, idValue));
    
    if (!err) { 
      toast.success("कार्य संपन्न हुआ!"); 
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
      roll_no: editingStudent.roll_no,
      father_name: editingStudent.father_name
    });
  };

  const filteredStudents = allStudents.filter(s => 
    (classFilter === 'All' || s.class_name === classFilter) &&
    (s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.roll_no?.toString().includes(searchTerm))
  );

  if (loading && !counts.students) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <RefreshCw className="animate-spin text-indigo-600 mb-4" size={48} />
      <p className="text-gray-400 font-black uppercase tracking-[0.3em]">ASM Portal Loading...</p>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVar} className="min-h-screen bg-[#fcfdfe] p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* --- SMART HEADER --- */}
        <motion.div variants={itemVar} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-2xl flex flex-col gap-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-xl text-white"><LayoutDashboard size={20}/></div>
                  <h1 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Admin Portal</h1>
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                  ASM Institutional Platform | {currentTime.toLocaleTimeString()}
               </p>
            </div>
            <div className="flex flex-wrap gap-3">
               <NavBtn label="Create Exam" icon={Zap} color="bg-gray-900" onClick={() => navigate('/admin/create-exam')} />
               <NavBtn label="Manage Fees" icon={CreditCard} color="bg-rose-600" onClick={() => navigate('/admin/manage-fees')} />
               <NavBtn label="Generate Docs" icon={Printer} color="bg-orange-600" onClick={() => navigate('/admin/documents')} />
            </div>
          </div>

          {/* --- ACTION GRID --- */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
             <ActionCard icon={Wallet} label="Accounting" onClick={() => navigate('/admin/manage-salaries')} />
             <ActionCard icon={FileStack} label="Docs Hub" onClick={() => navigate('/admin/documents')} />
             <ActionCard icon={PieChart} label="Staff Pay" onClick={() => navigate('/admin/teacher-salary')} />
             <ActionCard icon={Package} label="Inventory" onClick={() => navigate('/admin/inventory')} />
             <ActionCard icon={UserPlus} label="+ Student" onClick={() => navigate('/admin/add-student')} />
             <ActionCard icon={Plus} label="+ Teacher" onClick={() => navigate('/admin/add-teacher')} />
             <ActionCard icon={ShieldAlert} label="Security" onClick={() => navigate('/admin/create-admin')} />
          </div>
        </motion.div>

        {/* --- STATS KPI --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <KPI icon={GraduationCap} title="Total Students" value={counts.students} color="blue" />
          <KPI icon={Clock} title="Pending Approval" value={counts.pending} color="amber" />
          <KPI icon={Users} title="Active Staff" value={counts.teachers} color="emerald" />
        </div>

        {/* --- DATA TABS --- */}
        <motion.div variants={itemVar} className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 overflow-hidden min-h-[600px]">
          <div className="flex border-b p-6 gap-6 bg-gray-50/30">
            {['overview', 'students', 'teachers'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-10 py-4 text-[11px] font-black uppercase tracking-widest rounded-full transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-indigo-600'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {pendingStudents.map(s => (
                     <div key={s.student_id} className="bg-white p-6 rounded-[2.5rem] border shadow-xl flex flex-col justify-between h-48 group hover:border-amber-200 transition-all">
                        <div>
                           <h4 className="font-black uppercase text-gray-900 leading-tight">{s.full_name}</h4>
                           <p className="text-[10px] font-bold text-gray-400 italic mt-1">Class Grade: {s.class_name}</p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleAction('approve', 'students', s.student_id)} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-100">Approve</button>
                           <button onClick={() => handleAction('delete', 'students', s.student_id)} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-rose-50 hover:text-rose-500 transition-colors">Reject</button>
                        </div>
                     </div>
                   ))}
                </motion.div>
              )}

              {activeTab === 'students' && (
                <motion.div key="st" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input onChange={(e) => setSearchTerm(e.target.value)} type="text" placeholder="Roll No या नाम से खोजें..." className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-100" />
                    </div>
                    <select onChange={(e) => setClassFilter(e.target.value)} className="py-4 px-8 bg-gray-50 border-none rounded-2xl font-black text-[10px] uppercase outline-none">
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="overflow-x-auto rounded-[2.5rem] border border-gray-50 shadow-inner">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50">
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <th className="p-6">Roll No</th>
                          <th className="p-6">Name</th>
                          <th className="p-6 text-center">Class</th>
                          <th className="p-6 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredStudents.map(s => (
                          <tr key={s.student_id} className="hover:bg-indigo-50/20 group transition-all">
                            <td className="p-6 font-black text-indigo-600 italic leading-none">#{s.roll_no}</td>
                            <td className="p-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white border shadow-sm flex items-center justify-center text-[10px] font-black text-indigo-600">{s.full_name[0]}</div>
                                  <span className="font-black text-gray-800 uppercase text-xs">{s.full_name}</span>
                               </div>
                            </td>
                            <td className="p-6 text-center"><span className="bg-white border px-4 py-1 rounded-full text-[9px] font-black text-gray-500 uppercase">{s.class_name}</span></td>
                            <td className="p-6 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <IconButton icon={Edit2} onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} color="indigo" />
                              <IconButton icon={Users} onClick={() => navigate(`/admin/student/${s.student_id}`)} color="blue" />
                              <IconButton icon={Trash2} onClick={() => handleAction('delete', 'students', s.student_id)} color="red" />
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

      {/* --- RE-DEVELOPED EDIT MODAL --- */}
      <AnimatePresence>
        {isEditModalOpen && editingStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl relative">
              <h2 className="text-3xl font-black uppercase italic mb-8 flex items-center gap-3 tracking-tighter">
                <Edit2 className="text-indigo-600" /> Update Profile
              </h2>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Full Name" value={editingStudent.full_name} onChange={(v) => setEditingStudent({...editingStudent, full_name: v})} />
                  <Input label="Father's Name" value={editingStudent.father_name} onChange={(v) => setEditingStudent({...editingStudent, father_name: v})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Roll Number" type="number" value={editingStudent.roll_no} onChange={(v) => setEditingStudent({...editingStudent, roll_no: v})} />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4 italic">Class Grade</label>
                    <select value={editingStudent.class_name} onChange={(e) => setEditingStudent({...editingStudent, class_name: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-6 py-4 font-black uppercase outline-none focus:ring-2 focus:ring-indigo-100 appearance-none">
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 pt-6">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-200 hover:bg-black transition-all">Update Database</button>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-8 bg-gray-50 text-gray-400 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- HELPER COMPONENTS ---

const KPI = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-xl flex justify-between items-center group hover:border-indigo-100 transition-all">
    <div>
      <p className="text-gray-400 text-[10px] font-black uppercase mb-1 tracking-widest">{title}</p>
      <h3 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{value}</h3>
    </div>
    <div className={`p-4 rounded-2xl ${color === 'blue' ? 'bg-blue-50 text-blue-600' : color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
      <Icon size={28}/>
    </div>
  </div>
);

const NavBtn = ({ label, icon: Icon, color, onClick }) => (
  <motion.button whileHover={{ scale: 1.05 }} onClick={onClick} className={`flex items-center gap-3 ${color} text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase italic shadow-2xl tracking-widest`}>
    <Icon size={16}/> {label}
  </motion.button>
);

const ActionCard = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-3 p-5 bg-gray-50/50 rounded-[2.5rem] hover:bg-indigo-600 group transition-all border border-transparent hover:border-indigo-100">
    <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:bg-white/20 group-hover:text-white transition-all">
       <Icon size={24}/>
    </div>
    <span className="text-[8px] font-black uppercase tracking-tighter group-hover:text-white leading-tight text-center">{label}</span>
  </button>
);

const IconButton = ({ icon: Icon, onClick, color }) => (
  <button onClick={onClick} className={`p-3.5 rounded-xl ${color === 'indigo' ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600' : color === 'blue' ? 'bg-blue-50 text-blue-600 hover:bg-blue-600' : 'bg-red-50 text-red-600 hover:bg-red-600'} hover:text-white hover:scale-110 transition-all shadow-sm`}>
    <Icon size={18}/>
  </button>
);

const Input = ({ label, value, onChange, type="text" }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4 italic">{label}</label>
    <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
  </div>
);

export default AdminDashboard;
        
