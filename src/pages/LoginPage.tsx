import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Ab ye kaam karega!
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
      // 1. Database se Login karo
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 2. Role Check karo
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = profile?.role || 'student';
        
        toast.success("Welcome Back! 🎉");

        // 3. Sahi dashboard par bhejo
        if (role === 'admin') navigate('/admin/dashboard');
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
        
        <div className="bg-blue-900 p-6 text-center">
          <h2 className="text-3xl font-bold text-white">Adarsh Shishu Mandir</h2>
          <p className="text-blue-200 mt-2">Login Portal</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full border p-3 rounded"
              placeholder="Enter email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full border p-3 rounded"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
