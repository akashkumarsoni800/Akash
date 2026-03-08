import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from "react-webcam";
import { 
  Users, GraduationCap, Clock, Plus, Search, 
  Trash2, Edit2, CheckCircle, CreditCard,
  Wallet, PieChart, Package, ShieldAlert, UserPlus,
  Printer, LayoutDashboard, Zap, Activity, FileStack, Settings,
  Upload, Camera
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
    <motion.div variants={itemVar} whileHover={{ y: -8 }} className={`relative overflow-hidden bg-white rounded-[2.5rem] p-8 border ${colorStyles[color]?.split(' ')[2] || 'border-gray-100'} shadow-xl transition-all`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</p>
          <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{value}</h3>
          {subText && <p className="text-[10px] text-gray-500 font-bold uppercase mt-3 italic">{subText}</p>}
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
  
  // Photo States
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef<any>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user"); 

  const [counts, setCounts] = useState({ students: 0, teachers: 0, pending: 0 });
  const [pendingStudents, setPendingStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
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
    } catch (e) { toast.error("Database Error"); } 
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
    } catch (err: any) { toast.error(err.message); } 
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
    <motion.div initial="hidden" animate="visible" variants={containerVar} className="min-h-screen bg-[#fcfdfe] p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* --- HEADER & TOP ACTIONS --- */}
        <motion.div variants={itemVar} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-2xl flex flex-col gap-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="space-y-2">
               <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-xl text-white"><LayoutDashboard size={20}/></div>
                  <h1 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Admin Portal</h1>
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{currentTime.toLocaleTimeString()}</p>
            </div>
            <div className="flex flex-wrap gap-3">
               <button onClick={() => navigate('/admin/create-exam')} className="bg-gray-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 italic"><Zap size={14}/> Exam</button>
               <button onClick={() => navigate('/admin/manage-fees')} className="bg-rose-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 italic"><CreditCard size={14}/> Fees</button>
               <button onClick={() => navigate('/admin/documents')} className="bg-orange-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 italic"><Printer size={14}/> Documents</button>
               <button onClick={() => navigate('/admin/upload-result')} className="bg-emerald-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 italic"><CheckCircle size={14}/> Results</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
             <ActionCard icon={Wallet} label="Accounting" color="blue" onClick={() => navigate('/admin/manage-salaries')} />
             <ActionCard icon={FileStack} label="Docs Hub" color="orange" onClick={() => navigate('/admin/documents')} />
             <ActionCard icon={PieChart} label="Staff Pay" color="purple" onClick={() => navigate('/admin/teacher-salary')} />
             <ActionCard icon={Package} label="Inventory" color="amber" onClick={() => navigate('/admin/inventory')} />
             <ActionCard icon={ShieldAlert} label="Security" color="red" onClick={() => navigate('/admin/create-admin')} />
             <ActionCard icon={UserPlus} label="New Student" color="indigo" onClick={() => navigate('/admin/add-student')} />
             <ActionCard icon={Plus} label="New Teacher" color="emerald" onClick={() => navigate('/admin/add-teacher')} />
          </div>
        </motion.div>

        {/* --- STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard icon={GraduationCap} title="Enrolled Students" value={counts.students} color="blue" subText="Live admission data" />
          <StatCard icon={Clock} title="Awaiting Approval" value={counts.pending} color="amber" subText="Action required" />
          <StatCard icon={Users} title="Academic Staff" value={counts.teachers} color="emerald" subText="Faculty management" />
        </div>

        {/* --- TABLES SECTION --- */}
        <motion.div variants={itemVar} className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 overflow-hidden">
          <div className="flex border-b p-6 gap-6 bg-gray-50/30">
            {['overview', 'students', 'teachers'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-10 py-5 text-[11px] font-black uppercase tracking-[0.2em] rounded-[2rem] transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}>{tab}</button>
            ))}
          </div>

          <div className="p-10">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pendingStudents.map(s => (
                      <div key={s.student_id} className="bg-white p-8 rounded-[2.5rem] border shadow-xl flex flex-col justify-between h-48">
                        <div><h4 className="font-black text-gray-900 uppercase">{s.full_name}</h4><p className="text-[10px] font-bold text-gray-400 italic">Class: {s.class_name}</p></div>
                        <div className="flex gap-2">
                           <button onClick={() => handleAction('approve', 'students', s.student_id)} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl text-[10px] font-black uppercase">Approve</button>
                           <button onClick={() => handleAction('delete', 'students', s.student_id)} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-xl text-[10px] font-black uppercase">Reject</button>
                        </div>
                      </div>
                    ))}
                    {pendingStudents.length === 0 && <div className="col-span-full py-20 text-center opacity-30 font-black uppercase italic">No Pending tasks</div>}
                </motion.div>
              )}

              {activeTab === 'students' && (
                <motion.div key="st" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input onChange={(e) => setSearchTerm(e.target.value)} type="text" placeholder="Roll No या नाम से खोजें..." className="w-full pl-16 pr-8 py-5 bg-gray-50 border-none rounded-[2rem] font-bold" />
                    </div>
                    <select onChange={(e) => setClassFilter(e.target.value)} className="py-5 px-10 bg-gray-50 border-none rounded-[2rem] font-black text-[11px] uppercase outline-none">{classes.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                  <div className="overflow-x-auto rounded-[2.5rem] border shadow-inner">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50"><tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="p-6">Roll</th><th className="p-6">Name</th><th className="p-6 text-center">Class</th><th className="p-6 text-right">Action</th></tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredStudents.map(s => (
                          <tr key={s.student_id} className="hover:bg-indigo-50/20 group transition-all">
                            <td className="p-6 font-black text-indigo-600 italic">#{s.roll_no}</td>
                            <td className="p-6 font-black text-gray-800 uppercase text-xs">{s.full_name}</td>
                            <td className="p-6 text-center"><span className="bg-white border px-4 py-1 rounded-full text-[9px] font-black">{s.class_name}</span></td>
                            <td className="p-6 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                               <button onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Edit2 size={16}/></button>
                               <button onClick={() => navigate(`/admin/student/${s.student_id}`)} className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={16}/></button>
                               <button onClick={() => handleAction('delete', 'students', s.student_id)} className="p-3 bg-red-50 text-red-600 rounded-xl"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'teachers' && (
                <motion.div key="tch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {allTeachers.map(t => (
                    <div key={t.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl relative group">
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">{t.full_name?.[0]}</div>
                          <button onClick={() => handleAction('delete', 'teachers', t.id)} className="text-gray-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                       </div>
                       <h3 className="font-black uppercase text-gray-900 leading-tight">{t.full_name}</h3>
                       <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1 italic">{t.subject || 'Staff Member'}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* --- EDIT MODAL --- */}
      <AnimatePresence>
        {isEditModalOpen && editingStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-3xl font-black uppercase italic mb-8 flex items-center gap-3"><Edit2 className="text-indigo-600" /> Edit Profile</h2>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="flex flex-col items-center gap-4 bg-gray-50 p-6 rounded-[2.5rem] border">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg relative group">
                    <img src={newPhotoPreview || editingStudent.photo_url || "/default-avatar.png"} className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                      <Upload className="text-white" size={20} /><input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { setNewPhotoFile(e.target.files[0]); setNewPhotoPreview(URL.createObjectURL(e.target.files[0])); } }} />
                    </label>
                  </div>
                  <button type="button" onClick={() => setShowWebcam(true)} className="text-[10px] font-black uppercase bg-white border px-4 py-2 rounded-xl flex items-center gap-2"><Camera size={14}/> Live Photo</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-4">Full Name</label><input type="text" value={editingStudent.full_name} onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-6 py-4 font-black outline-none" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-4">Father Name</label><input type="text" value={editingStudent.father_name} onChange={(e) => setEditingStudent({...editingStudent, father_name: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-6 py-4 font-black outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-4">Roll No</label><input type="number" value={editingStudent.roll_no} onChange={(e) => setEditingStudent({...editingStudent, roll_no: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-6 py-4 font-black outline-none" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-4">Class</label><select value={editingStudent.class_name} onChange={(e) => setEditingStudent({...editingStudent, class_name: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black outline-none">{classes.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div className="flex gap-4 pt-4"><button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase text-[10px] shadow-xl">Update</button><button type="button" onClick={() => setIsEditModalOpen(false)} className="px-8 bg-gray-100 text-gray-400 font-black py-4 rounded-2xl uppercase text-[10px]">Close</button></div>
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
       

{/* कैमरा स्विच करने वाला बटन */}
<button type="button" onClick={toggleCamera} className="...">
  <FlipHorizontal size={24} />
</button>
        </div>
      )}
    </motion.div>
  );
};

export default AdminDashboard;
