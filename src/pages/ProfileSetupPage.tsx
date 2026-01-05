import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import DashboardHeader from '../components/DashboardHeader';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [studentId, setStudentId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    parent_name: '',
    contact_number: '',
    email: '',
    address: '',
    avatar_url: '' 
  });

  useEffect(() => {
    const loadProfile = async () => {
      setInitialLoading(true); // Loading Start
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Please login first");
          navigate('/');
          return;
        }

        const { data: student, error } = await supabase
          .from('students')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (error) throw error;

        if (student) {
          setStudentId(student.id);
          setFormData({
            full_name: student.full_name || '',
            parent_name: student.parent_name || '',
            contact_number: student.contact_number || '',
            email: student.email || user.email || '',
            address: student.address || '',
            avatar_url: student.avatar_url || ''
          });
        }
      } catch (err: any) {
        console.error("Fetch Error:", err.message);
      } finally {
        setTimeout(() => setInitialLoading(false), 800); // Thoda delay for smooth transition
      }
    };
    loadProfile();
  }, [navigate]);

  const uploadAvatar = async (event: any) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      toast.success("Photo Uploaded! Click Save below.");
    } catch (error: any) {
      toast.error("Image Upload Failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          full_name: formData.full_name,
          parent_name: formData.parent_name,
          contact_number: formData.contact_number,
          address: formData.address,
          avatar_url: formData.avatar_url
        })
        .eq('id', studentId);

      if (error) throw error;
      toast.success("Profile Updated! ✅");
      navigate('/student/dashboard');
    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ERROR FIX: Loading Screen Instead of White Screen
  if (initialLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-blue-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-900 rounded-full animate-spin"></div>
        <h2 className="mt-4 text-xl font-bold text-blue-900">Data Load Ho Raha Hai...</h2>
        <p className="text-sm text-gray-500 animate-pulse">Kripya Intezar Karein</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ DashboardHeader properly added */}
      <DashboardHeader 
        userName={formData?.full_name || "Student"} 
        userRole="My Profile"
        avatarUrl={formData?.avatar_url}
      />

      <div className="pt-24 pb-12 px-4 max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-blue-900 p-8 text-center text-white">
            <h2 className="text-2xl font-bold">Edit Your Profile</h2>
          </div>

          <form onSubmit={handleUpdate} className="p-8 space-y-5">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden shadow-lg bg-gray-200">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl font-bold text-gray-300">
                      {formData.full_name?.charAt(0) || "S"}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-1 right-1 bg-blue-600 p-2 rounded-full text-white cursor-pointer hover:scale-110 transition border-2 border-white">
                   <span className="text-[10px] font-bold">EDIT</span>
                   <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Student Full Name</label>
                <input type="text" className="w-full p-3 bg-gray-50 border rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Father's Name</label>
                <input type="text" className="w-full p-3 bg-gray-50 border rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Address</label>
                <textarea className="w-full p-3 bg-gray-50 border rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={2} />
              </div>
            </div>

            <button type="submit" disabled={loading || uploading} className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold hover:shadow-2xl transition-all disabled:opacity-50">
              {loading ? "Updating..." : "Save Changes"}
            </button>
            
            <button type="button" onClick={() => navigate(-1)} className="w-full text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-gray-600">
              Cancel & Go Back
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
