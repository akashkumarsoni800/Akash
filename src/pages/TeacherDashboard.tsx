import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);

  // 1. Data Fetching
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Hum email se teacher ko dhundenge (Ye zyada safe hai)
          const { data: teacher, error } = await supabase
            .from('teachers')
            .select('*')
            .eq('email', user.email) 
            .single();

          if (teacher) {
            setTeacherProfile(teacher);
          } else {
            // Agar database me teacher nahi mila, to temporary dikha do
            setTeacherProfile({ 
              full_name: "Teacher User", 
              subject: "General", 
              email: user.email, 
              phone: "N/A" 
            });
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  // 2. Logout Function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("adarsh_school_login");
    toast.success("Logged out successfully");
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-green-800 font-bold animate-pulse">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Welcome, {teacherProfile?.full_name || 'Teacher'} 👋
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition font-bold text-sm"
        >
          🚪 Logout
        </button>
      </div>

      {!teacherProfile ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center gap-2">
          ⚠️ Teacher profile not found. Please contact Admin.
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">

            {/* Card 1: Subject */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-row items-center justify-between pb-2">
                <h3 className="text-sm font-medium text-gray-500">My Subject</h3>
                <span className="text-gray-400">📖</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{teacherProfile.subject || "All Subjects"}</div>
              <p className="text-xs text-gray-500 mt-1">Primary Subject</p>
            </div>

            {/* Card 2: Upload Marks (Actionable) */}
            <div 
              className="bg-white p-6 rounded-xl shadow-sm border-2 border-blue-100 cursor-pointer hover:border-blue-500 transition-colors group"
              onClick={() => navigate('/admin/upload-result')}
            >
              <div className="flex flex-row items-center justify-between pb-2">
                <h3 className="text-sm font-bold text-blue-700 group-hover:text-blue-800">Upload Marks</h3>
                <span className="text-blue-500 text-xl">📤</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">Action</div>
              <p className="text-xs text-gray-500 mt-1">Click to enter student marks</p>
            </div>

            {/* Card 3: Contact */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-row items-center justify-between pb-2">
                <h3 className="text-sm font-medium text-gray-500">Contact Info</h3>
                <span className="text-gray-400">👤</span>
              </div>
              <div className="text-sm font-bold text-gray-800 truncate">{teacherProfile.email}</div>
              <p className="text-xs text-gray-500 mt-1">{teacherProfile.phone || "No Phone"}</p>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid gap-6 md:grid-cols-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold">Quick Actions</h3>
                <p className="text-sm text-gray-500">Manage your daily tasks</p>
              </div>
              <div className="p-6">
                 <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200 flex items-start gap-3">
                    <span className="text-xl">🚧</span>
                    <span className="text-sm">
                      Attendance and Class Management features are coming soon. 
                      Currently, please use the <b>Upload Marks</b> section.
                    </span>
                 </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
