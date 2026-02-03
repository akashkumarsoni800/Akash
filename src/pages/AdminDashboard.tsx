import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const StatCard = ({ icon, title, value, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 flex items-center space-x-4 border-2 hover:shadow-xl transition-shadow duration-300 ${colors[color]}`}>
      <div className={`${colors[color]} p-4 rounded-xl text-3xl border`}>{icon}</div>
      <div>
        <p className="text-gray-500 text-xs font-black uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-gray-800">{value}</p>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  const [counts, setCounts] = useState({ students: 0, teachers: 0, pending: 0 });
  const [pendingStudents, setPendingStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  
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
      const [stdRes, tchRes, penRes] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_approved', 'approved'),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_approved', 'pending')
      ]);

      setCounts({ 
        students: stdRes.count || 0, 
        teachers: tchRes.count || 0, 
        pending: penRes.count || 0 
      });

      const { data: pending } = await supabase.from('students').select('*').eq('is_approved', 'pending');
      const { data: students } = await supabase.from('students').select('*').eq('is_approved', 'approved').order('full_name');
      const { data: teachers } = await supabase.from('teachers').select('*').order('full_name');

      setPendingStudents(pending || []);
      setAllStudents(students || []);
      setAllTeachers(teachers || []);
      
      if (students) setClasses(['All', ...new Set(students.map(s => s.class_name))]);

    } catch (error) { 
        console.error(error);
        toast.error("Data fetch failed"); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleRemove = async (table: string, id: any) => {
    if (window.confirm("Confirm: Delete?")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) { toast.success("Deleted!"); fetchInitialData(); }
    }
  };

  const handleApprove = async (id: any) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('students')
        .update({ is_approved: 'approved' })
        .eq('id', id);

      if (error) throw error;

      toast.success("Student Approved Successfully!");
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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
      toast.success("Updated!");
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
      toast.success("Updated!");
      setIsTeacherEditModalOpen(false);
      fetchInitialData();
    } catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const filteredStudents = classFilter === 'All' ? allStudents : allStudents.filter(s => s.class_name === classFilter);

  if (loading) return (
    <div className="h-screen flex items-center justify-center font-black text-blue-900 uppercase animate-pulse">
      <div className="text-center">
        <div className="text-4xl mb-4">🔄</div>
        ASM Loading Dashboard...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-2">Admin Control</h1>
            <p className="text-lg font-bold text-gray-500">Manage your school efficiently</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/admin/create-exam')} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg transition duration-200 transform hover:scale-105">📝 CREATE EXAM</button>
            <button onClick={() => navigate('/admin/add-event')} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg transition duration-200 transform hover:scale-105">📢 ADD EVENT</button>
            <button onClick={() => navigate('/admin/manage-fees')} className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg transition duration-200 transform hover:scale-105">💰 MANAGE FEES</button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <StatCard icon="🎓" title="Approved Students" value={counts.students} color="blue" />
          <StatCard icon="⌛" title="Pending Admissions" value={counts.pending} color="yellow" />
          <StatCard icon="👨‍🏫" title="Total Teachers" value={counts.teachers} color="green" />
        </div>

        {/* Tabs System */}
        <div className="flex flex-wrap space-x-8 border-b-2 border-gray-200 mb-10 bg-white rounded-t-3xl p-6 shadow-sm">
          {['overview', 'students', 'teachers'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`pb-4 px-4 text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab ? 'border-b-4 border-blue-900 text-blue-900 bg-blue-50 rounded-t-lg' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px] bg-white rounded-b-3xl shadow-lg border border-gray-100 p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tighter">Pending Approvals</h2>
              {pendingStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left bg-gray-50 rounded-2xl overflow-hidden">
                    <tbody className="divide-y divide-gray-200">
                      {pendingStudents.map(s => (
                        <tr key={s.id} className="hover:bg-gray-100 transition">
                          <td className="p-6 font-bold text-gray-800 text-lg">{s.full_name} <span className="text-gray-500">({s.class_name})</span></td>
                          <td className="p-6 flex gap-4">
                            <button onClick={() => handleApprove(s.id)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase shadow-lg transition">Approve</button>
                            <button onClick={() => handleRemove('students', s.id)} className="bg-gray-200 hover:bg-gray-300 text-gray-600 px-6 py-3 rounded-2xl text-sm font-black uppercase transition">Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-gray-500 text-lg font-bold uppercase">No pending requests</p>
                </div>
              )}
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Approved Students</h2>
                <select 
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="bg-gray-100 border-2 border-gray-300 rounded-2xl px-4 py-2 text-sm font-black uppercase focus:ring-2 focus:ring-blue-500"
                >
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left bg-gray-50 rounded-2xl overflow-hidden">
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map(s => (
                      <tr key={s.id} onClick={() => navigate(`/admin/student/${s.id}`)} className="hover:bg-blue-50 transition cursor-pointer">
                        <td className="p-6 font-bold text-gray-800 text-lg underline decoration-blue-300">{s.full_name}</td>
                        <td className="p-6"><span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-black">{s.class_name}</span></td>
                        <td className="p-6 flex gap-4" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} className="bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-xl transition transform hover:scale-110">📝</button>
                          <button onClick={() => handleRemove('students', s.id)} className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl transition transform hover:scale-110">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Teachers Tab */}
          {activeTab === 'teachers' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tighter">Staff Directory</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left bg-gray-50 rounded-2xl overflow-hidden">
                  <thead>
                    <tr className="bg-gray-200 text-gray-700">
                      <th className="p-6 text-left font-black uppercase tracking-widest text-sm">Name</th>
                      <th className="p-6 text-left font-black uppercase tracking-widest text-sm">Subject</th>
                      <th className="p-6 text-left font-black uppercase tracking-widest text-sm">Mobile</th>
                      <th className="p-6 text-left font-black uppercase tracking-widest text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allTeachers.map(t => (
                      <tr key={t.id} onClick={() => navigate(`/admin/teacher/${t.id}`)} className="hover:bg-green-50 transition cursor-pointer">
                        <td className="p-6 font-bold text-gray-800 text-lg">{t.full_name}</td>
                        <td className="p-6"><span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-black uppercase">{t.subject}</span></td>
                        <td className="p-6 text-gray-600">{t.phone || 'N/A'}</td>
                        <td className="p-6 flex gap-4" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { setEditingTeacher(t); setIsTeacherEditModalOpen(true); }} className="bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-xl transition transform hover:scale-110">📝</button>
                          <button onClick={() => handleRemove('teachers', t.id)} className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl transition transform hover:scale-110">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {isEditModalOpen && editingStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-gray-200">
              <h2 className="text-3xl font-black text-blue-900 uppercase mb-8 tracking-tighter">Edit Student</h2>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-gray-600 uppercase tracking-widest mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={editingStudent.full_name}
                    onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-300 rounded-2xl px-6 py-4 text-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-600 uppercase tracking-widest mb-2">Class</label>
                  <select 
                    value={editingStudent.class_name}
                    onChange={(e) => setEditingStudent({...editingStudent, class_name: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-300 rounded-2xl px-6 py-4 text-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition"
                  >
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-6 pt-6">
                  <button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-black py-4 rounded-2xl uppercase text-sm shadow-lg transition transform hover:scale-105">Save Changes</button>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-black py-4 rounded-2xl uppercase text-sm transition">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isTeacherEditModalOpen && editingTeacher && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-gray-200">
              <h2 className="text-3xl font-black text-green-900 uppercase mb-8 tracking-tighter">Edit Teacher</h2>
              <form onSubmit={handleTeacherUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-gray-600 uppercase tracking-widest mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={editingTeacher.full_name}
                    onChange={(e) => setEditingTeacher({...editingTeacher, full_name
