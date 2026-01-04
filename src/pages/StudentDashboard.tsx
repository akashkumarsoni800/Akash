import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // ✅ STEP 1: Pehle LocalStorage check karo (Instant Load ke liye)
        const savedProfile = localStorage.getItem('student_profile');
        if (savedProfile) {
          setStudent(JSON.parse(savedProfile));
          setLoading(false); // Loading turant band
        }

        // ✅ STEP 2: Background me Fresh Data lao (Update karne ke liye)
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Phone number format fix (kabhi +91 hota h kabhi nahi)
          // Hum database me bina + ke check karenge agar direct match na ho
          const { data: studentData, error } = await supabase
            .from('students')
            .select('*')
            .eq('contact_number', user.phone)
            .maybeSingle();

          if (error) {
            console.error("DB Error:", error);
          }
          
          if (studentData) {
            setStudent(studentData);
            // ✅ Data ko LocalStorage me save kar lo agli baar ke liye
            localStorage.setItem('student_profile', JSON.stringify(studentData));
          } else if (!savedProfile) {
            // Agar na local me h na DB me, tabhi error dikhao
            console.warn("Student not found via Phone:", user.phone);
          }
        }
      } catch (error) {
        console.error("Error loading data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  // 3. Logout Function (Ab LocalStorage bhi clear karna padega)
  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      await supabase.auth.signOut();
      localStorage.removeItem("adarsh_school_login");
      localStorage.removeItem("student_profile"); // ✅ Profile bhi clear karo
      toast.success("Logged out");
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-blue-50">
        <div className="text-xl font-bold text-blue-900 animate-pulse">
          Loading Your Profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* --- NAVBAR --- */}
      <nav className="bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl">
              🏫
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Adarsh Shishu Mandir</h1>
              <p className="text-xs text-blue-200">Student Portal</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-xs font-bold transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 space-y-8">

        {/* --- PROFILE CARD --- */}
        {student ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100 transform transition hover:scale-[1.01] duration-300">
            
            <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-6 text-white flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-white text-blue-900 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-blue-200 shadow-lg uppercase">
                {student.full_name?.charAt(0) || "S"}
              </div>
              
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-bold uppercase">{student.full_name}</h2>
                <p className="text-blue-100 opacity-90 uppercase">S/o {student.parent_name}</p>
                <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="bg-blue-900 bg-opacity-40 px-3 py-1 rounded-full text-xs font-bold border border-blue-400">
                    Class: {student.class_name}
                  </span>
                  <span className="bg-blue-900 bg-opacity-40 px-3 py-1 rounded-full text-xs font-bold border border-blue-400">
                    Roll No: {student.roll_number || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
            <h3 className="text-red-700 font-bold text-lg">⚠️ Profile Not Found</h3>
            <p className="text-red-600 text-sm">Reloading might fix this...</p>
            <button onClick={() => window.location.reload()} className="mt-2 text-blue-600 underline">Reload Page</button>
          </div>
        )}

        {/* --- MENU BUTTONS --- */}
        <div>
          <h3 className="text-gray-700 font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
            Quick Actions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Result */}
            <div 
              onClick={() => navigate('/student/result')}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">
                📊
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">My Result</h4>
                <p className="text-xs text-gray-500">View marksheet</p>
              </div>
            </div>

            {/* 2. Fees */}
            <div 
              onClick={() => navigate('/student/fees')}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">
                💰
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">Fee Status</h4>
                <p className="text-xs text-gray-500">Check dues & payments</p>
              </div>
            </div>

            {/* 3. Notice */}
            <div 
              onClick={() => navigate('/student/notices')}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">
                📢
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">Notice Board</h4>
                <p className="text-xs text-gray-500">School announcements</p>
              </div>
            </div>

            {/* 4. Profile Settings */}
            <div 
              onClick={() => navigate('/profile-setup')}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">
                ⚙️
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">Update Profile</h4>
                <p className="text-xs text-gray-500">Edit Name/Father Name</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
