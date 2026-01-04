import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  
  // ERROR DHOONDNE KE LIYE VARIABLES
  const [authPhone, setAuthPhone] = useState("");
  const [cleanPhone, setCleanPhone] = useState("");
  const [dbError, setDbError] = useState("");

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // 1. LocalStorage Check
        const savedProfile = localStorage.getItem('student_profile');
        if (savedProfile) {
          setStudent(JSON.parse(savedProfile));
          setLoading(false);
        }

        // 2. Fresh Data Check
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const p = user.phone || "";
          setAuthPhone(p);

          // Last 10 digits nikalo (India numbers ke liye)
          const c = p.replace(/\D/g, '').slice(-10); 
          setCleanPhone(c);

          console.log(`Searching for Phone: ${p} OR ${c}`);

          // Query: Try matching full phone OR last 10 digits
          const { data: studentData, error } = await supabase
            .from('students')
            .select('*')
            .or(`contact_number.eq.${p},contact_number.eq.${c}`) // Dono try karo
            .maybeSingle();

          if (error) {
            setDbError(error.message);
            console.error(error);
          }
          
          if (studentData) {
            setStudent(studentData);
            localStorage.setItem('student_profile', JSON.stringify(studentData));
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = "/";
  };

  if (loading) return <div className="p-10 text-center text-blue-900 font-bold">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white p-4 flex justify-between items-center">
        <h1 className="font-bold">Student Portal</h1>
        <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded text-sm">Logout</button>
      </nav>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        
        {student ? (
          // === SUCCESS: PROFILE FOUND ===
          <>
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-600">
              <h2 className="text-2xl font-bold uppercase">{student.full_name}</h2>
              <p className="text-gray-500">Class: {student.class_name} | Roll No: {student.roll_number || 'N/A'}</p>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div onClick={() => navigate('/student/result')} className="bg-white p-6 rounded shadow cursor-pointer">📊 Check Result</div>
              <div onClick={() => navigate('/student/fees')} className="bg-white p-6 rounded shadow cursor-pointer">💰 Fee Status</div>
              <div onClick={() => navigate('/student/notices')} className="bg-white p-6 rounded shadow cursor-pointer">📢 Notices</div>
              <div onClick={() => navigate('/profile-setup')} className="bg-white p-6 rounded shadow cursor-pointer">⚙️ Profile</div>
            </div>
          </>
        ) : (
          // === FAILURE: PROFILE NOT FOUND (DEBUG SCREEN) ===
          <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center">
            <h3 className="text-xl font-bold text-red-700 mb-2">❌ Profile Not Found</h3>
            <p className="text-gray-600 mb-4">Your login was successful, but we couldn't find your student record.</p>

            {/* 👇 YE KALA BOX AAPKO BATAYEGA KI ERROR KYA HAI 👇 */}
            <div className="bg-black text-green-400 p-4 rounded text-left font-mono text-sm overflow-auto">
              <p className="text-white border-b border-gray-700 pb-1 mb-2">DEBUG INFO (Show this to Admin)</p>
              <p>1. Login Phone: <span className="text-yellow-300">{authPhone}</span></p>
              <p>2. Searching For: <span className="text-yellow-300">{cleanPhone}</span></p>
              <p>3. DB Error: <span className="text-red-400">{dbError || "No Permission Error (Check RLS)"}</span></p>
              <p className="mt-2 text-gray-500">
                Solution: Admin must add a student with contact number: 
                <span className="text-white font-bold"> {cleanPhone} </span>
              </p>
            </div>

            <button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
              Try Reloading
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
