import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (role === 'student') {
        const { data: studentRecord, error: dbError } = await supabase
          .from('students')
          .select('is_approved, full_name')
          .eq('email', formData.email.trim())
          .maybeSingle();

        if (!studentRecord) {
          await supabase.auth.signOut();
          toast.error("Student record not found in database!");
          setLoading(false);
          return;
        }

        // Check if Approved (Text based)
        if (studentRecord.is_approved !== 'approved') {
          await supabase.auth.signOut();
          toast.error("⏳ Account Approval Pending!");
          toast.info("Please contact Admin to approve your account.");
          setLoading(false);
          return;
        }

        toast.success(`Welcome back, ${studentRecord.full_name}!`);
        navigate('/student/dashboard');
      } 
      else if (role === 'admin') {
        if (formData.email === 'admin@school.com') {
           navigate('/admin/dashboard');
           toast.success("Welcome Admin!");
        } else {
           throw new Error("Invalid Admin Credentials!");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed");
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border-t-4 border-blue-900">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-md">🏫</div>
          <h2 className="text-2xl font-bold text-blue-900">School Login</h2>
          <p className="text-gray-500 text-sm italic">Adarsh Shishu Mandir</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded mb-6">
          {['student', 'admin'].map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium rounded capitalize transition ${role === r ? 'bg-white shadow text-blue-900 font-bold' : 'text-gray-500'}`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 ml-1">Email</label>
            <input type="email" required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 ml-1">Password</label>
            <input type="password" required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-blue-800 disabled:opacity-50 shadow-lg">
            {loading ? 'Verifying...' : `Login as ${role}`}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
           <button onClick={() => navigate('/reset-password')} className="text-blue-600 text-sm hover:underline">Forgot Password?</button>
           <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
             <p className="text-sm text-gray-600">New Student?</p>
             <button onClick={() => navigate('/register')} className="text-blue-900 font-black text-lg hover:underline underline-offset-4">Register for Admission</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
