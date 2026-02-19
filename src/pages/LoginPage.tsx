import React, { useState } from 'react';
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
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-emerald-200/30 to-blue-200/30 rounded-full blur-xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-100/20 to-pink-100/20 rounded-full blur-3xl animate-float"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/50 p-10 max-h-[90vh] overflow-y-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 bg-white shadow-lg rounded-2xl p-4 border border-gray-100 flex items-center justify-center transform hover:scale-105 transition-transform duration-300 group">
            <img 
              src="/logo.png" 
              alt="Adarsh Shishu Mandir" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            School Portal
          </h1>
          <p className="text-gray-600 font-medium text-lg">Adarsh Shishu Mandir</p>
        </div>

        {/* Role Selection - Equal Width */}
        <div className="grid grid-cols-3 gap-2 mb-10 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-inner">
          {['student', 'teacher', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setStudentData({ full_name: '', father_name: '', roll_no: '', password: '', email: '' });
              }}
              className={`group relative py-4 px-3 rounded-xl font-semibold text-sm capitalize transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg border-2 ${
                role === r
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/25 border-blue-500 shadow-lg scale-[1.02]'
                  : 'bg-white/70 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 shadow-md'
              }`}
            >
              <span className="relative z-10">{r.charAt(0).toUpperCase() + r.slice(1)}</span>
              {role === r && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl blur opacity-75 animate-ping-slow"></div>
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
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Student Name</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all duration-300 shadow-sm hover:shadow-md text-lg placeholder-gray-400"
                    placeholder="Enter full name"
                    value={studentData.full_name}
                    onChange={(e) => setStudentData({ ...studentData, full_name: e.target.value })}
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Father's Name</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all duration-300 shadow-sm hover:shadow-md text-lg placeholder-gray-400"
                    placeholder="Enter father's name"
                    value={studentData.father_name}
                    onChange={(e) => setStudentData({ ...studentData, father_name: e.target.value })}
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Roll Number</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all duration-300 shadow-sm hover:shadow-md text-lg placeholder-gray-400"
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
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input 
                type="email" 
                required 
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all duration-300 shadow-sm hover:shadow-md text-lg placeholder-gray-400"
                value={studentData.email}
                onChange={(e) => setStudentData({ ...studentData, email: e.target.value })}
              />
            </div>
          )}

          {/* Password Field */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                className="w-full pl-4 pr-12 py-3 bg-white/50 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all duration-300 shadow-sm hover:shadow-md text-lg placeholder-gray-400"
                value={studentData.password}
                onChange={(e) => setStudentData({ ...studentData, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center transition-all duration-300 hover:scale-110 group-hover:text-blue-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
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
          </button>
        </form>

        {/* Footer Links - Simple */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <button 
            onClick={() => navigate('/reset-password')} 
            className="w-full py-3 px-4 text-gray-700 font-semibold text-sm hover:text-blue-600 hover:underline transition-colors duration-200 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-md"
          >
            Forgot Password?
          </button>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-gray-500 text-sm">New Student? </span> 
            <button 
              onClick={() => navigate('/register')} 
              className="text-blue-600 font-semibold text-sm hover:underline transition-colors duration-200"
            >
              Register Student
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.3; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(120deg); }
          66% { transform: translateY(-10px) rotate(240deg); }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animate-float { animation: float 20s ease-in-out infinite; }
        .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
      `}</style>
    </div>
  );
};

export default LoginPage;
