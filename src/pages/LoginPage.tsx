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
    email: ''
  });
  const [isVisible, setIsVisible] = useState(false);

  // Smooth entrance animation
  useEffect(() => {
    setIsVisible(true);
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
      } else {
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

        toast.success(`Welcome ${role.charAt(0).toUpperCase() + role.slice(1)}!`);
        navigate(`/${role === 'admin' ? 'admin' : 'teacher'}/dashboard`);
      }
    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-200/30 to-purple-200/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-emerald-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/2 left-10 w-40 h-40 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-xl animate-float"></div>
      </div>

      <div className={`bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-10 w-full max-w-lg border border-white/50 transform transition-all duration-700 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}>
        
        {/* Logo & Title Section */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-white/50 hover:scale-105 transition-transform duration-300 group">
            <img 
              src="/logo.png" 
              alt="Adarsh Shishu Mandir" 
              className="w-16 h-16 object-contain group-hover:rotate-12 transition-transform duration-500"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-3">
            School Portal
          </h1>
          <p className="text-gray-600 font-medium tracking-wide">Welcome to Adarsh Shishu Mandir</p>
        </div>

        {/* Role Toggle - Glassmorphism */}
        <div className="bg-white/60 backdrop-blur-sm p-1 rounded-2xl mb-8 border border-white/40 shadow-lg">
          {['student', 'teacher', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setStudentData({ full_name: '', father_name: '', roll_no: '', password: '', email: '' });
              }}
              className={`flex-1 py-4 px-6 text-sm font-semibold rounded-xl capitalize transition-all duration-300 relative overflow-hidden group ${
                role === r
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transform scale-105'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
              }`}
            >
              <span className="relative z-10">{r.charAt(0).toUpperCase() + r.slice(1)}</span>
              {role === r && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 blur opacity-30 animate-pulse"></div>
              )}
            </button>
          ))}
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Student Fields */}
          {role === 'student' && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Student Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg placeholder-gray-400"
                    placeholder="Enter full name"
                    value={studentData.full_name}
                    onChange={(e) => setStudentData({ ...studentData, full_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Father's Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg placeholder-gray-400"
                    placeholder="Enter father's name"
                    value={studentData.father_name}
                    onChange={(e) => setStudentData({ ...studentData, father_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Roll Number</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg placeholder-gray-400"
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-5 py-4 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg placeholder-gray-400"
                value={studentData.email}
                onChange={(e) => setStudentData({ ...studentData, email: e.target.value })}
              />
            </div>
          )}

          {/* Password Field with Eye Icon */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-5 pr-14 py-4 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg placeholder-gray-400 pr-4"
                value={studentData.password}
                onChange={(e) => setStudentData({ ...studentData, password: e.target.value })}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center group/eye hover:scale-110 transition-transform duration-200"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="h-6 w-6 text-gray-500 group-hover/eye:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-gray-500 group-hover/eye:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group/btn"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
          </button>
        </form>

        {/* Footer Links - Simple */}
        <div className="mt-8 pt-8 border-t border-gray-100">
          <div className="text-center space-y-3">
            <button
              onClick={() => navigate('/reset-password')}
              className="w-full py-3 px-6 text-blue-600 font-semibold hover:bg-blue-50 rounded-xl hover:scale-[1.02] transition-all duration-200 border border-blue-100 hover:border-blue-200"
            >
              Forgot Password?
            </button>
            <div className="text-sm">
              <span className="text-gray-500">New Student? </span>
              <button
                onClick={() => navigate('/register')}
                className="text-blue-600 font-semibold hover:text-blue-700 font-bold hover:underline transition-colors"
              >
                Register Student
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
