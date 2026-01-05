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
          toast.error("Student record not found!");
          setLoading(false);
          return;
        }

        // Check if Approved (Using Text 'approved')
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
           throw new Error("You are not an Admin!");
        }
      }
      else if (role === 'teacher') {
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
      toast.error(error.message || "Login failed");
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-blue-900">
        
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-md">🏫</div>
          <h2 className="text-2xl font-bold text-blue-900">School Login</h2>
          <p className="text-gray-500 text-sm">Adarsh Shishu Mandir</p>
        </div>

        {/* Role Selector */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          {['student', 'teacher', 'admin'].map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all duration-200 ${
                role === r ? 'bg-white shadow text-blue-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
            <input type="email" required className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="name@school.com"
              value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
            <input type="password" required className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="••••••••"
              value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-blue-800 shadow-lg disabled:opacity-50 active:scale-95 transition-all">
            {loading ? 'Verifying Account...' : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </button>
        </form>

        {/* Footer Links & New Registration Feature */}
        
           <button onClick={() => navigate('/reset-password')} className="text-blue-600 text-sm font-medium hover:underline">
             Forgot Password?
           </button>

           <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
             <p className="text-xs text-gray-600 font-bold uppercase tracking-wider mb-2">New to our School?</p>
             {/* ✅ 'Update Profile' की जगह 'Register for Admission' बटन */}
             <button onClick={() => navigate('/reset-password')} className="text-blue-600 text-sm font-medium hover:underline">
             Register Student
           </button>
           
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
