import React, { useState, useEffect, useRef } from 'react'; // useRef यहाँ जोड़ें
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from "react-webcam"; // ✅ इसे जरूर जोड़ें (Webcam के लिए)
import { 
  Users, GraduationCap, Clock, Plus, Search, 
  Trash2, Edit2, CheckCircle, CreditCard,
  Wallet, PieChart, Package, ShieldAlert, UserPlus,
  Printer, LayoutDashboard, Zap, Activity, FileStack, Settings,
  Upload, Camera // ✅ इन दोनों को जोड़ें
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
  
  // ✅ Camera & Photo States
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef<any>(null);

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
      const { data: students } = await supabase.from('students').select('*').eq('is_approved', 'approved').order('roll_no', { ascending: true });
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
      toast.success("Done!"); 
      fetchInitialData(); 
      setIsEditModalOpen(false); 
    } else { 
      toast.error(err.message); 
      setLoading(false); 
    }
  };

  // ✅ Fixed handleUpdate with Photo Upload
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
        full_name: editingStudent.full_name, 
        class_name: editingStudent.class_name,
        roll_no: editingStudent.roll_no,
        father_name: editingStudent.father_name,
        photo_url: photoUrl
      });
      setNewPhotoFile(null);
      setNewPhotoPreview(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Photo Handlers
  const capturePhoto = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    const blob = await fetch(imageSrc).then((res) => res.blob());
    const file = new File([blob], "edit-photo.jpg", { type: "image/jpeg" });
    setNewPhotoFile(file);
    setNewPhotoPreview(imageSrc);
    setShowWebcam(false);
  };

  const filteredStudents = allStudents.filter(s => 
    (classFilter === 'All' || s.class_name === classFilter) &&
    (s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.roll_no?.toString().includes(searchTerm))
  );

  if (loading && !counts.students) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVar} className="min-h-screen bg-[#fcfdfe] p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* --- HEADER --- */}
        <motion.div variants={itemVar} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-2xl flex flex-col gap-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="space-y-2">
               <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-xl text-white"><LayoutDashboard size={20}/></div>
                  <h1 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Admin Portal</h1>
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                  ASM Institutional Hub | {currentTime.toLocaleTimeString()}
               </p>
            </div>
            <div className="flex flex-wrap gap-3">
               <NavBtn label="Fees" icon={CreditCard} color="bg-rose-600" onClick={() => navigate('/admin/manage-fees')} />
               <NavBtn label="Docs" icon={Printer} color="bg-orange-600" onClick={() => navigate('/admin/documents')} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
             <ActionCard icon={Wallet} label="Accounting" color="blue" onClick={() => navigate('/admin/manage-salaries')} />
             <ActionCard icon={UserPlus} label="+ Student" color="indigo" onClick={() => navigate('/admin/add-student')} />
             <ActionCard icon={Plus} label="+ Teacher" color="emerald" onClick={() => navigate('/admin/add-teacher')} />
          </div>
        </motion.div>

        {/* --- KPI STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard icon={GraduationCap} title="Enrolled Students" value={counts.students} color="blue" />
          <StatCard icon={Clock} title="Awaiting Approval" value={counts.pending} color="amber" />
          <StatCard icon={Users} title="Academic Staff" value={counts.teachers} color="emerald" />
        </div>

        {/* --- TABS & TABLE --- */}
        <motion.div variants={itemVar} className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 overflow-hidden min-h-[600px]">
          <div className="flex border-b p-6 gap-6 bg-gray-50/30">
            {['overview', 'students'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-10 py-4 text-[11px] font-black uppercase tracking-widest rounded-full transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'students' && (
              <div className="space-y-6">
                <input onChange={(e) => setSearchTerm(e.target.value)} type="text" placeholder="Search..." className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none" />
                <div className="overflow-x-auto rounded-[2.5rem] border shadow-inner">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-gray-50">
                      {filteredStudents.map(s => (
                        <tr key={s.student_id} className="hover:bg-indigo-50/20 group transition-all">
                          <td className="p-6 font-black text-gray-800 uppercase text-xs">{s.full_name}</td>
                          <td className="p-6 flex justify-end gap-2">
                            <ActionIconButton icon={Edit2} color="indigo" onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} />
                            <ActionIconButton icon={Trash2} color="red" onClick={() => handleAction('delete', 'students', s.student_id)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* --- EDIT MODAL --- */}
      <AnimatePresence>
        {isEditModalOpen && editingStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-3xl font-black uppercase italic mb-8 flex items-center gap-3"><Edit2 className="text-indigo-600" /> Edit Profile</h2>
              
              <form onSubmit={handleUpdate} className="space-y-6">
                {/* 📸 PHOTO SECTION */}
                <div className="flex flex-col items-center gap-4 bg-gray-50 p-6 rounded-[2.5rem] border">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg relative group">
                    <img src={newPhotoPreview || editingStudent.photo_url || "/default-avatar.png"} className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                      <Upload className="text-white" size={20} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setNewPhotoFile(e.target.files[0]);
                          setNewPhotoPreview(URL.createObjectURL(e.target.files[0]));
                        }
                      }} />
                    </label>
                  </div>
                  <button type="button" onClick={() => setShowWebcam(true)} className="text-[10px] font-black uppercase tracking-widest bg-white border px-4 py-2 rounded-xl flex items-center gap-2"><Camera size={14}/> Live Camera</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-4">Full Name</label>
                    <input type="text" value={editingStudent.full_name} onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-6 py-4 font-black outline-none focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-4">Father Name</label>
                    <input type="text" value={editingStudent.father_name} onChange={(e) => setEditingStudent({...editingStudent, father_name: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-6 py-4 font-black outline-none focus:ring-2 focus:ring-indigo-100" />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">Save updates</button>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-8 bg-gray-100 text-gray-400 font-black py-4 rounded-2xl uppercase text-[10px]">Close</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📸 WEBCAM POPUP */}
      <AnimatePresence>
        {showWebcam && (
          <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center justify-center p-6">
            <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="rounded-[3rem] border-4 border-white shadow-2xl max-w-sm w-full" />
            <div className="flex gap-4 mt-8">
              <button onClick={capturePhoto} className="bg-emerald-500 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl">Capture</button>
              <button onClick={() => setShowWebcam(false)} className="bg-red-500 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest">Close</button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;
                                                                                             
