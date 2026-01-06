import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

// --- UI Components (StatCard) ---
const StatCard = ({ icon, title, value, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
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
  
  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  // Filter States
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const { count: stdCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_approved', 'approved');
      const { count: tchCount } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
      const { count: penCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_approved', 'pending');
      
      setCounts({ students: stdCount || 0, teachers: tchCount || 0, pending: penCount || 0 });

      const { data: pending } = await supabase.from('students').select('*').eq('is_approved', 'pending');
      setPendingStudents(pending || []);

      const { data: students } = await supabase.from('students').select('*').eq('is_approved', 'approved');
      setAllStudents(students || []);
      
      if (students) {
        setClasses(['All', ...new Set(students.map(s => s.class_name))]);
      }

      const { data: teachers } = await supabase.from('teachers').select('*');
      setAllTeachers(teachers || []);

    } catch (error) { toast.error("Fetch failed"); }
    finally { setLoading(false); }
  };

  // ✅ Edit Student logic
  const openEditModal = (student) => {
    setEditingStudent({ ...student });
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('students')
      .update({ 
        full_name: editingStudent.full_name, 
        class_name: editingStudent.class_name,
        email: editingStudent.email 
      })
      .eq('id', editingStudent.id);

    if (!error) {
      toast.success("Student updated successfully!");
      setIsEditModalOpen(false);
      fetchInitialData();
    } else {
      toast.error(error.message);
    }
    setLoading(false);
  };

  // ✅ Delete Logic
  const handleRemove = async (table, id) => {
    if (window.confirm("Kripya confirm karein, kya aap ise delete karna chahte hain?")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) {
        toast.success("Data Deleted!");
        fetchInitialData();
      }
    }
  };

  const filteredStudents = classFilter === 'All' ? allStudents : allStudents.filter(s => s.class_name === classFilter);

  if (loading && !isEditModalOpen) return <div className="h-screen flex items-center justify-center font-bold">ASM Admin Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon="🎓" title="Approved Students" value={counts.students} color="blue" />
          <StatCard icon="🕒" title="Pending Approvals" value={counts.pending} color="yellow" />
          <StatCard icon="👨‍🏫" title="School Staff" value={counts.teachers} color="green" />
        </div>

        {/* Tab System */}
        <div className="flex gap-6 border-b mb-6">
          {['overview', 'students', 'teachers'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 px-4 font-black uppercase text-xs tracking-widest transition ${activeTab === tab ? 'border-b-4 border-blue-900 text-blue-900' : 'text-gray-400'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Students Tab with Filter */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-3xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-4">
                <h3 className="font-black text-gray-800 uppercase">Manage Students</h3>
                <select className="bg-gray-50 border px-3 py-1 rounded-lg text-xs font-bold" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                  {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>)}
                </select>
              </div>
            </div>

            <table className="w-full text-left">
              <thead><tr className="text-[10px] font-black text-gray-400 uppercase border-b"><th className="p-4">Name</th><th className="p-4">Class</th><th className="p-4 text-right">Actions</th></tr></thead>
              <tbody>
                {filteredStudents.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 font-bold text-gray-800">{s.full_name}</td>
                    <td className="p-4 text-xs font-black text-blue-600 uppercase">{s.class_name}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => openEditModal(s)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">📝</button>
                      <button onClick={() => handleRemove('students', s.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Overview & Teachers Section (Same as previous code) */}
        {/* ... */}

      </div>

      {/* ✅ EDIT STUDENT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-blue-900 p-6 text-white flex justify-between items-center">
               <h3 className="font-black uppercase tracking-tighter">Edit Student Data</h3>
               <button onClick={() => setIsEditModalOpen(false)} className="text-xl">✕</button>
            </div>
            <div className="p-8 space-y-4">
               <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
                 <input type="text" className="w-full p-3 bg-gray-50 border rounded-xl font-bold" value={editingStudent.full_name} onChange={e => setEditingStudent({...editingStudent, full_name: e.target.value})} />
               </div>
               <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase">Class Name</label>
                 <input type="text" className="w-full p-3 bg-gray-50 border rounded-xl font-bold" value={editingStudent.class_name} onChange={e => setEditingStudent({...editingStudent, class_name: e.target.value})} />
               </div>
               <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase">Email Address</label>
                 <input type="email" className="w-full p-3 bg-gray-50 border rounded-xl font-bold" value={editingStudent.email} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} />
               </div>
               <button onClick={handleUpdateStudent} disabled={loading} className="w-full bg-blue-900 text-white py-4 rounded-xl font-black shadow-lg">
                 {loading ? "UPDATING..." : "SAVE CHANGES"}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
