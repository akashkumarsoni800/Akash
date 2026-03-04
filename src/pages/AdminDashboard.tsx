import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, GraduationCap, Clock, Plus, Search, 
  FileText, Trash2, Edit2, CheckCircle, CreditCard,
  Wallet, PieChart, Package, ShieldAlert, UserPlus, Settings,
  Printer, FileCheck
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
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <motion.div 
      variants={itemVar}
      whileHover={{ y: -5, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      className={`relative overflow-hidden bg-white rounded-3xl p-6 border ${colorStyles[color]?.split(' ')[2] || 'border-gray-100'} shadow-sm transition-all duration-300`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-3xl font-black text-gray-800 tracking-tight">{value}</h3>
          {subText && <p className="text-xs text-gray-400 mt-2 font-medium">{subText}</p>}
        </div>
        <div className={`p-4 rounded-2xl ${colorStyles[color]}`}>
          <Icon size={24} />
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
  const [isTeacherEditModalOpen, setIsTeacherEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  useEffect(() => { fetchInitialData(); }, []);

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
    } catch (e) { toast.error("Sync Error"); } 
    finally { setLoading(false); }
  };

  const handleAction = async (action, table, id, payload = {}) => {
    if (action === 'delete' && !window.confirm("Permanent Delete?")) return;
    setLoading(true);
    let err;
    if (action === 'delete') ({ error: err } = await supabase.from(table).delete().eq('id', id));
    if (action === 'approve') ({ error: err } = await supabase.from('students').update({ is_approved: 'approved' }).eq('id', id));
    if (action === 'update') ({ error: err } = await supabase.from(table).update(payload).eq('id', id));
    if (!err) { toast.success("Success!"); fetchInitialData(); setIsEditModalOpen(false); setIsTeacherEditModalOpen(false); }
    else { toast.error(err.message); setLoading(false); }
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
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mb-4" />
      <p className="text-indigo-900 font-bold animate-pulse uppercase tracking-widest">Loading Dashboard...</p>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVar} className="min-h-screen bg-[#f8fafc] p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- DYNAMIC HEADER WITH QUICK ACTIONS --- */}
        <motion.div variants={itemVar} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-5xl font-black text-gray-900 uppercase italic leading-none">Admin Panel</h1>
              <p className="text-sm font-black text-gray-400 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
                <Settings size={14} className="animate-spin-slow" /> ASM v3.0 • Bharat Life
              </p>
            </div>
            {/* Main Feature Buttons */}
            <div className="flex flex-wrap gap-3">
               <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/admin/create-exam')} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-2xl text-xs font-black shadow-lg italic transition-all"><FileText size={18}/> EXAM</motion.button>
               <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/admin/manage-fees')} className="flex items-center gap-2 bg-rose-500 text-white px-6 py-4 rounded-2xl text-xs font-black shadow-lg italic transition-all"><CreditCard size={18}/> FEES</motion.button>
               <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/admin/documents')} className="flex items-center gap-2 bg-orange-600 text-white px-6 py-4 rounded-2xl text-xs font-black shadow-lg italic transition-all"><Printer size={18}/> DOCUMENTS</motion.button>
               <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/admin/upload-result')} className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-4 rounded-2xl text-xs font-black shadow-lg italic transition-all"><CheckCircle size={18}/> RESULTS</motion.button>
            </div>
          </div>

          <hr className="border-gray-50" />

          {/* --- NEW FILE & FEATURE BUTTONS --- */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
             <button onClick={() => navigate('/admin/manage-salaries')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-3xl hover:bg-blue-50 hover:text-blue-600 transition-all group">
                <Wallet className="group-hover:scale-110 transition-transform" size={24} />
                <span className="text-[10px] font-black uppercase italic">Accounting</span>
             </button>
             <button onClick={() => navigate('/admin/teacher-salary')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-3xl hover:bg-purple-50 hover:text-purple-600 transition-all group">
                <PieChart className="group-hover:scale-110 transition-transform" size={24} />
                <span className="text-[10px] font-black uppercase italic">Staff Salary</span>
             </button>
             <button onClick={() => navigate('/admin/inventory')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-3xl hover:bg-orange-50 hover:text-orange-600 transition-all group">
                <Package className="group-hover:scale-110 transition-transform" size={24} />
                <span className="text-[10px] font-black uppercase italic">Inventory</span>
             </button>
             <button onClick={() => navigate('/admin/create-admin')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-3xl hover:bg-red-50 hover:text-red-600 transition-all group">
                <ShieldAlert className="group-hover:scale-110 transition-transform" size={24} />
                <span className="text-[10px] font-black uppercase italic">Admin Access</span>
             </button>
             <button onClick={() => navigate('/admin/add-student')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-3xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                <UserPlus className="group-hover:scale-110 transition-transform" size={24} />
                <span className="text-[10px] font-black uppercase italic">+ Student</span>
             </button>
             <button onClick={() => navigate('/admin/add-teacher')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-3xl hover:bg-emerald-50 hover:text-emerald-600 transition-all group">
                <Plus className="group-hover:scale-110 transition-transform" size={24} />
                <span className="text-[10px] font-black uppercase italic">+ Teacher</span>
             </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={GraduationCap} title="Active Students" value={counts.students} color="blue" subText="Enrolled" />
          <StatCard icon={Clock} title="Pending Approval" value={counts.pending} color="amber" subText="Needs Attention" />
          <StatCard icon={Users} title="Total Staff" value={counts.teachers} color="emerald" subText="Faculty" />
        </div>

        {/* --- MAIN CONTENT TABS --- */}
        <motion.div variants={itemVar} className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
          <div className="flex border-b border-gray-100 p-4 gap-4 bg-gray-50/50">
            {['overview', 'students', 'teachers'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all relative ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>
                {tab}
                {activeTab === tab && <motion.div layoutId="tab" className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
              </button>
            ))}
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="ov" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <h2 className="text-xl font-black text-gray-900 mb-6 uppercase italic flex items-center gap-2">
                    <Clock size={20} className="text-amber-500" /> Pending Admissions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingStudents.length > 0 ? pendingStudents.map(s => (
                      <motion.div key={s.id} layout className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                        <h3 className="font-bold text-gray-900 uppercase">{s.full_name} <br/><span className="text-[10px] text-gray-400 tracking-widest uppercase">CLASS: {s.class_name}</span></h3>
                        <div className="flex gap-2">
                          <button onClick={() => handleAction('approve', 'students', s.id)} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl text-[10px] font-black tracking-widest uppercase">APPROVE</button>
                          <button onClick={() => handleAction('delete', 'students', s.id)} className="flex-1 bg-white border border-gray-200 text-gray-400 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase hover:text-red-500 hover:border-red-100">REJECT</button>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="col-span-full py-20 text-center space-y-3">
                         <div className="text-4xl">🎉</div>
                         <p className="text-gray-400 font-bold uppercase tracking-widest">No Pending Admissions</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'students' && (
                <motion.div key="st" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input onChange={(e) => setSearchTerm(e.target.value)} type="text" placeholder="Search students by name..." className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                    <select onChange={(e) => setClassFilter(e.target.value)} className="py-4 px-8 bg-gray-50 border-none rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer outline-none">
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="overflow-hidden rounded-[2.5rem] border border-gray-50">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Name</th>
                          <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Class</th>
                          <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredStudents.map(s => (
                          <tr key={s.id} className="hover:bg-indigo-50/30 transition-all group">
                            <td className="p-6 font-black text-gray-800 uppercase text-sm">{s.full_name}</td>
                            <td className="p-6 text-center">
                              <span className="bg-indigo-50 text-indigo-700 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                {s.class_name}
                              </span>
                            </td>
                            <td className="p-6 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} className="p-3 bg-white border border-gray-100 rounded-xl text-indigo-600 shadow-sm hover:shadow-md"><Edit2 size={16}/></button>
                              <button onClick={() => navigate(`/admin/student/${s.id}`)} className="p-3 bg-white border border-gray-100 rounded-xl text-blue-600 shadow-sm hover:shadow-md"><Users size={16}/></button>
                              <button onClick={() => handleAction('delete', 'students', s.id)} className="p-3 bg-white border border-gray-100 rounded-xl text-red-500 shadow-sm hover:shadow-md"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'teachers' && (
                <motion.div key="tch" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeachers.map(t => (
                      <div key={t.id} className="bg-white border border-gray-100 p-8 rounded-[2.5rem] hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setEditingTeacher(t); setIsTeacherEditModalOpen(true); }} className="p-2 text-gray-400 hover:text-emerald-600 bg-gray-50 rounded-lg"><Edit2 size={14}/></button>
                            <button onClick={() => handleAction('delete', 'teachers', t.id)} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg"><Trash2 size={14}/></button>
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                          <div className="h-16 w-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 text-xl font-black shadow-inner">
                            {t.full_name[0]}
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 text-lg uppercase leading-tight">{t.full_name}</h3>
                            <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest italic">{t.subject || 'Faculty'}</p>
                          </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-gray-50">
                          <p className="text-xs text-gray-500 font-bold flex items-center gap-2 italic">📞 {t.contact_number || 'N/A'}</p>
                          <p className="text-xs text-gray-500 font-bold flex items-center gap-2 italic">📧 {t.email || 'No email'}</p>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
              <h2 className="text-3xl font-black text-gray-900 uppercase italic mb-8 flex items-center gap-3">
                <Edit2 className="text-indigo-600" /> Edit Student
              </h2>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Full Name</label>
                  <input type="text" value={editingStudent.full_name} onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold mt-1 outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Class Name</label>
                  <select value={editingStudent.class_name} onChange={(e) => setEditingStudent({...editingStudent, class_name: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold uppercase mt-1 outline-none">
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">SAVE CHANGES</button>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">CANCEL</button>
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
