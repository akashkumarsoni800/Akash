import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Supabase import karein
import { toast } from 'sonner';

const AddTeacher = () => {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    email: '',
    phone: ''
  });

  
  
      const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsPending(true);

  try {
    // 1. Supabase Auth se Account banana
    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: 'Teacher@123', 
      options: {
        data: {
          full_name: formData.name,
          role: 'teacher'
        }
      }
    });

    // Agar Auth mein error aaye (jaise user already exists) toh yahi ruk jao
    if (authError) throw authError;

    // 2. Teacher ki entry Database Table mein karna
    const { error: dbError } = await supabase.from('teachers').insert([{
      full_name: formData.name,
      subject: formData.subject,
      email: formData.email,
      phone: formData.phone,
      auth_id: data.user?.id // data.user ab safely milega
    }]);

    if (dbError) throw dbError;

    // Sab sahi raha toh final message
    toast.success("Teacher Registered! Login with: Teacher@123");
    navigate('/admin/dashboard');

  } catch (err: any) {
    // Har tarah ka error yahan handle hoga
    toast.error("Error: " + err.message);
    console.error("Signup Error:", err);
  } finally {
    setIsPending(false);
  }
};


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 mt-10">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Add New Teacher</h2>
        <p className="text-sm text-gray-500 mb-6">An invitation will be sent to their email to set a password.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email ID (For Login)</label>
            <input
              type="email"
              required
              className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              required
              className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="pt-4 space-y-3">
            <button 
              type="submit" 
              disabled={isPending} 
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition disabled:bg-blue-300"
            >
              {isPending ? 'Sending Invitation...' : 'Send Invitation ✉️'}
            </button>
            
            <button 
              type="button" 
              onClick={() => navigate('/admin/dashboard')} 
              className="w-full bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeacher;
