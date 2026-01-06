import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<any>(null);
  const [currentAuthEmail, setCurrentAuthEmail] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    avatar_url: '',
    parent_name: '',
    subject: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate('/');
        setCurrentAuthEmail(user.email || '');

        // 1. Check Student Table
        const { data: student } = await supabase.from('students').select('*').eq('email', user.email).maybeSingle();
        if (student) {
          setUserRole('student');
          setProfileId(student.id);
          setFormData({ ...student, phone: student.contact_number, email: user.email });
        } else {
          // 2. Check Teacher/Admin Table
          const { data: teacher } = await supabase.from('teachers').select('*').eq('email', user.email).maybeSingle();
          if (teacher) {
            setUserRole(teacher.role === 'admin' ? 'admin' : 'teacher');
            setProfileId(teacher.id);
            setFormData({ ...teacher, email: user.email });
          }
        }
      } catch (err) { 
        console.error(err); 
      } finally { 
        setInitialLoading(false); 
      }
    };
    fetchProfile();
  }, [navigate]);

  // 🖼️ Profile Picture Upload Logic
  const uploadAvatar = async (event: any) => {
    try {
      if (userRole === 'student') return toast.error("Students cannot change photos.");
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      toast.success("Photo selected! Click 'Save' to apply changes.");
    } catch (error: any) { 
      toast.error("Upload failed: " + error.message); 
    } finally { 
      setUploading(false); 
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'student') return toast.error("Only Admin can update profiles.");
    
    setLoading(true);
    try {
      // ✅ 1. Update Supabase Auth Email
      if (formData.email !== currentAuthEmail) {
        const { error: authError } = await supabase.auth.updateUser({ email: formData.email });
        if (authError) throw authError;
      }

      // 2. Database Table Update
      const table = userRole === 'student' ? 'students' : 'teachers';
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        address: formData.address,
        avatar_url: formData.avatar_url,
        [userRole === 'student' ? 'contact_number' : 'phone']: formData.phone
      };

      const { error } = await supabase.from(table).update(updateData).eq('id', profileId);
      if (error) throw error;

      toast.success("Profile & Login Email Updated! ✅");
      setCurrentAuthEmail(formData.email);
    } catch (error: any) { 
      toast.error(error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  if (initialLoading) return <div className="h-screen flex items-center justify-center font-bold">Loading Profile...</div>;

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl shadow-xl mt-10 border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-blue-900 uppercase italic">User Profile</h2>
        <span className={`px-4 py-1 rounded-full text-[10px] font-bold ${userRole === 'student' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
          {userRole === 'student' ? 'VIEW ONLY' : 'EDIT ACCESS'}
        </span>
      </div>
      
      <form onSubmit={handleUpdate} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full border-4 border-blue-50 overflow-hidden shadow-lg bg-gray-100 relative group">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <span className="text-4xl flex h-full items-center justify-center font-bold text-gray-300">
                {formData.full_name[0]}
              </span>
            )}
            {userRole !== 'student' && (
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <span className="text-white text-xs font-bold">CHANGE</span>
                <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
              </label>
            )}
          </div>
          {uploading && <p className="text-[10px] text-blue-600 font-bold animate-pulse mt-2">UPLOADING...</p>}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Login Email</label>
            <input type="email" className="w-full p-3 bg-gray-50 border rounded-xl font-medium" 
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
              disabled={userRole === 'student'} />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
            <input type="text" className="w-full p-3 bg-gray-50 border rounded-xl font-medium" 
              value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} 
              disabled={userRole === 'student'} />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Number</label>
            <input type="text" className="w-full p-3 bg-gray-50 border rounded-xl font-medium" 
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
              disabled={userRole === 'student'} />
          </div>
        </div>

        {userRole !== 'student' ? (
          <button type="submit" disabled={loading || uploading} className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-800 transition transform active:scale-95">
            {loading ? "SAVING CHANGES..." : "UPDATE EVERYTHING"}
          </button>
        ) : (
          <div className="p-4 bg-yellow-50 text-yellow-700 text-xs text-center rounded-xl font-bold border border-yellow-100">
            ⚠️ Profile details are managed by the school administration.
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileSetupPage;
