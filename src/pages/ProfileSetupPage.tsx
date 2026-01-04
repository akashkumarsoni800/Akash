import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    parent_name: '',
    contact_number: '',
    address: '' // New Field
  });
  const [studentId, setStudentId] = useState<number | null>(null);

  // 1. Load Current Data
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('contact_number', user.phone)
          .maybeSingle();

        if (student) {
          setStudentId(student.id);
          setFormData({
            full_name: student.full_name || '',
            parent_name: student.parent_name || '',
            contact_number: student.contact_number || '',
            address: student.address || '' // Make sure address column exists or ignore
          });
        }
      }
    };
    loadProfile();
  }, []);

  // 2. Update Function
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('students')
        .update({
          full_name: formData.full_name,
          parent_name: formData.parent_name,
          // Contact number change nahi karne denge security ke liye
        })
        .eq('id', studentId);

      if (error) throw error;
      toast.success("Profile Updated Successfully!");
      navigate('/student/dashboard'); // Wapas Dashboard bhejo

    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-blue-900 mb-6">Update Profile</h2>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">Student Name</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Father's Name</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded"
              value={formData.parent_name}
              onChange={e => setFormData({...formData, parent_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Phone (Read Only)</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded bg-gray-100 text-gray-500 cursor-not-allowed"
              value={formData.contact_number}
              readOnly
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          
          <button 
            type="button"
            onClick={() => navigate('/student/dashboard')}
            className="w-full mt-2 text-gray-500 text-sm hover:underline"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
