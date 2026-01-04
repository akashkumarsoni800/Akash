import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>(""); // Error pakadne ke liye

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // 1. LocalStorage check (Fast Load)
        const savedProfile = localStorage.getItem('student_profile');
        if (savedProfile) {
          setStudent(JSON.parse(savedProfile));
          setLoading(false);
        }

        // 2. Fresh Data from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const authPhone = user.phone || "";
          
          // --- MAGIC FIX: Number Clean Karo ---
          // Agar number '+9198...' hai, to last ke 10 digit nikalo ('98...')
          // Taki DB me agar bina +91 ke save ho, tab bhi mil jaye
          const cleanPhone = authPhone.replace('+91', '').replace('+', '').slice(-10);

          setDebugInfo(`Auth Phone: ${authPhone} | Cleaning to: ${cleanPhone}`);

          // Query: Ya to pura number match kare OR bina +91 wala match kare
          const { data: studentData, error } = await supabase
            .from('students')
            .select('*')
            .or(`contact_number.eq.${authPhone},contact_number.eq.${cleanPhone}`) // ✅ Both Check
            .maybeSingle();

          if (error) {
            console.error("DB Error:", error);
          }
          
          if (studentData) {
            setStudent(studentData);
            localStorage.setItem('student_profile', JSON.stringify(studentData));
          } else {
            console.warn("Student not found for phone:", authPhone);
          }
        } else {
          // Agar User Login hi nahi hai
          setDebugInfo("No User Found in Supabase Auth session.");
        }
      } catch (error: any) {
        console.error("Error loading data", error);
        setDebugInfo("Error: " + error.message);
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
      localStorage.clear(); // Sab kuch clear karo
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
      <nav className="bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl">🏫</div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Adarsh Shishu Mandir</h1>
              <p className="text-xs text-blue-200">Student Portal</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded text-xs font-bold">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 space-y-8">

        {student ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
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
          <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center space-y-2">
            <h3 className="text-red-700 font-bold text-lg">⚠️ Profile Not Found</h3>
            <p className="text-red-600 text-sm">We could not match your login phone number with the student database.</p>
            
            {/* 👇 DEBUGGING BOX: Ye aapko batayega ki error kyun aa raha hai */}
            <div className="bg-black text-green-400 p-4 rounded text-left text-xs font-mono overflow-auto mt-4">
              <p><strong>Debug Info:</strong></p>
              <p>{debugInfo}</p>
              <p>Please check if 'contact_number' in 'students' table matches your login number.</p>
            </div>

            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-blue-600 text-white px-4 py-2 rounded mt-2">
              Try Reloading
            </button>
          </div>
        )}

        {/* Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Card 1: Result */}
           <div onClick={() => navigate('/student/result')} className="bg-white p-5 rounded-xl shadow cursor-pointer flex items-center gap-4 hover:shadow-md">
              <div className="text-3xl bg-green-100 p-3 rounded-full">📊</div>
              <div><h4 className="font-bold">My Result</h4><p className="text-xs text-gray-500">View marksheet</p></div>
           </div>
           
           {/* Card 2: Fees */}
           <div onClick={() => navigate('/student/fees')} className="bg-white p-5 rounded-xl shadow cursor-pointer flex items-center gap-4 hover:shadow-md">
              <div className="text-3xl bg-yellow-100 p-3 rounded-full">💰</div>
              <div><h4 className="font-bold">Fee Status</h4><p className="text-xs text-gray-500">Check dues</p></div>
           </div>

           {/* Card 3: Notice */}
           <div onClick={() => navigate('/student/notices')} className="bg-white p-5 rounded-xl shadow cursor-pointer flex items-center gap-4 hover:shadow-md">
              <div className="text-3xl bg-orange-100 p-3 rounded-full">📢</div>
              <div><h4 className="font-bold">Notices</h4><p className="text-xs text-gray-500">Announcements</p></div>
           </div>

           {/* Card 4: Profile */}
           <div onClick={() => navigate('/profile-setup')} className="bg-white p-5 rounded-xl shadow cursor-pointer flex items-center gap-4 hover:shadow-md">
              <div className="text-3xl bg-purple-100 p-3 rounded-full">⚙️</div>
              <div><h4 className="font-bold">Settings</h4><p className="text-xs text-gray-500">Update Profile</p></div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
