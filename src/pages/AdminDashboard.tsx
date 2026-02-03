import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { 
  Users, UserCheck, GraduationCap, PlusCircle, 
  LayoutDashboard, FileText, Wallet, Trash2, Edit3, CheckCircle 
} from 'lucide-react'; // Icons ke liye lucide-react install karein

const StatCard = ({ icon: Icon, title, value, gradient }) => (
  <div className={`p-6 rounded-3xl shadow-xl bg-gradient-to-br ${gradient} text-white transform transition hover:scale-105`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black">{value}</h3>
      </div>
      <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
        <Icon size={24} />
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
  
  // Modals States
  const [editingStudent, setEditingStudent] = useState(null);
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
    if (confirm("Permanently Delete?")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) { toast.success("Record Removed"); fetchInitialData(); }
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-blue-900 animate-pulse tracking-widest">BLRS SECURE ACCESS...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 mb-8">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900 p-2 rounded-xl text-white"><LayoutDashboard size={20}/></div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Admin Console</h1>
          </div>
          <div className="flex gap-2">
             <button onClick={() => navigate('/admin/upload-result')} className="hidden md:flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black">
                <FileText size={14}/> RESULT CENTER
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard icon={GraduationCap} title="Active Students" value={counts.students} gradient="from-blue-600 to-indigo-700" />
          <StatCard icon={UserCheck} title="Waitlist" value={counts.pending} gradient="from-amber-400 to-orange-500" />
          <StatCard icon={Users} title="Faculty Members" value={counts.teachers} gradient="from-emerald-500 to-teal-600" />
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <button onClick={() => navigate('/admin/create-exam')} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-gray-100 hover:border-red-200 transition group">
            <div className="p-3 bg-red-50 rounded-2xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition mb-2"><PlusCircle size={20}/></div>
            <span className="text-[10px] font-black text-gray-500 uppercase">Create Exam</span>
          </button>
          <button onClick={() => navigate('/admin/add-event')} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-gray-100 hover:border-purple-200 transition group">
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition mb-2"><PlusCircle size={20}/></div>
            <span className="text-[10px] font-black text-gray-500 uppercase">Add Event</span>
          </button>
          <button onClick={() => navigate('/admin/manage-fees')} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-gray-100 hover:border-blue-200 transition group">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition mb-2"><Wallet size={20}/></div>
            <span className="text-[10px] font-black text-gray-500 uppercase">Manage Fees</span>
          </button>
          <button onClick={() => navigate('/admin/upload-result')} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-gray-100 hover:border-indigo-200 transition group">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-700 group-hover:bg-indigo-700 group-hover:text-white transition mb-2"><FileText size={20}/></div>
            <span className="text-[10px] font-black text-gray-500 uppercase">Results</span>
          </button>
        </div>

        {/* Main Interface */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 p-2 bg-gray-50/50">
            {['overview', 'students', 'teachers'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-tighter rounded-2xl transition-all ${activeTab === tab ? 'bg-white text-blue-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-gray-900 uppercase">Waiting for Approval</h2>
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">{pendingStudents.length} Requests</span>
                </div>
                {pendingStudents.length > 0 ? (
                  <div className="grid gap-4">
                    {pendingStudents.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-transparent hover:border-blue-100 transition">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center font-black text-blue-900 shadow-sm">{s.full_name.charAt(0)}</div>
                          <div>
                            <p className="font-black text-gray-800 uppercase text-sm">{s.full_name}</p>
                            <p className="text-[10px] font-bold text-gray-400">CLASS: {s.class_name}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(s.id)} className="bg-blue-900 text-white p-3 rounded-2xl hover:bg-blue-800 transition shadow-lg shadow-blue-100"><CheckCircle size={18}/></button>
                          <button onClick={() => handleRemove('students', s.id)} className="bg-white text-red-500 p-3 rounded-2xl border border-gray-100 hover:bg-red-50 transition shadow-sm"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Inbox is empty</p>
                  </div>
                )}
              </div>
            )}

            {/* Baaki Tabs Content logic yahan aa jayegi (Students and Teachers) */}
            {/* Logic same rakhein, bas UI elements ko rounded-3xl aur modern padding dein */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
