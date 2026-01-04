import React from "react";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "../supabaseClient"; 
// Hooks Imports (Make sure ye path sahi ho)
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
  const { data: pendingStudents } = useListApprovals();
  const { mutate: approveStudent } = useApproveStudent();
  const { data: approvedStudents } = useGetAllApprovedStudents();
  const { data: teachers } = useGetAllTeachers();

  // 2. Logout Function
  const handleLogout = async () => {
    localStorage.removeItem("adarsh_school_login"); 
    await supabase.auth.signOut(); 
    window.location.href = "/"; 
  };

  // 3. Counts Calculation
  const totalStudentCount = approvedStudents?.length || 0;
  const totalTeacherCount = teachers?.length || 0;

  // 4. Loading State
  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
         <div className="text-xl text-blue-600 animate-pulse">Loading Admin Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Navbar (Mobile ke liye, kyunki Desktop pe Sidebar hai) */}
      <div className="md:hidden bg-blue-900 text-white p-4 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-xl font-bold">Adarsh Shishu Mandir</h1>
        </div>
        <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded text-xs">
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>

        {/* Section 1: Pending Approvals */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
            🔔 Pending Admission Requests
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
                    <th className="p-3 border-b">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingStudents?.map((student: any) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{student.full_name}</td>
                      <td className="p-3">{student.class_name}</td>
                      <td className="p-3">{student.parent_name}</td>
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

        {/* Section 2: Quick Stats & Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Card 1: Students */}
          <div className="bg-blue-100 p-6 rounded-lg text-blue-900 shadow-sm border border-blue-200">
            <h3 className="font-bold uppercase text-xs tracking-wider">Total Students</h3>
            <p className="text-4xl font-extrabold mt-2">{totalStudentCount}</p>
            <Link to="/admin/add-student" className="text-xs font-bold underline mt-3 block hover:text-blue-700">
              + Add New Student
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

          {/* Card 3: Fees Section */}
          <div className="bg-yellow-100 p-6 rounded-lg text-yellow-900 shadow-sm border border-yellow-200 flex flex-col justify-between">
            <div>
                <h3 className="font-bold uppercase text-xs tracking-wider">Accounts</h3>
                <p className="text-sm mt-1 opacity-80">Check pending dues</p>
            </div>
            <Link to="/admin/manage-fees" className="mt-4 block bg-yellow-600 text-white text-center py-2 rounded text-sm font-bold hover:bg-yellow-700">
                Manage Fees 💰
            </Link>
          </div>

          {/* Card 4: Exam Section (Marks Upload) */}
          <div className="bg-purple-100 p-6 rounded-lg text-purple-900 shadow-sm border border-purple-200 flex flex-col justify-between">
            <div>
              <h3 className="font-bold uppercase text-xs tracking-wider">Result Dept.</h3>
              <p className="text-sm mt-1 opacity-80">Upload Marks</p>
            </div>
            <Link to="/admin/upload-result" className="mt-4 block bg-purple-600 text-white text-center py-2 rounded text-sm hover:bg-purple-700 transition shadow">
              Upload Marks 📤
            </Link>
          </div>

          {/* Card 5: Create Exam (NEW) */}
          <div className="bg-indigo-100 p-6 rounded-lg text-indigo-900 shadow-sm border border-indigo-200 flex flex-col justify-between">
             <div>
               <h3 className="font-bold uppercase text-xs tracking-wider">Exam Papers</h3>
               <p className="text-sm mt-1 opacity-80">Create New Exam</p>
             </div>
             <Link to="/admin/create-exam" className="mt-4 block bg-indigo-600 text-white text-center py-2 rounded text-sm font-bold hover:bg-indigo-700">
               ➕ Create Exam
             </Link>
          </div>

          {/* Card 6: Events & Notices */}
          <div className="bg-red-50 p-6 rounded-lg text-red-900 shadow-sm border border-red-200 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <h3 className="font-bold uppercase text-xs tracking-wider">Announcements</h3>
              <p className="text-2xl font-bold mt-2">Notice Board</p>
            </div>
            <Link to="/admin/add-event" className="mt-4 block w-full bg-red-600 text-white text-center py-2 rounded text-sm font-bold hover:bg-red-700 shadow">
              📢 Add Event
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
