import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const AddStudent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', class: '', roll: '', father: '', email: '', phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Auth User (Default Password: Student@123)
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: 'Student@123',
        options: {
          data: {
            full_name: formData.name,
            role: 'student', // <--- Trigger isse pakad kar role set karega
          },
        },
      });

      if (authError) throw authError;

      // 2. Insert into Students Table
      if (data.user) {
        const { error: dbError } = await supabase.from('students').insert([{
          full_name: formData.name,
          class_name: formData.class,
          roll_no: formData.roll,
          father_name: formData.father,
          phone: formData.phone,
          email: formData.email,
          auth_id: data.user.id
        }]);

        if (dbError) throw dbError;
      }

      toast.success("Student Added! Login: " + formData.email + " | Pass: Student@123");
      navigate('/admin/dashboard');

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-blue-900">Add New Student</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <input className="p-2 border rounded" placeholder="Full Name" onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input className="p-2 border rounded" placeholder="Class (e.g. 10th A)" onChange={e => setFormData({...formData, class: e.target.value})} required />
          <input className="p-2 border rounded" placeholder="Roll Number" onChange={e => setFormData({...formData, roll: e.target.value})} required />
          <input className="p-2 border rounded" placeholder="Father's Name" onChange={e => setFormData({...formData, father: e.target.value})} required />
        </div>
        
        <input className="w-full p-2 border rounded mt-4" type="email" placeholder="Student Email (Login ID)" onChange={e => setFormData({...formData, email: e.target.value})} required />
        <input className="w-full p-2 border rounded mt-4" placeholder="Phone Number" onChange={e => setFormData({...formData, phone: e.target.value})} required />

        <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded mt-6 font-bold hover:bg-blue-700">
          {loading ? "Registering..." : "Register Student"}
        </button>
      </form>
    </div>
  );
};

export default AddStudent;
