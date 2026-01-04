import React from "react";
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from "../supabaseClient"; 
import { useQueryClient, useQuery } from '@tanstack/react-query';

// Hooks Imports
import { 
  useListApprovals, 
  useApproveStudent, 
  useGetAllApprovedStudents,
  useGetAllTeachers,
  useGetCallerUserProfile
} from "../hooks/useQueries"; 

const AdminDashboard = () => {
  const navigate = useNavigate();

  // 1. Data Fetching Hooks
  const { data: profile } = useGetCallerUserProfile();
  const { data: pendingStudents, isLoading: loadingPending } = useListApprovals();
  const { mutate: approveStudent } = useApproveStudent();
  const { data: approvedStudents } = useGetAllApprovedStudents();
  const { data: teachers } = useGetAllTeachers();

  // 2. Logout Function
  const handleLogout = async () => {
    localStorage.removeItem("adarsh_school_login"); // Localstorage clear
    await supabase.auth.signOut(); // Supabase clear
    window.location.href = "/"; // Force Reload
  };

  // 3. Counts Calculation
  const totalStudentCount = approvedStudents?.length || 0;
  const totalTeacherCount = teachers?.length || 0;

  // 4. Loading State
  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
         <div className="text-xl text-blue-600 animate-pulse">Loading Admin Profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-xl font-bold">Adarsh Shishu Mandir</h1>
          <p className="text-xs text-gray-300">
            Welcome, {profile.name || "Admin"}
          </p>
        </div>
        <button 
          onClick={handleLogout} 
          className="bg-red-500 px-4 py-2 rounded text-sm hover:bg-red-600 transition"
        >
          Logout
        </button>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Section 1: Pending Approvals */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
            Pending Admission Requests
          </h2>

          {pendingStudents && pendingStudents.length === 0 ? (
            <p className="text-gray-500 italic">No pending approvals at the moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3 border-b">Student Name</th>
                    <th className="p-3 border-b">Class</th>
                    <th className="p-3 border-b">Father's Name</th>
                    <th className="p-3 border-b">Contact</th>
                    <th className="p-3 border-b">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingStudents?.map((student: any) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{student.full_name}</td>
                      <td className="p-3">{student.class_name}</td>
                      <td className="p-3">{student.parent_name}</td>
                      <td className="p-3">{student.contact_number}</td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            if(window.confirm(`Approve admission for ${student.full_name}?`)) {
                              approveStudent(student.id);
                            }
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition shadow-sm"
                        >
                          Approve ✅
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Quick Stats & Actions (GRID UPDATED) */}
        {/* Yahan maine grid-cols-2 aur lg:grid-cols-4 kar diya hai taaki 4 cards fit ho jayein */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Students */}
          <div className="bg-blue-100 p-6 rounded-lg text-blue-900 shadow-sm border border-blue-200">
            <h3 className="font-bold uppercase text-xs tracking-wider">Total Students</h3>
            <p className="text-4xl font-extrabold mt-2">{totalStudentCount}</p>
            <Link 
              to="/admin/add-student" 
              className="text-xs font-bold underline mt-3 block hover:text-blue-700 flex items-center gap-1"
            >
              <span>+</span> Add New Student
            </Link>
          </div>

          {/* Card 2: Teachers */}
          <div className="bg-green-100 p-6 rounded-lg text-green-900 shadow-sm border border-green-200">
            <h3 className="font-bold uppercase text-xs tracking-wider">Teachers</h3>
            <p className="text-4xl font-extrabold mt-2">{totalTeacherCount}</p>
            <Link to="/admin/add-teacher" className="text-xs font-bold underline mt-3 block hover:text-green-700">
              + Add New Teacher
            </Link>
          </div>

          {/* Card 3: Exam Dept */}
          <div className="bg-purple-100 p-6 rounded-lg text-purple-900 shadow-sm border border-purple-200 flex flex-col justify-between">
            <div>
              <h3 className="font-bold uppercase text-xs tracking-wider">Exam Dept.</h3>
              <p className="text-sm mt-1 opacity-80">Manage Marks</p>
            </div>
            <Link 
              to="/admin/upload-result" 
              className="mt-4 bg-purple-600 text-white text-center py-2 rounded text-sm hover:bg-purple-700 transition shadow"
            >
              Upload Marks 📤
            </Link>
          </div>

          {/* Card 4: Fees Section (Jo pehle bahar tha, ab andar hai) */}
          <div className="bg-yellow-100 p-6 rounded-lg text-yellow-900 shadow-sm border border-yellow-200 flex flex-col justify-between">
            <div>
                <h3 className="font-bold uppercase text-xs tracking-wider">Accounts</h3>
                <p className="text-sm mt-1 opacity-80">Check pending dues</p>
            </div>
            <Link 
                to="/admin/manage-fees" 
                className="mt-4 inline-block bg-yellow-600 text-white text-center py-2 rounded text-sm font-bold hover:bg-yellow-700"
            >
                Manage Fees 💰
            </Link>
          </div>
// Jahan baki cards hain wahan ye naya card jodein
<div className="bg-indigo-100 p-6 rounded-lg text-indigo-900 shadow-sm border border-indigo-200">
   <h3 className="font-bold uppercase text-xs tracking-wider">Exam Section</h3>
   <Link 
     to="/admin/create-exam" 
     className="mt-4 block bg-indigo-600 text-white text-center py-2 rounded text-sm font-bold hover:bg-indigo-700"
   >
     ➕ Create New Exam
   </Link>
</div>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
