import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Supabase Auth Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // 2. Check Role in Database
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = profile?.role || 'student';
        
        toast.success("Login Successful! 🎉");

        // 3. Redirect based on Role
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'teacher') navigate('/teacher/dashboard');
        else navigate('/student/dashboard');
      }

    } catch (error: any) {
      console.error(error);
      toast.error("Login Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-blue-900 p-6 text-center">
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="text-blue-200 mt-2">Adarsh Shishu Mandir</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Login Now'}
          </button>

        </form>
        
        <div className="bg-gray-50 p-4 text-center border-t">
          <p className="text-sm text-gray-500">Don't have an account? Contact Admin.</p>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
