import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  Users, GraduationCap, Clock, Plus, Search, 
  Settings, FileText, Trash2, Edit2, CheckCircle, XCircle 
} from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, color, subText }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <div className={`relative overflow-hidden bg-white rounded-3xl p-6 border ${colorStyles[color]?.split(' ')[2] || 'border-gray-100'} shadow-sm hover:shadow-md transition-all duration-300`}>
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
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [counts, setCounts] = useState({ students: 0, teachers: 0, pending: 0 });
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState<string[]>([]);
  
  // Modals
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
      
      if (students) setClasses(['All', ...new Set(students.map((s: any) => s.class_name))]);

    } catch (error) { 
        console.error(error);
        toast.error("Failed to connect to server"); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleRemove = async (table: string, id: any) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) { toast.success("Record deleted successfully"); fetchInitialData(); }
    }
  };

  const handleApprove = async (id: any) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('students').update({ is_approved: 'approved' }).eq('id', id);
      if (error) throw error;
      toast.success("Student Approved!");
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
      toast.success("Staff updated!");
      setIsTeacherEditModalOpen(false);
      fetchInitialData();
    } catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  // Filter Logic with Search
  const filteredStudents = allStudents.filter(s => 
    (classFilter === 'All' || s.class_name === classFilter) &&
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeachers = allTeachers.filter(t => 
    t.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
       <p className="text-indigo-900 font-bold animate-pulse">LOADING DASHBOARD...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 pb-20 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Admin Panel</h1>
            <p className="text-sm font-medium text-gray-400 mt-1">Welcome back, Administrator</p>
          </div>
          <div className="flex flex-wrap gap-3">
             <button onClick={() => navigate('/admin/create-exam')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-1">
               <FileText size={16}/> CREATE EXAM
             </button>
             <button onClick={() => navigate('/admin/add-event')} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-xl text-xs font-bold transition-all">
               <Plus size={16}/> ADD EVENT
             </button>
             <button onClick={() => navigate('/admin/upload-result')} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-1">
               <CheckCircle size={16}/> UPLOAD RESULT
             </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={GraduationCap} title="Active Students" value={counts.students} color="blue" subText="+ Enrolled this session" />
          <StatCard icon={Clock} title="Pending Requests" value={counts.pending} color="amber" subText="Needs attention" />
          <StatCard icon={Users} title="Total Staff" value={counts.teachers} color="emerald" subText="Active faculty members" />
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
          
          {/* Custom Tabs */}
          <div className="flex border-b border-gray-100 px-8 pt-8 gap-8 overflow-x-auto">
            {['overview', 'students', 'teachers'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                  activeTab === tab 
                    ? 'text-indigo-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full"></div>}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="animate-fade-in-up">
                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="text-amber-500" size={20}/> 
                  PENDING APPROVALS
                </h2>
                {pendingStudents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingStudents.map(s => (
                      <div key={s.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col gap-3 group hover:border-indigo-100 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-gray-900">{s.full_name}</h3>
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">Class: {s.class_name}</span>
                          </div>
                          <div className="h-8 w-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-xs">?</div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleApprove(s.id)} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition">APPROVE</button>
                          <button onClick={() => handleRemove('students', s.id)} className="flex-1 bg-white border border-gray-200 text-gray-500 py-2 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition">REJECT</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <CheckCircle size={48} className="mb-4 text-gray-200"/>
                    <p className="font-bold text-sm uppercase tracking-widest">All caught up!</p>
                  </div>
                )}
              </div>
            )}

            {/* 2. STUDENTS TAB */}
            {activeTab === 'students' && (
              <div className="animate-fade-in-up">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search students..." 
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select 
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="py-3 px-4 bg-gray-50 border-none rounded-xl font-bold text-sm text-gray-600 cursor-pointer"
                  >
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Student Name</th>
                        <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Class</th>
                        <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStudents.map(s => (
                        <tr key={s.id} className="hover:bg-indigo-50/30 transition group">
                          <td className="p-4 font-bold text-gray-800">{s.full_name}</td>
                          <td className="p-4"><span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{s.class_name}</span></td>
                          <td className="p-4 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} className="p-2 bg-white border border-gray-200 rounded-lg text-indigo-600 hover:border-indigo-300"><Edit2 size={14}/></button>
                            <button onClick={() => handleRemove('students', s.id)} className="p-2 bg-white border border-gray-200 rounded-lg text-red-500 hover:border-red-300"><Trash2 size={14}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. TEACHERS TAB */}
            {activeTab === 'teachers' && (
              <div className="animate-fade-in-up">
                 <div className="flex justify-between items-center mb-6">
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search staff..." 
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeachers.map(t => (
                      <div key={t.id} className="bg-white border border-gray-100 p-6 rounded-3xl hover:shadow-lg hover:shadow-emerald-100/50 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-lg">
                            {t.full_name.charAt(0)}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingTeacher(t); setIsTeacherEditModalOpen(true); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><Edit2 size={14}/></button>
                            <button onClick={() => handleRemove('teachers', t.id)} className="p-2 hover:bg-gray-100 rounded-full text-red-500"><Trash2 size={14}/></button>
                          </div>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">{t.full_name}</h3>
                        <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest mb-4">{t.subject}</p>
                        <div className="pt-4 border-t border-gray-50 flex items-center gap-2 text-gray-400 text-xs font-medium">
                           <span>📞 {t.phone || 'No contact info'}</span>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STUDENT EDIT MODAL */}
      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900 uppercase">Edit Student</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={24}/></button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-2">Full Name</label>
                <input 
                  type="text" 
                  value={editingStudent.full_name}
                  onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-xl px-5 py-4 font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-2">Class</label>
                <select 
                  value={editingStudent.class_name}
                  onChange={(e) => setEditingStudent({...editingStudent, class_name: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-xl px-5 py-4 font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl uppercase tracking-widest mt-4 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER EDIT MODAL */}
      {isTeacherEditModalOpen && editingTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-scale-in">
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900 uppercase">Edit Staff</h2>
              <button onClick={() => setIsTeacherEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={24}/></button>
            </div>
            <form onSubmit={handleTeacherUpdate} className="space-y-4">
              <input 
                type="text" placeholder="Full Name"
                value={editingTeacher.full_name}
                onChange={(e) => setEditingTeacher({...editingTeacher, full_name: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-5 py-4 font-bold focus:ring-2 focus:ring-emerald-500"
              />
              <input 
                type="text" placeholder="Subject"
                value={editingTeacher.subject}
                onChange={(e) => setEditingTeacher({...editingTeacher, subject: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-5 py-4 font-bold focus:ring-2 focus:ring-emerald-500"
              />
              <input 
                type="text" placeholder="Phone"
                value={editingTeacher.phone}
                onChange={(e) => setEditingTeacher({...editingTeacher, phone: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-5 py-4 font-bold focus:ring-2 focus:ring-emerald-500"
              />
              <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl uppercase tracking-widest mt-4 shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition">Update Staff</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
