import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

//import GallerySlider from '../components/GallerySlider'; // ✅ यह लाइन जोड़ना सबसे ज़रूरी है
// --- UI Components ---
const StatCard = ({ icon, title, value, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center space-x-4 border border-gray-100">
      <div className={`${colors[color]} p-4 rounded-xl text-2xl`}>{icon}</div>
      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-gray-800">{value}</p>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [counts, setCounts] = useState({ students: 0, teachers: 0, pending: 0 });
  const [pendingStudents, setPendingStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  
  // Filter & Edit States
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [isTeacherEditModalOpen, setIsTeacherEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [stdCountRes, tchCountRes, penCountRes] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_approved', 'approved'),
      supabase.from('teachers').select('*', { count: 'exact', head: true }),
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_approved', 'pending')
    ]);
      setCounts({ students: stdCount || 0, teachers: tchCount || 0, pending: penCount || 0 });

      const { data: pending } = await supabase.from('students').select('*').eq('is_approved', 'pending');
      setPendingStudents(pending || []);

      const { data: students } = await supabase.from('students').select('*').eq('is_approved', 'approved').order('full_name');
      setAllStudents(students || []);
      if (students) setClasses(['All', ...new Set(students.map(s => s.class_name))]);

      const { data: teachers } = await supabase.from('teachers').select('*').order('full_name');
      setAllTeachers(teachers || []);

    } catch (error) { toast.error("Data fetch failed"); }
    finally { setLoading(false); }
  };

  const handleRemove = async (table, id) => {
    if (window.confirm("Confirm: Delete this record?")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) { toast.success("Deleted!"); fetchInitialData(); }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.from('students').update({
        full_name: editingStudent.full_name,
        class_name: editingStudent.class_name,
      }).eq('id', editingStudent.id);
      if (error) throw error;
      toast.success("Student updated!");
      setIsEditModalOpen(false);
      fetchInitialData();
    } catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const handleTeacherUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.from('teachers').update({
        full_name: editingTeacher.full_name,
        subject: editingTeacher.subject,
        phone: editingTeacher.phone,
      }).eq('id', editingTeacher.id);
      if (error) throw error;
      toast.success("Teacher updated!");
      setIsTeacherEditModalOpen(false);
      fetchInitialData();
    } catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const filteredStudents = classFilter === 'All' ? allStudents : allStudents.filter(s => s.class_name === classFilter);

  if (loading && !isEditModalOpen && !isTeacherEditModalOpen) return <div className="h-screen flex items-center justify-center font-bold">ASM Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10 notranslate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Admin Control</h1>
            <p className="text-sm font-bold text-gray-400">Manage your school efficiently</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/admin/create-exam')} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg">📝 CREATE EXAM</button>
            <button onClick={() => navigate('/admin/add-event')} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg">📢 ADD EVENT</button>
            <button onClick={() => navigate('/admin/manage-fees')} className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg">💰 MANAGE FEES</button>
          </div>
        </div>
        {/* 2. SLIDESHOW SECTION (Middle - Exactly where you want) */}
      <div className="mb-8">
        <GallerySlider /> 
      </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon="🎓" title="Approved Students" value={counts.students} color="blue" />
          <StatCard icon="⌛" title="Pending Admissions" value={counts.pending} color="yellow" />
          <StatCard icon="👨‍🏫" title="Total Teachers" value={counts.teachers} color="green" />
        </div>

        {/* Tabs */}
        <div className="flex space-x-6 border-b border-gray-200 mb-8">
          {['overview', 'students', 'teachers'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'border-b-4 border-blue-900 text-blue-900' : 'text-gray-400 hover:text-gray-600'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Content: Overview */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b bg-orange-50/50 flex justify-between items-center">
               <h3 className="font-black text-gray-800 text-sm uppercase">Pending Approvals</h3>
               <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">{pendingStudents.length} Requests</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                  <tr><th className="p-4">Name</th><th className="p-4">Class</th><th className="p-4">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingStudents.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-gray-800">{s.full_name}</td>
                      <td className="p-4 text-xs font-bold text-blue-600 uppercase">{s.class_name}</td>
                      <td className="p-4">
                        <button onClick={async () => { await supabase.from('students').update({ is_approved: 'approved' }).eq('id', s.id); fetchInitialData(); toast.success("Approved!"); }} className="bg-green-600 text-white text-[10px] font-black px-4 py-2 rounded-lg">Approve Now</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Content: Students */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-4">
                 <h3 className="font-black text-gray-800 text-sm uppercase">Student Directory</h3>
                 <select className="bg-gray-50 border p-2 rounded-xl text-xs font-bold" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                   {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : `Class: ${c}`}</option>)}
                 </select>
               </div>
               <button onClick={() => navigate('/admin/add-student')} className="bg-blue-900 text-white text-[10px] font-black px-4 py-2 rounded-lg">+ Add Student</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b">
                  <tr><th className="p-4">Full Name</th><th className="p-4">Class</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map(s => (
                    <tr key={s.id} onClick={() => navigate(`/admin/student/${s.id}`)} className="hover:bg-blue-50 transition cursor-pointer">
                      <td className="p-4 font-bold text-gray-800 underline decoration-blue-200">{s.full_name}</td>
                      <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-black">{s.class_name}</span></td>
                      <td className="p-4 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} className="p-2 bg-gray-50 hover:bg-blue-50 text-blue-600 rounded-lg text-lg">📝</button>
                        <button onClick={() => handleRemove('students', s.id)} className="p-2 bg-gray-50 hover:bg-red-50 text-red-500 rounded-lg text-lg">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Content: Teachers */}
        {activeTab === 'teachers' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-black text-gray-800 text-sm uppercase">Staff & Teachers</h3>
               <button onClick={() => navigate('/admin/add-teacher')} className="bg-green-600 text-white text-[10px] font-black px-4 py-2 rounded-lg">+ Register Staff</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b">
                  <tr><th className="p-4">Teacher Name</th><th className="p-4">Subject/Role</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allTeachers.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-gray-800">{t.full_name}</td>
                      <td className="p-4 text-xs font-bold text-gray-500 uppercase">{t.subject || 'Staff'}</td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button onClick={() => { setEditingTeacher(t); setIsTeacherEditModalOpen(true); }} className="p-2 bg-gray-50 hover:bg-blue-50 text-blue-600 rounded-lg text-lg">📝</button>
                        <button onClick={() => handleRemove('teachers', t.id)} className="p-2 bg-gray-50 hover:bg-red-50 text-red-500 rounded-lg text-lg">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Student Edit Modal */}
      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">Edit Student</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={editingStudent.full_name} onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})} required />
              <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={editingStudent.class_name} onChange={(e) => setEditingStudent({...editingStudent, class_name: e.target.value})} required />
              <div className="flex gap-3 mt-8">
                <button type="submit" className="flex-1 bg-blue-900 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg">Save Changes</button>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-xs uppercase">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Edit Modal */}
      {isTeacherEditModalOpen && editingTeacher && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-6">Edit Teacher</h2>
            <form onSubmit={handleTeacherUpdate} className="space-y-4">
              <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={editingTeacher.full_name} onChange={(e) => setEditingTeacher({...editingTeacher, full_name: e.target.value})} required />
              <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={editingTeacher.subject} onChange={(e) => setEditingTeacher({...editingTeacher, subject: e.target.value})} required />
              <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={editingTeacher.phone || ''} onChange={(e) => setEditingTeacher({...editingTeacher, phone: e.target.value})} placeholder="Phone Number" />
              <div className="flex gap-3 mt-8">
                <button type="submit" className="flex-1 bg-blue-900 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg">Update Staff</button>
                <button type="button" onClick={() => setIsTeacherEditModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-xs uppercase">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
