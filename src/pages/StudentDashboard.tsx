import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);

  // 1. Data Fetching (Automatic Login Detection)
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Step A: Check kaun login hai
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          console.log("Logged In User Phone:", user.phone); // Debugging ke liye

          // Step B: Students table me wo phone number dhundho
          // Note: Make sure aapke 'students' table me 'contact_number' wahi ho jo login me use hua h
          const { data: studentData, error } = await supabase
            .from('students')
            .select('*')
            .eq('contact_number', user.phone) // Ya .eq('email', user.email) agar email use kar rahe hain
            .maybeSingle();

          if (error) throw error;
          
          if (studentData) {
            setStudent(studentData);
          } else {
            console.warn("Student data not found for this user.");
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

  // 2. Logout Function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("adarsh_school_login");
    window.location.href = "/";
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
      
      {/* --- 1. NAVBAR --- */}
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

        {/* --- 2. STUDENT PROFILE CARD (Automatic) --- */}
        {/* Ye wahi card hai jo Result page me tha, par yahan AUTOMATIC data dikhega */}
        {student ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100 transform transition hover:scale-[1.01] duration-300">
            
            {/* Top Blue Banner */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-6 text-white flex flex-col md:flex-row items-center gap-6">
              
              {/* Avatar */}
              <div className="w-20 h-20 bg-white text-blue-900 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-blue-200 shadow-lg">
                {student.full_name?.charAt(0)}
              </div>
              
              {/* Name & Details */}
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-bold">{student.full_name}</h2>
                <p className="text-blue-100 opacity-90">S/o {student.parent_name}</p>
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

            {/* Attendance / Stats Strip (Optional decoration) */}
            <div className="bg-blue-50 p-4 flex justify-around text-center text-blue-900 text-sm font-bold border-b border-gray-100">
               <div>
                 <span className="block text-xl">Active</span>
                 <span className="text-xs font-normal text-gray-500">Status</span>
               </div>
               <div className="border-l border-gray-300"></div>
               <div>
                 <span className="block text-xl">Coming Soon</span>
                 <span className="text-xs font-normal text-gray-500">Attendance</span>
               </div>
            </div>

          </div>
        ) : (
          // Agar Student Database me nahi mila par login hai (Edge Case)
          <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
            <h3 className="text-red-700 font-bold text-lg">⚠️ Profile Not Found</h3>
            <p className="text-red-600 text-sm">You are logged in, but your student details were not found. Please contact Admin.</p>
          </div>
        )}

        {/* --- 3. MENU BUTTONS --- */}
        <div>
          <h3 className="text-gray-700 font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
            Quick Actions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Button 1: Check Result */}
            <div 
              onClick={() => navigate('/student/result')}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">
                📊
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">My Result</h4>
                <p className="text-xs text-gray-500">View marksheet & grades</p>
              </div>
              <span className="ml-auto text-gray-300 group-hover:text-green-600 transition">➔</span>
            </div>

            {/* Button 2: Notice Board */}
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
              <span className="ml-auto text-gray-300 group-hover:text-orange-600 transition">➔</span>
            </div>

            {/* Button 3: Profile Update */}
            <div 
              onClick={() => navigate('/profile-setup')}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex items-center gap-4 group opacity-80"
            >
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">
                ⚙️
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">Settings</h4>
                <p className="text-xs text-gray-500">Update info (Coming Soon)</p>
              </div>
              <span className="ml-auto text-gray-300 group-hover:text-purple-600 transition">➔</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
