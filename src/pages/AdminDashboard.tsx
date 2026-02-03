import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  Users, UserCheck, Clock, PlusCircle, 
  Settings, Trash2, Edit3, Search, Filter 
} from 'lucide-react'; // Icons ke liye lucide-react ka use karein

const StatCard = ({ icon: Icon, title, value, colorClass }) => (
  <div className="relative overflow-hidden bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md group">
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${colorClass}`} />
    <div className="flex items-center space-x-4">
      <div className={`p-4 rounded-2xl ${colorClass} text-white shadow-lg`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-gray-800">{value}</p>
      </div>
    </div>
  </div>
);

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
  const [editingStudent, setEditingStudent] = useState(null);
  const [isTeacherEditModalOpen, setIsTeacherEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

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
      toast.error("Data refresh failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (table, id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) { 
        toast.success("Record deleted successfully"); 
        fetchInitialData(); 
      }
    }
  };

  const filteredStudents = classFilter === 'All' ? allStudents : allStudents.filter(s => s.class_name === classFilter);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-blue-900 tracking-tighter uppercase animate-pulse">Synchronizing Data...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Settings className="text-blue-600" size={32} />
              ADMIN CORE
            </h1>
            <p className="text-slate-500 font-medium mt-1">Bharat Life Response System Management</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/admin/create-exam')} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-sm">
              <PlusCircle size={16} /> EXAM
            </button>
            <button onClick={() => navigate('/admin/add-event')} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-lg shadow-blue-200">
              <PlusCircle size={16} /> EVENT
            </button>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard icon={UserCheck} title="Active Students" value={counts.students} colorClass="bg-emerald-500" />
          <StatCard icon={Clock} title="Pending Requests" value={counts.pending} colorClass="bg-amber-500" />
          <StatCard icon={Users} title="Total Faculty" value={counts.teachers} colorClass="bg-blue-600" />
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/50 backdrop-blur-sm inline-flex p-1.5 rounded-2xl border border-slate-200 mb-8">
          {['overview', 'students', 'teachers'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === tab 
                  ? 'bg-white text-blue-900 shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dynamic Content Area */}
        <main className="transition-all duration-300">
          {activeTab === 'overview' && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Approval Queue</h2>
                <span className="bg-amber-100 text-amber-700 px-4 py-1 rounded-full text-[10px] font-black">{pendingStudents.length} WAITING</span>
              </div>
              <div className="p-4">
                {pendingStudents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingStudents.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-800">{s.full_name}</p>
                          <p className="text-[10px] font-black text-blue-600 uppercase">Class: {s.class_name}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(s.id)} className="bg-white text-emerald-600 p-2.5 rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-colors">
                            <UserCheck size={18} />
                          </button>
                          <button onClick={() => handleRemove('students', s.id)} className="bg-white text-rose-600 p-2.5 rounded-xl border border-rose-100 hover:bg-rose-50 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <div className="inline-flex p-6 bg-slate-50 rounded-full mb-4"><Clock className="text-slate-300" size={40}/></div>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Everything is up to date</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-black text-slate-800 uppercase">Student Directory</h2>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl">
                  <Filter size={14} className="text-slate-400" />
                  <select 
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black uppercase focus:ring-0 cursor-pointer"
                  >
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                      <th className="p-4 pl-8">Student Identity</th>
                      <th className="p-4">Grade</th>
                      <th className="p-4 text-right pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStudents.map(s => (
                      <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="p-4 pl-8">
                          <button onClick={() => navigate(`/admin/student/${s.id}`)} className="font-bold text-slate-700 hover:text-blue-600 transition-colors text-left">
                            {s.full_name}
                          </button>
                        </td>
                        <td className="p-4">
                          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black">{s.class_name}</span>
                        </td>
                        <td className="p-4 text-right pr-8">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg shadow-sm transition-all"><Edit3 size={16} /></button>
                            <button onClick={() => handleRemove('students', s.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg shadow-sm transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ... Add similar styling for Teachers tab ... */}
        </main>
      </div>

      {/* --- Re-styled Modals --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[999] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-slate-900 uppercase mb-8 tracking-tighter">Edit Record</h2>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={editingStudent.full_name}
                  onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 focus:bg-white focus:border-blue-600 transition-all outline-none"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl uppercase text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Save Changes</button>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl uppercase text-xs hover:bg-slate-200 transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
