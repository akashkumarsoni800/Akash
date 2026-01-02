import React from "react";
import { supabase } from "../supabaseClient"; // <-- Ye line add karein
// Is line ko add karein (ya update karein agar pehle se hai)
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
// 1. Imports update karein
import { 
  useListApprovals, 
  useApproveStudent, 
  useInternetIdentity, 
  useGetCallerUserProfile,
  // Ye neeche wale 2 naye hooks add karein:
  useGetAllApprovedStudents,
  useGetAllTeachers
} from "../hooks/useQueries"; // Path check kar lena (shayad ../../hooks/index ho)

const Dashboard = () => {
  // 1. Hooks se data aur functions nikaale
  const { data: pendingStudents, isLoading } = useListApprovals();
  const { mutate: approveStudent } = useApproveStudent();
  const { logout } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
const { data: approvedStudents } = useGetAllApprovedStudents();
  const { data: teachers } = useGetAllTeachers();

  // Calculation (Agar data abhi load nahi hua to 0 maano)
  const totalStudentCount = approvedStudents?.length || 0;
  const totalTeacherCount = teachers?.length || 0;
  if (isLoading) return <div className="p-10 text-center">Loading Dashboard...</div>;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-xl font-bold">Adarsh Shishu Mandir</h1>
          <p className="text-xs text-gray-300">Welcome, {profile.name}</p>
        </div>
        <button 
          onClick={logout} 
          className="bg-red-500 px-4 py-2 rounded text-sm hover:bg-red-600"
        >
          Logout
        </button>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        
        {/* Section 1: Pending Approvals */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
            Pending Admission Requests
          </h2>

          {pendingStudents && pendingStudents.length === 0 ? (
            <p className="text-gray-500">No pending approvals at the moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Father's Name</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Action</th>
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
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
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

        {/* Section 2: Quick Stats (Optional Placeholder) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-100 p-6 rounded-lg text-blue-900">
            <h3 className="font-bold">Total Students</h3>
           <p className="text-3xl mt-2">{totalStudentCount}</p>
          </div>
          <div className="bg-green-100 p-6 rounded-lg text-green-900">
            <h3 className="font-bold">Teachers</h3>
           <p className="text-3xl mt-2">{totalTeacherCount}</p>
          </div>
          {/* EXAMS & RESULTS SECTION */}
<div className="bg-purple-100 p-6 rounded-lg text-purple-900 flex flex-col justify-between">
  <div>
    <h3 className="font-bold">Exam Dept.</h3>
    <p className="text-sm mt-2 opacity-80">Manage Marks & Results</p>
  </div>
  
  {/* Ye Button aapko Upload Page par le jayega */}
  <Link 
    to="/admin/upload-result" 
    className="mt-4 bg-purple-600 text-white text-center py-2 rounded text-sm hover:bg-purple-700 transition"
  >
    Upload Marks 📤
  </Link>
</div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;// --- EXAM & RESULT MODULES ---

// 1. Saare Exams ki list lao
export const useGetAllExams = () => {
  return useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('exams').select('*');
      if (error) throw error;
      return data || [];
    }
  });
};

// 2. Result (Marks) Save karo
export const useAddResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (resultData: any) => {
      const { error } = await supabase.from('results').insert([{
        student_id: resultData.studentId,
        exam_id: resultData.examId,
        marks_obtained: resultData.marks,
        remarks: resultData.remarks
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marks Uploaded Successfully!");
    }
  });
};

function useMutation(arg0: { mutationFn: (resultData: any) => Promise<void>; onSuccess: () => void; }) {
  throw new Error("Function not implemented.");
}
