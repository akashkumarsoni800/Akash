import React, { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "../supabaseClient";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // --- STATE (Data yahan store hoga) ---
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [counts, setCounts] = useState({ students: 0, teachers: 0 });

  // --- DATA FETCHING (useEffect - Sabse Safe Tarika) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Get Current User Profile (Dummy for now to prevent crash)
        // Agar database me profile nahi hai, tab bhi ye chalega
        setProfile({ name: "Admin User", email: "admin@school.com" });

        // 2. Fetch Pending Students
        const { data: pendingData } = await supabase
          .from('students')
          .select('*')
          .eq('approval_status', 'pending');
        
        if (pendingData) setPendingStudents(pendingData);

        // 3. Count Total Students
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('approval_status', 'approved');

        // 4. Count Total Teachers
        const { count: teacherCount } = await supabase
          .from('teachers')
          .select('*', { count: 'exact', head: true });

        setCounts({ 
          students: studentCount || 0, 
          teachers: teacherCount || 0 
        });

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- ACTIONS ---
  const handleApprove = async (id: any) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ approval_status: 'approved' })
        .eq('id', id);

      if (error) throw error;

      toast.success("Student Approved! ✅");
      // List refresh karo
      setPendingStudents(prev => prev.filter(s => s.id !== id));
      setCounts(prev => ({ ...prev, students: prev.students + 1 }));

    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("adarsh_school_login"); 
    await supabase.auth.signOut(); 
    window.location.href = "/"; 
  };

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
         <div className="text-xl text-blue-900 font-bold animate-pulse">
           🔄 Starting Dashboard...
         </div>
      </div>
    );
  }

  // --- MAIN DESIGN ---
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Navbar */}
      <nav className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold">Adarsh Shishu Mandir</h1>
          <p className="text-xs text-blue-200">Welcome, {profile?.name}</p>
        </div>
        <button 
          onClick={handleLogout} 
          className="bg-red-500 px-3 py-1 rounded text-xs font-bold hover:bg-red-600 transition"
        >
          Logout
        </button>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">

        {/* Pending Approvals Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8 border-t-4 border-orange-500">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            🔔 Pending Admissions
            {pendingStudents.length > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {pendingStudents.length} New
              </span>
            )}
          </h2>

          {pendingStudents.length === 0 ? (
            <p className="text-gray-500 italic bg-gray-50 p-4 rounded text-center">
              ✅ No pending requests found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pendingStudents.map((student: any) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-bold text-blue-900">{student.full_name}</td>
                      <td className="p-3">{student.class_name}</td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            if(window.confirm(`Approve ${student.full_name}?`)) handleApprove(student.id);
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 shadow-sm"
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Students Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
            <h3 className="text-3xl font-bold text-blue-900">{counts.students}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase">Total Students</p>
            <Link to="/admin/add-student" className="text-blue-600 text-sm font-bold mt-4 block hover:underline">
              + Add New Student
            </Link>
          </div>

          {/* Teachers Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
            <h3 className="text-3xl font-bold text-green-900">{counts.teachers}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase">Total Teachers</p>
            <Link to="/admin/add-teacher" className="text-green-600 text-sm font-bold mt-4 block hover:underline">
              + Register Teacher
            </Link>
          </div>

          {/* Fees Card */}
          <div className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-200 hover:shadow-md transition">
            <h3 className="font-bold text-yellow-900">💰 Accounts</h3>
            <Link to="/admin/manage-fees" className="mt-4 block bg-yellow-600 text-white text-center py-2 rounded font-bold">
              Manage Fees
            </Link>
          </div>

          {/* Exam Card */}
          <div className="bg-indigo-50 p-6 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition">
             <h3 className="font-bold text-indigo-900">📝 Exams</h3>
             <Link to="/admin/create-exam" className="mt-4 block bg-indigo-600 text-white text-center py-2 rounded font-bold">
               Create Exam
             </Link>
          </div>

          {/* Results Card */}
          <div className="bg-purple-50 p-6 rounded-lg shadow-sm border border-purple-200 hover:shadow-md transition">
            <h3 className="font-bold text-purple-900">📊 Results</h3>
            <Link to="/admin/upload-result" className="mt-4 block bg-purple-600 text-white text-center py-2 rounded font-bold">
              Upload Marks
            </Link>
          </div>

          {/* Notice Card */}
          <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-200 hover:shadow-md transition">
            <h3 className="font-bold text-red-900">📢 Notices</h3>
            <Link to="/admin/add-event" className="mt-4 block bg-red-600 text-white text-center py-2 rounded font-bold">
              Add Notice
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
