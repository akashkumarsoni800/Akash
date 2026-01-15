import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

// GallerySlider को यहाँ से हटा दें क्योंकि आपने इसे App.tsx में डाल दिया है।

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
      // ✅ Promise.all को सही तरीके से लिखें
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

  // Student Update Logic
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

  // Teacher Update Logic
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

  // 🔴 व्हाइट स्क्रीन से बचने के लिए यहाँ लोडिंग चेक है
  if (loading) return (
    <div className="h-screen flex items-center justify-center font-black text-blue-900 uppercase">
        ASM Loading Dashboard...
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Admin Control</h1>
            <p className="text-sm font-bold text-gray-400">Manage your school efficiently</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/admin/create-exam')} className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg">📝 CREATE EXAM</button>
            <button onClick={() => navigate('/admin/add-event')} className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg">📢 ADD EVENT</button>
            <button onClick={() => navigate('/admin/manage-fees')} className="bg-blue-900 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg">💰 MANAGE FEES</button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon="🎓" title="Approved Students" value={counts.students} color="blue" />
          <StatCard icon="⌛" title="Pending Admissions" value={counts.pending} color="yellow" />
          <StatCard icon="👨‍🏫" title="Total Teachers" value={counts.teachers} color="green" />
        </div>
{/* 🖼️ MIDDLE: Gallery Slider (अब यह बीच में है) */}
    <div className="mb-10">
      <GallerySlider />
    </div>
        {/* Tabs System */}
        <div className="flex space-x-6 border-b border-gray-200 mb-8">
          {['overview', 'students', 'teachers'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'border-b-4 border-blue-900 text-blue-900' : 'text-gray-400'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Logic (जैसे आपका पहले था) */}
        {activeTab === 'students' && (
           /* Students Table Code */
           <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              {/* टेबल का हिस्सा */}
              <table className="w-full text-left">
                 <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map(s => (
                       <tr key={s.id} onClick={() => navigate(`/admin/student/${s.id}`)} className="hover:bg-blue-50 transition cursor-pointer">
                          <td className="p-4 font-bold text-gray-800 underline decoration-blue-200">{s.full_name}</td>
                          <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-black">{s.class_name}</span></td>
                          <td className="p-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                             <button onClick={() => { setEditingStudent(s); setIsEditModalOpen(true); }}>📝</button>
                             <button onClick={() => handleRemove('students', s.id)}>🗑️</button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        )}

        {/* ... (Teachers और Overview का कोड यहाँ आएगा) ... */}

        {/* Modals को यहाँ रखें (Student और Teacher वाले) */}
    </div>
  );
};

export default AdminDashboard;
