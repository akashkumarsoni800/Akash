import React from "react";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "../supabaseClient";
// Ab ye import ERROR nahi dega kyunki aapne file bana li hai 👇
import { 
  useListApprovals, 
  useApproveStudent, 
  useGetAllApprovedStudents,
  useGetAllTeachers,
  useGetCallerUserProfile
} from "../hooks/useQueries"; 

const AdminDashboard = () => {
  const navigate = useNavigate();

  // 1. Data Fetching Hooks (Ab ye chalenge)
  const { data: profile } = useGetCallerUserProfile();
  const { data: pendingStudents, isLoading: loadingPending } = useListApprovals();
  const { mutate: approveStudent } = useApproveStudent();
  const { data: approvedStudents } = useGetAllApprovedStudents();
  const { data: teachers } = useGetAllTeachers();

  // 2. Logout Function
  const handleLogout = async () => {
    localStorage.removeItem("adarsh_school_login"); 
    await supabase.auth.signOut(); 
    window.location.href = "/"; 
  };

  // 3. Counts
  const totalStudentCount = approvedStudents?.length || 0;
  const totalTeacherCount = teachers?.length || 0;

  // 4. Loading State
  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
         <div className="text-xl text-blue-900 font-bold animate-pulse">
           Loading Dashboard...
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Navbar */}
      <nav className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold">Adarsh Shishu Mandir</h1>
          <p className="text-xs text-blue-200">Welcome, {profile.name}</p>
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
            <p>Loading requests...</p>
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
                    <th className="p-3">Parent</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pendingStudents?.map((student: any) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-bold text-blue-900">{student.full_name}</td>
                      <td className="p-3">{student.class_name}</td>
                      <td className="p-3">{student.parent_name}</td>
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
