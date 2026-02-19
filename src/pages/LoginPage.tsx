import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [studentData, setStudentData] = useState({
    full_name: '',
    father_name: '',
    roll_no: '',
    password: '',
    email: '' // Staff ke liye
  });

  // 🎨 LOADING ANIMATION STATE
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Page load par animation trigger
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (role === 'student') {
        const { data: studentRecord, error: dbError } = await supabase
          .from('students')
          .select('full_name, father_name, roll_no, password, is_approved')
          .eq('full_name', studentData.full_name.trim())
          .eq('father_name', studentData.father_name.trim())
          .eq('roll_no', studentData.roll_no.trim())
          .maybeSingle();

        if (dbError) throw dbError;
        if (!studentRecord) {
          toast.error("Student record not found! Check name, father's name & roll no.");
          setLoading(false);
          return;
        }

        if (studentRecord.password !== studentData.password) {
          toast.error("❌ Wrong password!");
          setLoading(false);
          return;
        }

        if (studentRecord.is_approved !== 'approved') {
          toast.error("⏳ Account Approval Pending!");
          setLoading(false);
          return;
        }

        toast.success(`🎉 Welcome, ${studentRecord.full_name}!`);
        navigate('/student/dashboard');
      } 
      else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: studentData.email,
          password: studentData.password,
        });

        if (authError) throw authError;

        const { data: staffRecord } = await supabase
          .from('teachers')
          .select('role, full_name')
          .eq('email', studentData.email.trim())
          .maybeSingle();

        if (!staffRecord || staffRecord.role !== role) {
          await supabase.auth.signOut();
          throw new Error(`Access Denied: You are registered as ${staffRecord?.role || 'staff'}, not ${role}.`);
        }

        toast.success(`🎉 Welcome ${role.charAt(0).toUpperCase() + role.slice(1)}!`);
        navigate(`/${role}/dashboard`);
      }

    } catch (error) {
      toast.error(error.message || "Login failed");
      if (role !== 'student') await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-4 relative overflow-hidden">
      
      {/* ✨ BACKGROUND ANIMATIONS */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300/30 to-purple-300/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-300/30 to-pink-300/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-r from-purple-300/20 to-blue-300/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* 🎓 FLOATING SCHOOL EMOJI */}
      <div className="absolute top-20 left-10 w-20 h-20 animate-bounce">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-2xl">🏫</div>
      </div>

      <div className={`bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-lg border border-white/50 transform transition-all duration-1000 ${
        isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10'
      }`}>
        
        {/* 🎨 HEADER WITH ANIMATION */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl animate-pulse">
            🏫
          </div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
            School Portal
          </h2>
          <p className="text-gray-500 font-medium">Adarsh Shishu Mandir ✨</p>
        </div>

        {/* 🎮 ROLE TABS WITH SMOOTH ANIMATION */}
        <div className="flex bg-gradient-to-r from-gray-100 to-gray-200 p-1 rounded-2xl mb-8 shadow-inner overflow-hidden">
          {['student', 'teacher', 'admin'].map((r, index) => (
            <button 
              key={r} 
              type="button" 
              onClick={() => {
                setRole(r);
                setStudentData({ full_name: '', father_name: '', roll_no: '', password: '', email: '' });
              }}
              className={`flex-1 py-4 px-4 text-sm font-bold rounded-2xl capitalize transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                role === r 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl scale-105' 
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* 📝 FORM WITH STAGGERED ANIMATION */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* STUDENT FIELDS */}
          {role === 'student' && (
            <>
              <div className="group">
                <label className="block text-sm font-bold text-gray-700 mb-2 animate-slide-up">
                  👤 Student Name
                </label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gradient-to-r from-white to-blue-50 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  placeholder="Enter full name"
                  value={studentData.full_name}
                  onChange={(e) => setStudentData({ ...studentData, full_name: e.target.value })}
                />
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-gray-700 mb-2 animate-slide-up animation-delay-200">
                  👨‍👧 Father's Name
                </label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 bg-gradient-to-r from-white to-emerald-50 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  placeholder="Enter father's name"
                  value={studentData.father_name}
                  onChange={(e) => setStudentData({ ...studentData, father_name: e.target.value })}
                />
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-gray-700 mb-2 animate-slide-up animation-delay-400">
                  🆔 Roll Number
                </label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 bg-gradient-to-r from-white to-purple-50 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  placeholder="Enter roll number"
                  value={studentData.roll_no}
                  onChange={(e) => setStudentData({ ...studentData, roll_no: e.target.value })}
                />
              </div>
            </>
          )}

          {/* STAFF EMAIL FIELD */}
          {role !== 'student' && (
            <div className="group">
              <label className="block text-sm font-bold text-gray-700 mb-2 animate-slide-up">
                📧 Email Address
              </label>
              <input 
                type="email" 
                required 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-gradient-to-r from-white to-indigo-50 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                value={studentData.email}
                onChange={(e) => setStudentData({ ...studentData, email: e.target.value })}
              />
            </div>
          )}

          {/* 🔐 PASSWORD FIELD WITH EYE */}
          <div className="group">
            <label className="block text-sm font-bold text-gray-700 mb-2 animate-slide-up animation-delay-200">
              🔐 Password
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-4 focus:ring-pink-100/50 transition-all duration-300 bg-gradient-to-r from-white to-rose-50 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                value={studentData.password}
                onChange={(e) => setStudentData({ ...studentData, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center transition-all duration-200 hover:scale-110"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="h-6 w-6 text-gray-500 hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-gray-500 hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 🚀 SUBMIT BUTTON WITH GLASSMORPHISM */}
          <button 
            type="submit" 
            disabled={loading}
            className="group relative w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-black text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-500 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative z-10 flex items-center justify-center space-x-2">
              {loading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>🚀 Login as</span>
                  <span className="animate-pulse">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                </>
              )}
            </span>
          </button>
        </form>

        {/* ✨ FOOTER LINKS */}
        <div className="mt-8 pt-6 border-t-2 border-gray-100/50">
          <div className="text-center space-y-3">
            <button 
              onClick={() => navigate('/reset-password')} 
              className="w-full py-3 px-6 bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-1 transform transition-all duration-300"
            >
              🔑 Forgot Password?
            </button>

            <div className="bg-gradient-to-r from-emerald-400/10 to-blue-400/10 p-4 rounded-2xl border border-emerald-200/50">
              <span className="text-gray-600 font-medium">New Student? </span> 
              <button 
                onClick={() => navigate('/register')} 
                className="text-emerald-600 font-black text-lg hover:text-emerald-700 transform hover:scale-105 transition-all duration-200"
              >
                📝 Register Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animate-slide-down { animation: slide-down 0.8s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default LoginPage;
