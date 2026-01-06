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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<any>(null);
  const [currentAuthEmail, setCurrentAuthEmail] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '', // Mobile Number
    address: '', // Only for Student
    avatar_url: '', // Profile Pic
    subject: '',
    parent_name: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate('/');
        setCurrentAuthEmail(user.email || '');

        // 1. Teachers/Admin Check
        const { data: teacher } = await supabase.from('teachers').select('*').eq('email', user.email).maybeSingle();

        if (teacher) {
          setUserRole(teacher.role === 'admin' ? 'admin' : 'teacher');
          setProfileId(teacher.id);
          setFormData({
            full_name: teacher.full_name || '',
            email: user.email || '',
            phone: teacher.phone || '', // Teacher phone column
            address: '', 
            avatar_url: teacher.avatar_url || '',
            subject: teacher.subject || '',
            parent_name: ''
          });
        } else {
          // 2. Students Check
          const { data: student } = await supabase.from('students').select('*').eq('email', user.email).maybeSingle();
          if (student) {
            setUserRole('student');
            setProfileId(student.id);
            setFormData({
              full_name: student.full_name || '',
              email: user.email || '',
              phone: student.contact_number || '', // Student contact column
              address: student.address || '',
              avatar_url: student.avatar_url || '',
              parent_name: student.parent_name || '',
              subject: ''
            });
          }
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // 🖼️ 1. PROFILE PIC UPLOAD LOGIC
  const uploadAvatar = async (event: any) => {
    if (userRole === 'student') return toast.error("Students cannot change profile photos.");
    
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Storage में अपलोड करें
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      // पब्लिक URL प्राप्त करें
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      toast.success("Image uploaded! Click Save to apply.");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'student') return toast.error("Edit access denied for students.");

    setLoading(true);
    try {
      // ✅ 2. AUTH EMAIL UPDATE
      if (formData.email !== currentAuthEmail) {
        const { error: authError } = await supabase.auth.updateUser({ email: formData.email });
        if (authError) throw authError;
      }

      // ✅ 3. DATABASE UPDATE (Role specific columns)
      const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';
      const table = isTeacherOrAdmin ? 'teachers' : 'students';
      
      let updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        avatar_url: formData.avatar_url,
      };

      if (isTeacherOrAdmin) {
        updateData.phone = formData.phone; // Teacher/Admin schema
        updateData.subject = formData.subject;
      } else {
        updateData.contact_number = formData.phone; // Student schema
        updateData.parent_name = formData.parent_name;
        updateData.address = formData.address;
      }

      const { error } = await supabase.from(table).update(updateData).eq('id', profileId);
      if (error) throw error;

      toast.success("Profile Updated Successfully! ✅");
      setCurrentAuthEmail(formData.email);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-20 text-center font-black">ASM LOADING...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Sidebar के साथ सिंक Header */}
      <DashboardHeader 
        full_name={formData.full_name} 
        userRole={userRole} 
        avatarUrl={formData.avatar_url}
        onMenuClick={() => {}} // Sidebar component handle करेगा इसे
      />

      <div className="pt-24 px-4 max-w-xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-gray-100">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">My Settings</h2>
            <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-[0.3em]">Adarsh Shishu Mandir</p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            
            {/* 🖼️ Avatar Section */}
            <div className="flex flex-col items-center group">
              <div className="w-32 h-32 rounded-full border-4 border-blue-50 overflow-hidden shadow-xl bg-gray-50 relative">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-black text-gray-200 uppercase">
                    {formData.full_name?.charAt(0)}
                  </div>
                )}
                {userRole !== 'student' && (
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                    <span className="text-white text-[10px] font-black uppercase">Change</span>
                    <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
                  </label>
                )}
              </div>
              {uploading && <p className="text-[10px] text-blue-600 font-bold mt-2 animate-pulse">UPLOADING IMAGE...</p>}
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Full Name</label>
                <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} disabled={userRole === 'student'} />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Login Email</label>
                <input type="email" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={userRole === 'student'} />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Mobile Number</label>
                <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={userRole === 'student'} />
              </div>

              {userRole === 'teacher' && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Specialist Subject</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                </div>
              )}
            </div>

            {userRole !== 'student' ? (
              <button type="submit" disabled={loading || uploading} className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all transform active:scale-95 hover:bg-black">
                {loading ? "SAVING..." : "UPDATE PROFILE"}
              </button>
            ) : (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
                <p className="text-[10px] font-black text-red-600 uppercase">You do not have permission to edit this profile.</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
