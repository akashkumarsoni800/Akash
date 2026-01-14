import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // 1. Counts
      const { count: stdCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_approved', 'approved');
      const { count: tchCount } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
      const { count: penCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_approved', 'pending');
      
      setCounts({ students: stdCount || 0, teachers: tchCount || 0, pending: penCount || 0 });

      // 2. Pending Students
      const { data: pending } = await supabase.from('students').select('*').eq('is_approved', 'pending');
      setPendingStudents(pending || []);

      // 3. All Approved Students
      const { data: students } = await supabase.from('students').select('*').eq('is_approved', 'approved').order('full_name');
      setAllStudents(students || []);
      if (students) setClasses(['All', ...new Set(students.map(s => s.class_name))]);

      // 4. ✅ All Teachers (Fixing the Teacher Section)
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
    const { error } = await supabase
      .from('students')
      .update({
        full_name: editingStudent.full_name,
        class_name: editingStudent.class_name,
        contact_number: editingStudent.contact_number, // यदि अन्य फील्ड्स हैं तो यहाँ जोड़ें
      })
      .eq('id', editingStudent.id);

    if (error) throw error;

    toast.success("Student updated successfully!");
    setIsEditModalOpen(false); // मॉडल बंद करें
    fetchInitialData(); // लिस्ट रिफ्रेश करें
  } catch (error: any) {
    toast.error("Update failed: " + error.message);
  } finally {
    setLoading(false);
  }
};
  const filteredStudents = classFilter === 'All' ? allStudents : allStudents.filter(s => s.class_name === classFilter);

  if (loading && !isEditModalOpen) return <div className="h-screen flex items-center justify-center font-bold">ASM Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header Section with RE-ADDED EVENT BUTTON */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Admin Control</h1>
            <p className="text-sm font-bold text-gray-400">Manage your school efficiently</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* ✅ RE-ADDED EVENT BUTTON */}
            <button 
    onClick={() => navigate('/admin/create-exam')} 
    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition transform active:scale-95 flex items-center gap-2"
  >
    <span>📝</span> CREATE EXAM
  </button>
            <button onClick={() => navigate('/admin/add-event')} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition transform active:scale-95 flex items-center gap-2">
              <span>📢</span> ADD EVENT / NOTICE
            </button>
            <button onClick={() => navigate('/admin/manage-fees')} className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition transform active:scale-95 flex items-center gap-2">
              <span>💰</span> MANAGE FEES
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon="🎓" title="Approved Students" value={counts.students} color="blue" />
          <StatCard icon="⌛" title="Pending Admissions" value={counts.pending} color="yellow" />
          <StatCard icon="👨‍🏫" title="Total Teachers" value={counts.teachers} color="green" />
        </div>

        {/* Tab System */}
        <div className="flex space-x-6 border-b border-gray-200 mb-8">
          {['overview', 'students', 'teachers'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'border-b-4 border-blue-900 text-blue-900' : 'text-gray-400 hover:text-gray-600'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content: OVERVIEW */}
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
                        <button onClick={async () => { await supabase.from('students').update({ is_approved: 'approved' }).eq('id', s.id); fetchInitialData(); toast.success("Approved!"); }} className="bg-green-600 text-white text-[10px] font-black px-4 py-2 rounded-lg shadow-md hover:bg-green-700 uppercase">Approve Now</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendingStudents.length === 0 && <p className="p-10 text-center text-gray-400 italic font-medium">Everything is clear! No pending requests.</p>}
            </div>
          </div>
        )}

        {/* Tab Content: STUDENTS */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-4">
                 <h3 className="font-black text-gray-800 text-sm uppercase">Student Directory</h3>
                 <select className="bg-gray-50 border border-gray-100 p-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                   {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'Filter: All Classes' : `Class: ${c}`}</option>)}
                 </select>
               </div>
               <button onClick={() => navigate('/admin/add-student')} className="bg-blue-900 text-white text-[10px] font-black px-4 py-2 rounded-lg hover:bg-black uppercase shadow-lg">+ Add New Student</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b">
                  <tr><th className="p-4">Full Name</th><th className="p-4">Class</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-gray-800">{s.full_name}</td>
                      <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-black uppercase">{s.class_name}</span></td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} className="p-2 bg-gray-50 hover:bg-blue-50 text-blue-600 rounded-lg transition-all">📝</button>
                        <button onClick={() => handleRemove('students', s.id)} className="p-2 bg-gray-50 hover:bg-red-50 text-red-500 rounded-lg transition-all">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ✅ Tab Content: TEACHERS (Now Fixed) */}
        {activeTab === 'teachers' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-black text-gray-800 text-sm uppercase">Staff & Teachers</h3>
               <button onClick={() => navigate('/admin/add-teacher')} className="bg-green-600 text-white text-[10px] font-black px-4 py-2 rounded-lg hover:bg-green-700 uppercase shadow-lg">+ Register Staff</button>
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
                         <button onClick={() => handleRemove('teachers', t.id)} className="p-2 bg-gray-50 hover:bg-red-50 text-red-500 rounded-lg transition-all">🗑️ Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allTeachers.length === 0 && <p className="p-10 text-center text-gray-400 italic">No teachers found in database.</p>}
            </div>
          </div>
        )}

      </div>
      {/* (Modal code goes here - same as before) */}
      {isEditModalOpen && editingStudent && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
      <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">Edit Student</h2>
      
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400">Full Name</label>
          <input 
            type="text" 
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold"
            value={editingStudent.full_name}
            onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-gray-400">Class Name</label>
          <input 
            type="text" 
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold"
            value={editingStudent.class_name}
            onChange={(e) => setEditingStudent({...editingStudent, class_name: e.target.value})}
            required
          />
        </div>

        <div className="flex gap-3 mt-8">
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 bg-blue-900 text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg hover:bg-black transition"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            type="button"
            onClick={() => setIsEditModalOpen(false)}
            className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-black text-xs uppercase hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
};

export default AdminDashboard;
