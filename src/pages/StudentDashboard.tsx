import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  
  // Debugging Variable
  const [debugLog, setDebugLog] = useState<string>("");

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // 1. LocalStorage Check (Fast Load)
        const savedProfile = localStorage.getItem('student_profile');
        if (savedProfile) {
          setStudent(JSON.parse(savedProfile));
          setLoading(false);
        }

        // 2. Fresh Data from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const authPhone = user.phone || "";
          
          // Clean Number: +91 hatake last 10 digit nikalo
          const cleanPhone = authPhone.replace(/\D/g, '').slice(-10);

          setDebugLog(`Checking contact_number for: ${cleanPhone}`);

          // Ab sirf 'contact_number' check karenge (kyunki SQL ne sab data wahan dal diya hai)
          const { data: studentData, error } = await supabase
            .from('students')
            .select('*')
            .or(`contact_number.eq.${cleanPhone},contact_number.eq.${authPhone}`)
            .maybeSingle();

          if (error) {
            console.error("DB Error:", error);
            setDebugLog("DB Error: " + error.message);
          }
          
          if (studentData) {
            setStudent(studentData);
            localStorage.setItem('student_profile', JSON.stringify(studentData));
          } else {
            console.warn("Student not found.");
            setDebugLog(`Not Found! DB me 'contact_number' check karein. Searching for: ${cleanPhone}`);
          }
        }
      } catch (error: any) {
        console.error("Error loading data", error);
        setDebugLog("Error: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-blue-50">
        <div className="text-xl font-bold text-blue-900 animate-pulse">
          Loading Profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Navbar */}
      <nav className="bg-blue-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl">🏫</div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Adarsh Shishu Mandir</h1>
            <p className="text-xs text-blue-200">Student Portal</p>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-xs font-bold transition">
          Logout
        </button>
      </nav>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        
        {student ? (
          <>
            {/* SUCCESS PROFILE CARD */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
              <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-6 text-white flex items-center gap-6">
                <div className="w-16 h-16 bg-white text-blue-900 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-blue-200 uppercase">
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

            {/* Menu Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div onClick={() => navigate('/student/result')} className="bg-white p-5 rounded-xl shadow cursor-pointer flex items-center gap-4 hover:shadow-md transition">
                 <div className="text-3xl bg-green-100 p-2 rounded-full">📊</div>
                 <div><h4 className="font-bold">Result</h4><p className="text-xs text-gray-500">View marksheet</p></div>
              </div>
              <div onClick={() => navigate('/student/fees')} className="bg-white p-5 rounded-xl shadow cursor-pointer flex items-center gap-4 hover:shadow-md transition">
                 <div className="text-3xl bg-yellow-100 p-2 rounded-full">💰</div>
                 <div><h4 className="font-bold">Fees</h4><p className="text-xs text-gray-500">Check dues</p></div>
              </div>
              <div onClick={() => navigate('/student/notices')} className="bg-white p-5 rounded-xl shadow cursor-pointer flex items-center gap-4 hover:shadow-md transition">
                 <div className="text-3xl bg-orange-100 p-2 rounded-full">📢</div>
                 <div><h4 className="font-bold">Notices</h4><p className="text-xs text-gray-500">Updates</p></div>
              </div>
              <div onClick={() => navigate('/profile-setup')} className="bg-white p-5 rounded-xl shadow cursor-pointer flex items-center gap-4 hover:shadow-md transition">
                 <div className="text-3xl bg-purple-100 p-2 rounded-full">⚙️</div>
                 <div><h4 className="font-bold">Profile</h4><p className="text-xs text-gray-500">Edit info</p></div>
              </div>
            </div>
          </>
        ) : (
          // ERROR STATE
          <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center">
            <h3 className="text-xl font-bold text-red-700">⚠️ Profile Not Found</h3>
            <p className="text-gray-600 text-sm mb-4">We checked for your number but couldn't find the record.</p>
            
            <div className="bg-black text-green-400 p-4 rounded text-left text-xs font-mono overflow-auto mb-4">
              <p><strong>Debug Info:</strong></p>
              <p>{debugLog}</p>
              <p className="mt-2 text-gray-400">Please verify that 'contact_number' column exists and has data.</p>
            </div>
            
            <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">
              Reload Page
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentDashboard;
