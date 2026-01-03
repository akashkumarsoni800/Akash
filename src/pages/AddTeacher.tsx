import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const AddTeacher = () => {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    name: '', subject: '', email: '', phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      // 1. Create Auth User with Default Password
      // "Confirm Email" OFF hone par ye user turant active ho jayega
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: 'Teacher@123', // Ye raha Default Password
        options: {
          data: {
            full_name: formData.name,
            role: 'teacher', // Ye SQL Trigger ko batayega ki role teacher set karo
          },
        },
      });

      if (authError) throw authError;

      // 2. Extra Details Teachers Table mein daalein
      // Note: auth_id ab data.user.id se milega
      if (data.user) {
        const { error: dbError } = await supabase.from('teachers').insert([{
          full_name: formData.name,
          subject: formData.subject,
          email: formData.email,
          phone: formData.phone,
          auth_id: data.user.id 
        }]);
        
        if (dbError) throw dbError;
      }

      toast.success("Teacher Created! Login ID: " + formData.email + " | Pass: Teacher@123");
      navigate('/admin/dashboard');

    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    // ... (Aapka baki UI code same rahega)
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add Teacher</h2>
            <input className="w-full border p-2 mb-2" placeholder="Name" onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input className="w-full border p-2 mb-2" placeholder="Subject" onChange={e => setFormData({...formData, subject: e.target.value})} required />
            <input className="w-full border p-2 mb-2" placeholder="Email" type="email" onChange={e => setFormData({...formData, email: e.target.value})} required />
            <input className="w-full border p-2 mb-4" placeholder="Phone" onChange={e => setFormData({...formData, phone: e.target.value})} required />
            <button disabled={isPending} className="w-full bg-blue-600 text-white p-2 rounded">
                {isPending ? "Creating..." : "Create Teacher"}
            </button>
        </form>
    </div>
  );
};

export default AddTeacher;
