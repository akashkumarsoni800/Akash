import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "../supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// --- 🛠️ INTERNAL HOOKS (Yahi define kar diye taki file missing error na aaye) ---

// 1. Profile Hook
const useGetCallerUserProfile = () => {
  return { 
    data: { name: 'Principal Dinesh', email: 'admin@school.com' }, 
    isLoading: false 
  };
};

// 2. Pending Students Hook
const useListApprovals = () => {
  return useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('approval_status', 'pending');
      if (error) return []; // Error aaye to empty array do, crash mat karo
      return data || [];
    }
  });
};

// 3. Approve Student Hook
const useApproveStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: any) => {
      const { error } = await supabase
        .from('students')
        .update({ approval_status: 'approved' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success("Student Approved! ✅");
    }
  });
};

// 4. Approved Students Hook
const useGetAllApprovedStudents = () => {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('approval_status', 'approved');
      return data || [];
    }
  });
};

// 5. Teachers Hook
const useGetAllTeachers = () => {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data } = await supabase.from('teachers').select('*');
      return data || [];
    }
  });
};


// --- 🚀 MAIN DASHBOARD COMPONENT ---

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Data Fetching
  const { data: profile } = useGetCallerUserProfile();
  const { data: pendingStudents, isLoading: loadingPending } = useListApprovals();
  const { mutate: approveStudent } = useApproveStudent();
  const { data: approvedStudents } = useGetAllApprovedStudents();
  const { data: teachers } = useGetAllTeachers();

  // Logout
  const handleLogout = async () => {
    localStorage.removeItem("adarsh_school_login"); 
    await supabase.auth.signOut(); 
    window.location.href = "/"; 
  };

  // Counts
  const totalStudentCount = approvedStudents?.length || 0;
  const totalTeacherCount = teachers?.length || 0;

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

        {/* Section 1: Pending Approvals */}
        <div className="bg-white rounded-lg shadow p-6 mb-8 border-t-4 border-orange-500">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            🔔 Pending Admissions
            {pendingStudents && pendingStudents.length > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {pendingStudents.length} New
              </span>
            )}
          </h2>

          {loadingPending ? (
            <p>Loading...</p>
          ) : pendingStudents && pendingStudents.length === 0 ? (
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
                  {pendingStudents?.map((student: any) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-bold text-blue-900">{student.full_name}</td>
                      <td className="p-3">{student.class_name}</td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            if(window.confirm(`Approve ${student.full_name}?`)) {
                              approveStudent(student.id);
                            }
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

        {/* Section 2: Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Card 1: Students */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
            <h3 className="text-3xl font-bold text-blue-900">{totalStudentCount}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase">Total Students</p>
            <Link to="/admin/add-student" className="text-blue-600 text-sm font-bold mt-4 block hover:underline">
              + Add New Student
            </Link>
          </div>

          {/* Card 2: Teachers */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
            <h3 className="text-3xl font-bold text-green-900">{totalTeacherCount}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase">Total Teachers</p>
            <Link to="/admin/add-teacher" className="text-green-600 text-sm font-bold mt-4 block hover:underline">
              + Register Teacher
            </Link>
          </div>

          {/* Card 3: Fees */}
          <div className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-200 hover:shadow-md transition">
            <h3 className="font-bold text-yellow-900">💰 Accounts</h3>
            <p className="text-sm text-yellow-800 mt-1">Manage Fees</p>
            <Link to="/admin/manage-fees" className="mt-4 block bg-yellow-600 text-white text-center py-2 rounded font-bold">
              Go to Fees
            </Link>
          </div>

          {/* Card 4: Create Exam */}
          <div className="bg-indigo-50 p-6 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition">
             <h3 className="font-bold text-indigo-900">📝 Exams</h3>
             <p className="text-sm text-indigo-800 mt-1">Create Papers</p>
             <Link to="/admin/create-exam" className="mt-4 block bg-indigo-600 text-white text-center py-2 rounded font-bold">
               Create Exam
             </Link>
          </div>

          {/* Card 5: Results */}
          <div className="bg-purple-50 p-6 rounded-lg shadow-sm border border-purple-200 hover:shadow-md transition">
            <h3 className="font-bold text-purple-900">📊 Results</h3>
            <p className="text-sm text-purple-800 mt-1">Upload Marks</p>
            <Link to="/admin/upload-result" className="mt-4 block bg-purple-600 text-white text-center py-2 rounded font-bold">
              Upload Marks
            </Link>
          </div>

          {/* Card 6: Notices */}
          <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-200 hover:shadow-md transition">
            <h3 className="font-bold text-red-900">📢 Notices</h3>
            <p className="text-sm text-red-800 mt-1">Announcements</p>
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
