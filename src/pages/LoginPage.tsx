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
    password: ''
  });
  const [mounted, setMounted] = useState(false);

  // Page load animation
  useEffect(() => {
    setMounted(true);
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
          toast.error("Wrong password!");
          setLoading(false);
          return;
        }

        if (studentRecord.is_approved !== 'approved') {
          toast.error("⏳ Account Approval Pending!");
          setLoading(false);
          return;
        }

        toast.success(`Welcome, ${studentRecord.full_name}!`);
        navigate('/student/dashboard');
      } 
      else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: studentData.full_name,
          password: studentData.password,
        });

        if (authError) throw authError;

        const { data: staffRecord } = await supabase
          .from('teachers')
          .select('role, full_name')
          .eq('email', studentData.full_name.trim())
          .maybeSingle();

        if (!staffRecord || staffRecord.role !== role) {
          await supabase.auth.signOut();
          throw new Error(`Access Denied: You are registered as ${staffRecord?.role || 'staff'}, not ${role}.`);
        }

        toast.success(`Welcome ${role.charAt(0).toUpperCase() + role.slice(1)}!`);
        navigate(`/${role === 'admin' ? 'admin' : 'teacher'}/dashboard`);
      }
    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300/30 to-purple-300/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-300/30 to-pink-300/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-r from-purple-300/30 to-blue-300/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Card with Entrance Animation */}
      <div className={`bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-lg border border-white/50 transform transition-all duration-1000 ${mounted ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10'} animate-pulse`}>
        
        {/* Logo Section with Bounce Animation */}
        <div className="text-center mb-8 animate-bounce-slow">
          <img 
            src="/logo.png" 
            alt="Adarsh Shishu Mandir" 
            className="w-24 h-24 mx-auto mb-4 shadow-2xl rounded-2xl border-4 border-white/50 bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-2 transform hover:scale-110 transition-transform duration-300"
          />
          <h2 className="text-3xl font-black bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
            School Login
          </h2>
          <p className="text-gray-600 font-semibold mt-2 animate-pulse">Adarsh Shishu Mandir</p>
        </div>

        {/* Role Toggle with Slide Animation */}
        <div className="flex bg-gradient-to-r from-gray-100 to-gray-200 p-1 rounded-2xl mb-8 shadow-lg overflow-hidden animate-slide-up">
          {['student', 'teacher', 'admin'].map((r) => (
            <button 
              key={r} 
              type="button" 
              onClick={() => {
                setRole(r);
                setStudentData({ full_name: '', father_name: '', roll_no: '', password: '' });
              }}
              className={`flex-1 py-4 px-6 text-sm font-bold rounded-xl transition-all duration-500 transform hover:scale-105 hover:shadow-lg relative group ${
                role === r 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/25 scale-105' 
                  : 'text-gray-600 hover:text-blue-700 hover:bg-white/50'
              }`}
            >
              <span className="relative z-10 capitalize">{r}</span>
              {role === r && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 blur opacity-75 animate-ping"></div>
              )}
            </button>
          ))}
        </div>

        {/* Form with Staggered Animation */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Student Fields */}
          {role === 'student' && (
            <>
              <div className="space-y-3 animate-slide-up delay-100">
                <div className="transform transition-all duration-500 hover:scale-105">
                  <label className="block text-sm font-bold text-gray-800 mb-2">👨‍🎓 Student Name</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-5 py-4 bg-white/70 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-300 shadow-lg hover:shadow-xl"
                    placeholder="Enter full name"
                    value={studentData.full_name}
                    onChange={(e) => setStudentData({ ...studentData, full_name: e.target.value })}
                  />
                </div>

                <div className="transform transition-all duration-500 hover:scale-105">
                  <label className="block text-sm font-bold text-gray-800 mb-2">👨‍👦 Father's Name</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-5 py-4 bg-white/70 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-300 shadow-lg hover:shadow-xl"
                    placeholder="Enter father's name"
                    value={studentData.father_name}
                    onChange={(e) => setStudentData({ ...studentData, father_name: e.target.value })}
                  />
                </div>

                <div className="transform transition-all duration-500 hover:scale-105">
                  <label className="block text-sm font-bold text-gray-800 mb-2">🎫 Roll Number</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-5 py-4 bg-white/70 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-300 shadow-lg hover:shadow-xl"
                    placeholder="Enter roll number"
                    value={studentData.roll_no}
                    onChange={(e) => setStudentData({ ...studentData, roll_no: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {/* Staff Email Field */}
          {role !== 'student' && (
            <div className="transform transition-all duration-500 hover:scale-105 animate-slide-up delay-100">
              <label className="block text-sm font-bold text-gray-800 mb-2">📧 Email Address</label>
              <input 
                type="email" 
                required 
                className="w-full px-5 py-4 bg-white/70 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-300 shadow-lg hover:shadow-xl"
                value={studentData.full_name}
                onChange={(e) => setStudentData({ ...studentData, full_name: e.target.value })}
              />
            </div>
          )}

          {/* Password Field with Eye Toggle */}
          <div className="transform transition-all duration-500 hover:scale-105 animate-slide-up delay-200">
            <label className="block text-sm font-bold text-gray-800 mb-2">🔒 Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                className="w-full pl-5 pr-12 py-4 bg-white/70 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-300 shadow-lg hover:shadow-xl pr-16"
                value={studentData.password}
                onChange={(e) => setStudentData({ ...studentData, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center transition-all duration-300 hover:scale-110"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="h-6 w-6 text-gray-600 hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-gray-600 hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Login Button with Pulse Animation */}
          <button 
            type="submit" 
            disabled={loading}
            className="group relative w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-6 rounded-3xl font-black text-lg shadow-2xl hover:shadow-3xl hover:shadow-blue-500/50 transform hover:-translate-y-1 transition-all duration-500 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  🚀 Login as <span className="capitalize">{role}</span>
                </>
              )}
            </span>
          </button>
        </form>

        {/* Simple Forgot Password - No Animation */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/reset-password')} 
            className="text-blue-600 hover:text-blue-800 font-semibold text-sm hover:underline transition-colors duration-200"
          >
            Forgot Password?
          </button>
          
          <div className="pt-4 border-t border-gray-200 mt-6">
            <span className="text-gray-600">New Student? </span> 
            <button 
              onClick={() => navigate('/register')} 
              className="text-blue-600 font-bold hover:text-blue-800 hover:underline transition-colors duration-200"
            >
              Register Student
            </button>
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
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
        .animate-bounce-slow { animation: bounce-slow 3s infinite; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
      `}</style>
    </div>
  );
};

export default LoginPage;
