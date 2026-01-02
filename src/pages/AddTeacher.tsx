import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterTeacher } from '../hooks/useQueries'; // Path ab '../' hi rahega
import { toast } from 'sonner';

const AddTeacher = () => {
  const navigate = useNavigate();
  const { mutate: registerTeacher, isPending } = useRegisterTeacher();

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    email: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerTeacher(formData, {
      onSuccess: () => {
        toast.success("Teacher Added Successfully!");
        navigate('/admin/dashboard');
      },
      onError: (err) => {
        toast.error("Error adding teacher: " + err.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Register New Teacher</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded mt-1"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded mt-1"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email ID</label>
            <input
              type="email"
              required
              className="w-full p-2 border rounded mt-1"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              required
              className="w-full p-2 border rounded mt-1"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <button type="submit" disabled={isPending} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
            {isPending ? 'Adding...' : 'Register Teacher'}
          </button>
          <button type="button" onClick={() => navigate('/admin/dashboard')} className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition mt-2">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTeacher;