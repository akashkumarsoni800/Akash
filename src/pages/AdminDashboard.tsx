import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  Users, UserCheck, GraduationCap, PlusCircle, 
  LayoutDashboard, FileText, Wallet, Trash2, Edit3, CheckCircle, Search
} from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');

  // Modals States
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

  const handleApprove = async (id) => {
    const { error } = await supabase.from('students').update({ is_approved: 'approved' }).eq('id', id);
    if (!error) { toast.success("Approved!"); fetchInitialData(); }
  };

  const handleRemove = async (table, id) => {
    if (window.confirm("Permanently Delete?")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) { toast.success("Record Removed"); fetchInitialData(); }
    }
  };

  // Filter Logic
  const filteredStudents = allStudents.filter(s => 
    (classFilter === 'All' || s.class_name === classFilter) &&
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeachers = allTeachers.filter(t => 
    t.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-blue-900 uppercase">BLRS Loading Dashboard...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header and Stats yahan same rahenge (pichle code ki tarah) */}
      {/* ... (Header & Stats Grid) ... */}

      <div className="max-w-7xl mx-auto px-4 mt-10">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-100 p-2 bg-gray-50/50">
            {['overview', 'students', 'teachers'].map(tab => (
              <button 
                key={tab} 
                onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-tighter rounded-2xl transition-all ${activeTab === tab ? 'bg-white text-blue-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* 1. OVERVIEW TAB: Pending Approvals */}
            {activeTab === 'overview' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-black text-gray-900 uppercase mb-6">Pending Approvals</h2>
                <div className="grid gap-4">
                  {pendingStudents.length > 0 ? pendingStudents.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-transparent hover:border-blue-100 transition">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center font-black text-blue-900 shadow-sm">{s.full_name.charAt(0)}</div>
                        <div>
                          <p className="font-black text-gray-800 uppercase text-sm">{s.full_name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Class: {s.class_name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(s.id)} className="bg-blue-900 text-white p-3 rounded-2xl hover:bg-blue-800 transition shadow-lg shadow-blue-100"><CheckCircle size={18}/></button>
                        <button onClick={() => handleRemove('students', s.id)} className="bg-white text-red-500 p-3 rounded-2xl border border-gray-100 hover:bg-red-50 transition shadow-sm"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  )) : <p className="text-center py-10 text-gray-400 font-bold">ALL CLEAR! NO PENDING REQUESTS.</p>}
                </div>
              </div>
            )}

            {/* 2. STUDENTS TAB: Approved Students List */}
            {activeTab === 'students' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="SEARCH STUDENTS..." 
                      className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 text-xs font-black uppercase focus:ring-2 focus:ring-blue-900 transition"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select 
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="bg-gray-100 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase focus:ring-2 focus:ring-blue-900"
                  >
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="px-6 py-2">Student Name</th>
                        <th className="px-6 py-2">Class</th>
                        <th className="px-6 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(s => (
                        <tr key={s.id} onClick={() => navigate(`/admin/student/${s.id}`)} className="bg-gray-50 hover:bg-white hover:shadow-xl hover:shadow-gray-100 transition cursor-pointer group">
                          <td className="px-6 py-4 rounded-l-3xl">
                            <span className="font-black text-gray-800 uppercase text-sm group-hover:text-blue-900">{s.full_name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">{s.class_name}</span>
                          </td>
                          <td className="px-6 py-4 rounded-r-3xl text-right">
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }} className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-blue-900 transition"><Edit3 size={16}/></button>
                              <button onClick={() => handleRemove('students', s.id)} className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-red-600 transition"><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. TEACHERS TAB: Staff List */}
            {activeTab === 'teachers' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="mb-8">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="SEARCH STAFF MEMBERS..." 
                            className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 text-xs font-black uppercase focus:ring-2 focus:ring-emerald-600 transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTeachers.map(t => (
                    <div key={t.id} onClick={() => navigate(`/admin/teacher/${t.id}`)} className="bg-gray-50 p-6 rounded-[2rem] border border-transparent hover:border-emerald-100 hover:bg-white hover:shadow-xl transition group cursor-pointer">
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center font-black text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition">
                          {t.full_name.charAt(0)}
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => { setEditingTeacher(t); setIsTeacherEditModalOpen(true); }} className="p-2 bg-white rounded-xl text-gray-400 hover:text-blue-900 shadow-sm transition"><Edit3 size={14}/></button>
                            <button onClick={() => handleRemove('teachers', t.id)} className="p-2 bg-white rounded-xl text-gray-400 hover:text-red-600 shadow-sm transition"><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <h3 className="font-black text-gray-800 uppercase tracking-tight mb-1">{t.full_name}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">{t.subject || 'GENERAL'}</p>
                      <div className="bg-white/50 rounded-2xl p-3 flex items-center justify-between">
                         <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Contact:</span>
                         <span className="text-[10px] font-bold text-gray-800">{t.phone || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals yahan aayenge (Inhe same rakhein lekin classes ko rounded-3xl kar dein) */}
    </div>
  );
};

export default AdminDashboard;
