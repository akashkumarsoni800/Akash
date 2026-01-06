import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // ✅ Role States
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<any>(null);
  const [currentAuthEmail, setCurrentAuthEmail] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    avatar_url: '',
    subject: '',
    parent_name: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate('/');
        setCurrentAuthEmail(user.email || '');

        // ✅ 1. सबसे पहले TEACHERS टेबल चेक करें (ताकि टीचर को स्टूडेंट न दिखाए)
        const { data: teacher } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (teacher) {
          setUserRole(teacher.role === 'admin' ? 'admin' : 'teacher');
          setProfileId(teacher.id);
          setFormData({
            full_name: teacher.full_name || '',
            email: user.email || '',
            phone: teacher.phone || '',
            address: teacher.address || '',
            avatar_url: teacher.avatar_url || '',
            subject: teacher.subject || '',
            parent_name: ''
          });
        } else {
          // ✅ 2. अगर टीचर नहीं है, तब STUDENTS टेबल चेक करें
          const { data: student } = await supabase
            .from('students')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();

          if (student) {
            setUserRole('student');
            setProfileId(student.id);
            setFormData({
              full_name: student.full_name || '',
              email: user.email || '',
              phone: student.contact_number || '',
              address: student.address || '',
              avatar_url: student.avatar_url || '',
              parent_name: student.parent_name || '',
              subject: ''
            });
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // 🖼️ Avatar Upload (Admin/Teacher Only)
  const uploadAvatar = async (event: any) => {
    if (userRole === 'student') return toast.error("Students cannot change profile pictures.");
    
    try {
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      toast.success("Image selected! Click Save.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Student Edit Restriction
    if (userRole === 'student') {
      toast.error("Access Denied: Students cannot update profiles.");
      return;
    }

    setLoading(true);
    try {
      // 1. Direct Email Update in Supabase Auth
      if (formData.email !== currentAuthEmail) {
        const { error: authError } = await supabase.auth.updateUser({ email: formData.email });
        if (authError) throw authError;
      }

      // 2. Database Table Update
      const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';
      const table = isTeacherOrAdmin ? 'teachers' : 'students';
      
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        address: formData.address,
        avatar_url: formData.avatar_url,
      };

      if (isTeacherOrAdmin) {
        updateData.phone = formData.phone;
        updateData.subject = formData.subject;
      } else {
        updateData.contact_number = formData.phone;
        updateData.parent_name = formData.parent_name;
      }

      const { error } = await supabase.from(table).update(updateData).eq('id', profileId);
      if (error) throw error;

      toast.success("Profile updated successfully!");
      setCurrentAuthEmail(formData.email);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="h-screen flex items-center justify-center font-black text-blue-900">ASM Loading...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 md:p-10 bg-white rounded-[2.5rem] shadow-2xl mt-10 border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">My Profile</h2>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{userRole} Account</p>
        </div>
        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-sm ${userRole === 'student' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {userRole === 'student' ? '🚫 View Only' : '✅ Edit Access'}
        </span>
      </div>

      <form onSubmit={handleUpdate} className="space-y-5">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-28 h-28 rounded-full border-4 border-blue-50 overflow-hidden shadow-xl bg-gray-50 relative group">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-black text-gray-300">
                {formData.full_name?.charAt(0) || "U"}
              </div>
            )}
            {userRole !== 'student' && (
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <span className="text-white text-[10px] font-black">EDIT</span>
                <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Login Email</label>
            <input type="email" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:border-blue-500 outline-none transition" 
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={userRole === 'student'} />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Full Name</label>
            <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:border-blue-500 outline-none transition" 
              value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} disabled={userRole === 'student'} />
          </div>

          {userRole !== 'student' && userRole !== 'admin' && (
             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Subject</label>
               <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" 
                 value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
             </div>
          )}
        </div>

        {/* ✅ Button Fix: Only Admin/Teacher can see SAVE button */}
        {userRole !== 'student' ? (
          <button type="submit" disabled={loading || uploading} className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition transform active:scale-95 mt-6">
            {loading ? "Saving Changes..." : "Update Profile & Auth"}
          </button>
        ) : (
          <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 text-center">
             <p className="text-xs font-bold text-orange-600 italic">"Profile editing is disabled for students. Please contact the school office for any changes."</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileSetupPage;
