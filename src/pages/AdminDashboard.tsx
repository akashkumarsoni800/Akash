import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, GraduationCap, Clock, Plus, Search, 
  FileText, Trash2, Edit2, CheckCircle, XCircle, ChevronDown
} from 'lucide-react';

// --- Animation Variants ---
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
      if (students) setClasses(['All', ...new Set(students.map((s) => s.class_name))]);
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

  const filteredStudents = allStudents.filter(s => 
    (classFilter === 'All' || s.class_name === classFilter) &&
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !counts.students) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
       <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="rounded-full h-12 w-12 border-t-4 border-indigo-600 mb-4"></motion.div>
       <p className="text-indigo-900 font-bold tracking-widest animate-pulse">OPTIMIZING ASSETS...</p>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVar} className="min-h-screen bg-[#f8fafc] p-6 pb-20 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <motion.div variants={itemVar} className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Admin Dashboard</h1>
            <p className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-widest">ASM v3.0 • Management System</p>
          </div>
          <div className="flex flex-wrap gap-3">
             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/admin/create-exam')} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-indigo-100 italic transition-all">
               <FileText size={16}/> CREATE EXAM
             </motion.button>
             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/admin/upload-result')} className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-emerald-100 italic transition-all">
               <CheckCircle size={16}/> UPLOAD RESULT
             </motion.button>
          </div>
        </motion.div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={GraduationCap} title="Active Students" value={counts.students} color="blue" subText="Enrolled & Active" />
          <StatCard icon={Clock} title="Admission Waitlist" value={counts.pending} color="amber" subText="Needs Verification" />
          <StatCard icon={Users} title="Academic Staff" value={counts.teachers} color="emerald" subText="On-duty Faculty" />
        </div>

        {/* Main Content Area */}
        <motion.div variants={itemVar} className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
          <div className="flex border-b border-gray-100 p-4 gap-4 overflow-x-auto bg-gray-50/50">
            {['overview', 'students', 'teachers'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative rounded-2xl ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {tab}
                {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />}
              </button>
            ))}
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="ov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2 tracking-tighter uppercase italic underline decoration-amber-300 decoration-4">Pending Approvals</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingStudents.length > 0 ? pendingStudents.map(s => (
                      <motion.div key={s.id} layout initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col gap-4 group transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-black text-gray-800 uppercase text-sm">{s.full_name}</h3>
                            <span className="text-[10px] font-black text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-200 mt-1 inline-block uppercase">CLASS: {s.class_name}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleAction('approve', 'students', s.id)} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-100">APPROVE</motion.button>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleAction('delete', 'students', s.id)} className="flex-1 bg-white border border-gray-200 text-gray-500 py-3 rounded-xl text-[10px] font-black uppercase">REJECT</motion.button>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="col-span-full py-20 text-center text-gray-400 font-bold uppercase tracking-widest">Inbox Zero • No Pending Admissions</div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'students' && (
                <motion.div key="st" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 p-4 rounded-3xl">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input onChange={(e) => setSearchTerm(e.target.value)} type="text" placeholder="Filter by name..." className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <select onChange={(e) => setClassFilter(e.target.value)} className="w-full md:w-auto py-4 px-6 bg-white border-none rounded-2xl font-black text-xs text-gray-600 cursor-pointer uppercase tracking-widest">
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="overflow-hidden rounded-[2rem] border border-gray-100">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Identity</th>
                          <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Grade/Class</th>
                          <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Control</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredStudents.map(s => (
                          <motion.tr key={s.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-indigo-50/20 transition-all group">
                            <td className="p-5 font-black text-gray-800 text-sm">{s.full_name.toUpperCase()}</td>
                            <td className="p-5 text-center"><span className="bg-indigo-50 text-indigo-700 px-4 py-1 rounded-full text-[10px] font-black uppercase">{s.class_name}</span></td>
                            <td className="p-5 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} className="p-3 bg-white border border-gray-200 rounded-xl text-indigo-600 hover:scale-110 transition-transform"><Edit2 size={16}/></button>
                              <button onClick={() => handleAction('delete', 'students', s.id)} className="p-3 bg-white border border-gray-200 rounded-xl text-red-500 hover:scale-110 transition-transform"><Trash2 size={16}/></button>
                            </td>
                          </motion.tr>
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

      {/* MODALS WITH SCALE ANIMATION */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
              <h2 className="text-3xl font-black text-gray-900 uppercase italic mb-8">Update Student</h2>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
                  <input type="text" value={editingStudent.full_name} onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Assigned Class</label>
                  <select value={editingStudent.class_name} onChange={(e) => setEditingStudent({...editingStudent, class_name: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 mt-1 uppercase">
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-indigo-100">SAVE DATA</button>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl uppercase tracking-widest text-xs">CANCEL</button>
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
