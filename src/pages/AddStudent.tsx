import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const AddStudent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    roll: '',
    father: '',
    email: '',
    phone: '',
    dob: '', // Date of Birth
    gender: '', // Gender
    address: '', // Address
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Basic client-side validation
    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    if (formData.phone.length < 10) {
      toast.error('Please enter a valid phone number (at least 10 digits).');
      setLoading(false);
      return;
    }

    try {
      // 1. Create Auth User (Default Password: Student@123)
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: 'Student@123',
        options: {
          data: {
            full_name: formData.name,
            role: 'student',
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
          contact_number: formData.phone,
          email: formData.email,
          date_of_birth: formData.dob,
          gender: formData.gender,
          address: formData.address,
          auth_id: data.user.id,
        }]);

        if (dbError) throw dbError;
      }

      toast.success(`Student Added! Login: ${formData.email} | Pass: Student@123`);
      navigate('/admin/dashboard');

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Add New Student</h2>
          <p className="text-gray-600">Fill in the details to register a new student account.</p>
        </div>
        
        {/* Personal Information Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
              <input
                type="date"
                name="dob"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={formData.dob}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
              <select
                name="gender"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name *</label>
              <input
                type="text"
                name="father"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter father's name"
                value={formData.father}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Academic Information Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Academic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <input
                type="text"
                name="class"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="e.g., 10th A"
                value={formData.class}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number *</label>
              <input
                type="text"
                name="roll"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter roll number"
                value={formData.roll}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (Login ID) *</label>
              <input
                type="email"
                name="email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="student@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <textarea
              name="address"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter full address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>
        </div>

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registering...
            </div>
          ) : (
            "Register Student"
          )}
        </button>

        <p className="text-sm text-gray-500 mt-4 text-center">
          * Required fields. The student will receive login credentials via email.
        </p>
      </form>
    </div>
  );
};

export default AddStudent;
