import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Supabase Email Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Login Successful! 🔓");
        const userEmail = data.user.email;

        // --- ROLE CHECKING (Email se) ---

        // 1. ADMIN CHECK
        if (userEmail === 'admin@school.com') { // Admin ka email yahan set karein
           navigate('/admin/dashboard');
           return;
        }

        // 2. TEACHER CHECK
        const { data: teacher } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();

        if (teacher) {
          navigate('/teacher/dashboard');
          return;
        }

        // 3. STUDENT CHECK (Default)
        navigate('/student/dashboard');
      }

    } catch (error: any) {
      console.error(error);
      toast.error("Login Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-blue-100">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-md">
            🏫
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Adarsh Shishu Mandir</h1>
          <p className="text-gray-500 text-sm">Sign in with Email</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Email Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              placeholder="student@example.com"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              placeholder="Enter password"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition shadow-md disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login Now"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default LoginPage;
