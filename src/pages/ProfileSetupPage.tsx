import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [studentId, setStudentId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    parent_name: '',
    contact_number: '',
    email: '',
    address: '',
    avatar_url: '' // प्रोफाइल इमेज के लिए
  });

  // 1. डेटा लोड करें (Email आधारित सर्च)
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Auth से ईमेल और नंबर लें
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('email', user.email) // ईमेल से ढूंढना ज्यादा सटीक है
          .maybeSingle();

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
      }
    };
    loadProfile();
  }, []);

  // 2. प्रोफाइल इमेज अपलोड फंक्शन
  const uploadAvatar = async (event: any) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Supabase Storage में अपलोड करें (Bucket नाम 'avatars' होना चाहिए)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // पब्लिक URL प्राप्त करें
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData({ ...formData, avatar_url: data.publicUrl });
      toast.success("Photo uploaded! Click 'Save Changes' to confirm.");

    } catch (error: any) {
      toast.error("Image upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // 3. पूरा डेटा अपडेट करें
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    try {
      setLoading(true);

      // A. Database Table (Students) अपडेट करें
      const { error: dbError } = await supabase
        .from('students')
        .update({
          full_name: formData.full_name,
          parent_name: formData.parent_name,
          contact_number: formData.contact_number,
          email: formData.email,
          address: formData.address,
          avatar_url: formData.avatar_url
        })
        .eq('id', studentId);

      if (dbError) throw dbError;

      // B. Supabase Auth में ईमेल अपडेट करें (यदि यूजर ने बदला है)
      const { data: { user } } = await supabase.auth.getUser();
      if (user && formData.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: formData.email });
        if (authError) toast.warn("Email update pending: Please check your new email for confirmation.");
      }

      toast.success("Profile Updated Successfully! ✅");
      navigate('/student/dashboard');

    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
        <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center">Edit Profile</h2>

        <form onSubmit={handleUpdate} className="space-y-6">
          
          {/* प्रोफाइल इमेज सेक्शन */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="w-32 h-32 bg-blue-100 rounded-full overflow-hidden border-4 border-white shadow-md">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-blue-300">👤</div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white cursor-pointer hover:bg-blue-700 shadow-lg transition">
                <span className="text-xs font-bold">Edit</span>
                <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">{uploading ? "Uploading..." : "Click edit to change photo"}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Full Name</label>
              <input type="text" className="w-full border-b-2 border-gray-100 p-2 focus:border-blue-500 outline-none transition" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Father's Name</label>
              <input type="text" className="w-full border-b-2 border-gray-100 p-2 focus:border-blue-500 outline-none transition" value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Mobile Number</label>
              <input type="tel" className="w-full border-b-2 border-gray-100 p-2 focus:border-blue-500 outline-none transition" value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Email Address</label>
              <input type="email" className="w-full border-b-2 border-gray-100 p-2 focus:border-blue-500 outline-none transition" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Residential Address</label>
            <textarea rows={2} className="w-full border-b-2 border-gray-100 p-2 focus:border-blue-500 outline-none transition" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Your full address..." />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={loading || uploading} className="flex-1 bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-blue-800 shadow-lg disabled:opacity-50 transition">
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
