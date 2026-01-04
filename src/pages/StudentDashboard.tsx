import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import DashboardHeader from '../components/DashboardHeader';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [debugLog, setDebugLog] = useState<string>("");

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const authEmail = user.email;
          setDebugLog(`Searching for Email: ${authEmail}`);

          const { data: studentData, error } = await supabase
            .from('students')
            .select('*')
            .eq('email', authEmail)
            .maybeSingle();

          if (error) setDebugLog("DB Error: " + error.message);

          if (studentData) {
            setStudent(studentData);
            localStorage.setItem('student_profile', JSON.stringify(studentData));
          } else {
            setDebugLog(`Student not found! Please check if '${authEmail}' is in 'students' table.`);
          }
        }
      } catch (error: any) {
        console.error("Error loading data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-blue-50">
        <div className="text-xl font-bold text-blue-900 animate-pulse">Loading Profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Stylish Header - Pass Student Data */}
      <DashboardHeader 
        userName={student?.full_name || "Student"} 
        userRole="Student" 
      />

      {/* 2. Main Content Area (pt-20 used for fixed header offset) */}
      <div className="pt-20 p-6 max-w-4xl mx-auto space-y-6">

        {student ? (
          <>
            {/* SUCCESS PROFILE CARD */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
              <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-6 text-white flex items-center gap-6">
                <div className="w-16 h-16 bg-white text-blue-900 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-blue-200 uppercase">
                  {student.full_name?.charAt(0) || "S"}
                </div>
                <div>
                  <h2 className="text-2xl font-bold uppercase">{student.full_name}</h2>
                  <p className="opacity-90 uppercase">S/o {student.parent_name}</p>
                  <span className="bg-blue-900 bg-opacity-40 px-3 py-1 rounded-full text-xs font-bold border border-blue-400 mt-2 inline-block">
                    Class: {student.class_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div onClick={() => navigate('/student/result')} className="bg-white p-5 rounded-xl shadow cursor-pointer flex items-center gap-4 hover:shadow-md transition group">
                 <div className="text-3xl bg-green-100 p-2 rounded-full group-hover:scale-110 transition">📊</div>
                 <div><h4 className="font-bold">Result</h4><p className="text-xs text-gray-500">View marksheet</p></div>
              </div>
              
              <div onClick={() => navigate('/student/fees')} className="bg-white p-5 rounded-xl shadow cursor-pointer flex items-center gap-4 hover:shadow-md transition group">
                 <div className="text-3xl bg-yellow-100 p-2 rounded-full group-hover:scale-110 transition">💰</div>
                 <div><h4 className="font-bold">Fees</h4><p className="text-xs text-gray-500">Check dues</p></div>
              </div>

              <div onClick={() => navigate('/student/notices')} className="bg-white p-5 rounded-xl shadow cursor-pointer flex items-center gap-4 hover:shadow-md transition group">
                 <div className="text-3xl bg-orange-100 p-2 rounded-full group-hover:scale-110 transition">📢</div>
                 <div><h4 className="font-bold">Notices</h4><p className="text-xs text-gray-500">Updates</p></div>
              </div>

              {/* 🔑 Reset Password Action */}
              <div onClick={() => navigate('/reset-password')} className="bg-white p-5 rounded-xl shadow-md border-2 border-blue-50 cursor-pointer flex items-center gap-4 hover:border-blue-500 transition group">
                 <div className="text-3xl bg-blue-100 p-2 rounded-full group-hover:scale-110 transition">🔑</div>
                 <div><h4 className="font-bold text-blue-700">Change Password</h4><p className="text-xs text-gray-500">Security settings</p></div>
              </div>
            </div>
          </>
        ) : (
          /* ERROR STATE */
          <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center">
            <h3 className="text-xl font-bold text-red-700">⚠️ Profile Not Found</h3>
            <div className="bg-black text-green-400 p-4 rounded text-left text-xs font-mono mt-4 overflow-auto">
              <p><strong>Debug Info:</strong> {debugLog}</p>
            </div>
            <button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded font-bold">Reload Page</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
