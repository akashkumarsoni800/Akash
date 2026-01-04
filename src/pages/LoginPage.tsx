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
      // 1. Supabase Auth se Login karein
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
          .from('students') // Apne table ka naam check kar lein
          .select('is_approved, full_name') // Column ka naam 'is_approved' hona chahiye
          .eq('email', formData.email) // Email se match karein
          .single();

        if (dbError) {
          console.error("DB Error:", dbError);
          // Agar record nahi mila, matlab student register hi nahi hua sahi se
          throw new Error("Student record not found. Please register first.");
        }

        // AGAR APPROVED NAHI HAI TO ROK DEIN 🛑
        if (!studentRecord?.is_approved) {
          await supabase.auth.signOut(); // Turant logout karein
          toast.error("⏳ Account Approval Pending!");
          toast.info("Please contact Admin (Principal) to approve your account.");
          setLoading(false);
          return; // Yahi ruk jayein, dashboard par na bhejain
        }

        toast.success(`Welcome back, ${studentRecord.full_name}!`);
        navigate('/student/dashboard');
      } 

      // --- ADMIN LOGIN ---
      else if (role === 'admin') {
        navigate('/admin/dashboard');
        toast.success("Welcome Admin!");
      }

      // --- TEACHER LOGIN ---
      else if (role === 'teacher') {
        navigate('/teacher/dashboard');
        toast.success("Welcome Teacher!");
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Login failed");
      // Agar error aaye to user ko logout kar dein safety ke liye
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-blue-900 mb-6">School Login</h2>

        {/* Role Selection */}
        <div className="flex bg-gray-100 p-1 rounded mb-6">
          {['student', 'teacher', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-1 text-sm font-medium rounded capitalize transition ${
                role === r ? 'bg-white shadow text-blue-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white py-2 px-4 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 font-bold disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
           <p className="text-gray-500">Don't have an account?</p> 
           {/* Setup page par bhejne ka link agar chahiye to */}
           <button onClick={() => navigate('/setup')} className="text-blue-600 hover:underline">Register New Account</button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;