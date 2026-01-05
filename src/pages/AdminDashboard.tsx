import React, { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "../supabaseClient";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [counts, setCounts] = useState({ students: 0, teachers: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setProfile({ name: "Admin User", email: "admin@school.com" });

        // ✅ FIXED LINE: Text-based 'pending' check
        const { data: pendingData } = await supabase
          .from('students')
          .select('*')
          .eq('is_approved', 'pending');

        if (pendingData) setPendingStudents(pendingData);

        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('is_approved', 'approved');

        const { count: teacherCount } = await supabase
          .from('teachers')
          .select('*', { count: 'exact', head: true });

        setCounts({ students: studentCount || 0, teachers: teacherCount || 0 });
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApprove = async (id: any) => {
    try {
      // ✅ UPDATING AS TEXT: 'approved'
      const { error } = await supabase
        .from('students')
        .update({ is_approved: 'approved' })
        .eq('id', id);

      if (error) throw error;
      toast.success("Student Approved! ✅");
      setPendingStudents(prev => prev.filter(s => s.id !== id));
      setCounts(prev => ({ ...prev, students: prev.students + 1 }));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut(); 
    navigate('/'); 
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="text-xl text-blue-900 font-bold animate-pulse">🔄 Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-20">
        <div><h1 className="text-xl font-bold">Adarsh Shishu Mandir</h1><p className="text-xs text-blue-200">Admin Panel</p></div>
        <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded text-xs font-bold hover:bg-red-600 transition">Logout</button>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6 mb-8 border-t-4 border-orange-500">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">🔔 Pending Admissions</h2>
          {pendingStudents.length === 0 ? (
            <p className="text-gray-500 italic text-center py-4">✅ No pending requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100 text-xs"><tr><th className="p-3">Name</th><th className="p-3">Class</th><th className="p-3">Action</th></tr></thead>
                <tbody className="text-sm">
                  {pendingStudents.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-bold text-blue-900">{s.full_name}</td>
                      <td className="p-3">{s.class_name}</td>
                      <td className="p-3"><button onClick={() => handleApprove(s.id)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Approve</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-3xl font-bold text-blue-900">{counts.students}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase">Total Students</p>
            <Link to="/admin/add-student" className="text-blue-600 text-sm font-bold mt-4 block hover:underline">+ Add New Student</Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-3xl font-bold text-green-900">{counts.teachers}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase">Total Teachers</p>
            <Link to="/admin/add-teacher" className="text-green-600 text-sm font-bold mt-4 block hover:underline">+ Register Teacher</Link>
          </div>
          {/* ... Add other static cards as per your need ... */}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
