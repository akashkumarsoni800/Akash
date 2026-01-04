import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("Student");

  // 1. Data Fetching (Student ka naam lane ke liye)
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Profile table ya Students table se naam dhundho
          const { data: student } = await supabase
            .from('students') // Ya 'profiles' agar wahan naam hai
            .select('full_name')
            .eq('contact_number', user.phone) // Ya email check karein agar email se login hai
            .maybeSingle(); // single() ki jagah maybeSingle() safe hota hai

          if (student) {
            setStudentName(student.full_name);
          }
        }
      } catch (error) {
        console.error("Error loading student data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  // 2. ✅ LOGOUT FUNCTION (Ye sabse zaruri hai)
  const handleLogout = async () => {
    try {
      // 1. LocalStorage clear karein
      localStorage.removeItem("adarsh_school_login");
      
      // 2. Supabase se sign out karein
      await supabase.auth.signOut();
      
      // 3. Success Message
      toast.success("Logged out successfully");

      // 4. Login page par bhejein (Force Redirect)
      window.location.href = "/"; 
      
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-blue-600 font-bold animate-pulse">
        Loading Student Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      
      {/* --- NAVBAR --- */}
      <nav className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white text-blue-600 p-2 rounded-full w-10 h-10 flex items-center justify-center font-bold">
            🎓
          </div>
          <div>
            <h1 className="text-lg font-bold">Adarsh Shishu Mandir</h1>
            <p className="text-xs text-blue-100">Student Portal</p>
          </div>
        </div>

        {/* 👇 YE RAHA LOGOUT BUTTON */}
        <button 
          onClick={handleLogout} 
          className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition shadow-sm"
        >
          Logout 🚪
        </button>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-4xl mx-auto p-6">
        
        {/* Welcome Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome, {studentName}! 👋</h2>
            <p className="text-gray-500 mt-1">Class: 10th - A (Example)</p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Result */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-bold text-gray-800">My Result</h3>
            <p className="text-gray-500 text-sm mt-1">Check your exam marks and progress report.</p>
            <button className="mt-4 text-blue-600 font-bold text-sm hover:underline">View Result →</button>
          </div>

          {/* Card 2: Notice Board */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer">
            <div className="text-4xl mb-3">📢</div>
            <h3 className="text-lg font-bold text-gray-800">Notice Board</h3>
            <p className="text-gray-500 text-sm mt-1">View school announcements and holidays.</p>
            <button className="mt-4 text-blue-600 font-bold text-sm hover:underline">View Notices →</button>
          </div>

          {/* Card 3: Profile */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer opacity-70">
            <div className="text-4xl mb-3">👤</div>
            <h3 className="text-lg font-bold text-gray-800">My Profile</h3>
            <p className="text-gray-500 text-sm mt-1">View personal details (Coming Soon).</p>
          </div>

          {/* Card 4: Fees */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer opacity-70">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-lg font-bold text-gray-800">Fee Status</h3>
            <p className="text-gray-500 text-sm mt-1">Check pending dues (Coming Soon).</p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
