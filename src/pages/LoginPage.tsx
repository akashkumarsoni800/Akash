import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student'); // 'student', 'teacher', 'admin'
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Supabase Auth Login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user found");

      // ---------------------------------------------------------
      // 🔒 SECURITY CHECK: ADMIN APPROVAL LOGIC (Sirf Students ke liye)
      // ---------------------------------------------------------
      if (role === 'student') {
        // Database se Student ka status check karein
        const { data: studentRecord, error: dbError } = await supabase
          .from('students')
          .select('is_approved, full_name') // Column 'is_approved' hona zaroori hai
          .eq('email', formData.email)
          .maybeSingle(); // .single() ki jagah maybeSingle() safe hai

        if (dbError) {
          console.error("DB Error:", dbError);
        }

        // Agar record nahi mila (Matlab email auth me hai par students table me nahi)
        if (!studentRecord) {
          await supabase.auth.signOut();
          toast.error("Student record not found!");
          toast.info("Please ask Admin to add your details first.");
          setLoading(false);
          return;
        }

        // AGAR APPROVED NAHI HAI TO ROK DEIN 🛑
        if (studentRecord.is_approved === false) {
          await supabase.auth.signOut(); // Turant logout karein
          toast.error("⏳ Account Approval Pending!");
          toast.info("Please contact Principal to approve your account.");
          setLoading(false);
          return; // Yahi ruk jayein
        }

        toast.success(`Welcome back, ${studentRecord.full_name || 'Student'}!`);
        navigate('/student/dashboard');
      } 

      // --- ADMIN LOGIN ---
      else if (role === 'admin') {
        // Admin ka email check (Hardcoded security)
        if (formData.email === 'admin@school.com') {
           navigate('/admin/dashboard');
           toast.success("Welcome Admin!");
        } else {
           throw new Error("You are not an Admin!");
        }
      }

      // --- TEACHER LOGIN ---
      else if (role === 'teacher') {
        // Teacher table check (Optional)
        const { data: teacher } = await supabase
           .from('teachers')
           .select('id')
           .eq('email', formData.email)
           .maybeSingle();
        
        if (teacher) {
           navigate('/teacher/dashboard');
           toast.success("Welcome Teacher!");
        } else {
           throw new Error("Teacher record not found.");
        }
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Login failed");
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-md">
            🏫
          </div>
          <h2 className="text-2xl font-bold text-blue-900">School Login</h2>
          <p className="text-gray-500 text-sm">Adarsh Shishu Mandir</p>
        </div>

        {/* Role Selection Tabs */}
        <div className="flex bg-gray-100 p-1 rounded mb-6">
          {['student', 'teacher', 'admin'].map((r) => (
            <button
              key={r}
              type="button" // Important: Taki ye form submit na kare
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium rounded capitalize transition ${
                role === r ? 'bg-white shadow text-blue-900 font-bold' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white py-2 px-4 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 font-bold disabled:opacity-50 transition"
          >
            {loading ? 'Verifying...' : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </button>
        </form>

        {/* Forgot / Register Links */}
        <div className="mt-4 text-center text-sm space-y-2">
           <button onClick={() => navigate('/reset-password')} className="text-blue-600 hover:underline block w-full">
             Forgot Password?
           </button>
           
           <div className="border-t pt-2 mt-2">
             <span className="text-gray-500">New Student? </span> 
             <button onClick={() => navigate('/profile-setup')} className="text-blue-600 hover:underline font-bold">
               Update Profile
             </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
