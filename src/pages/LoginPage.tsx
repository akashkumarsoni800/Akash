import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({ email: '', password: '' });

  // handleLogin function ke andar ka updated logic
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (authError) throw authError;

    // --- STUDENT LOGIC ---
    if (role === 'student') {
      const { data: studentRecord, error: dbError } = await supabase
        .from('students')
        .select('is_approved, full_name')
        .eq('email', formData.email.trim())
        .maybeSingle();

      if (!studentRecord || studentRecord.is_approved !== 'approved') {
        await supabase.auth.signOut();
        toast.error(!studentRecord ? "Student record not found!" : "⏳ Account Approval Pending!");
        setLoading(false);
        return;
      }
      toast.success(`Welcome, ${studentRecord.full_name}!`);
      navigate('/student/dashboard');
    } 
    // --- ADMIN & TEACHER LOGIC (Same Table: teachers) ---
    else {
      const { data: userData, error: dbError } = await supabase
        .from('teachers')
        .select('full_name, role')
        .eq('email', formData.email.trim())
        .maybeSingle();

      if (!userData) {
        throw new Error("User record not found in staff database.");
      }

      // Role check: Kya UI par select kiya hua role DB ke role se match karta hai?
      if (userData.role !== role) {
        throw new Error(`You are registered as a ${userData.role}, not a ${role}.`);
      }

      if (userData.role === 'admin') {
        toast.success("Welcome Admin!");
        navigate('/admin/dashboard');
      } else {
        toast.success("Welcome Teacher!");
        navigate('/teacher/dashboard');
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
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-md">🏫</div>
          <h2 className="text-2xl font-bold text-blue-900">School Login</h2>
          <p className="text-gray-500 text-sm">Adarsh Shishu Mandir</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded mb-6">
          {['student', 'teacher', 'admin'].map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium rounded capitalize transition ${role === r ? 'bg-white shadow text-blue-900 font-bold' : 'text-gray-500'}`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-2 rounded-md font-bold disabled:opacity-50 transition">
            {loading ? 'Verifying...' : `Login as ${role}`}
          </button>
        </form>

        {/* ✅ यहाँ है आपका नया लिंक स्टाइल वाला हिस्सा */}
        <div className="mt-6 text-center text-sm space-y-3">
           <button 
             onClick={() => navigate('/reset-password')} 
             className="text-blue-600 hover:underline block w-full"
           >
             Forgot Password?
           </button>

           <div className="pt-2 border-t border-gray-100">
             <span className="text-gray-500">New Student? </span> 
             <button 
               onClick={() => navigate('/register')} 
               className="text-blue-600 font-bold hover:underline"
             >
               Register Student
             </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
