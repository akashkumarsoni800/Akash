import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import DashboardHeader from '../components/DashboardHeader';

const ProfileSetupPage = () => {
  const { id } = useParams(); 
  const location = useLocation();
  const navigate = useNavigate();
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Roles & Target logic
  const [viewerRole, setViewerRole] = useState<string | null>(null); // लॉग-इन यूजर कौन है?
  const [targetType, setTargetType] = useState<'student' | 'teacher'>('student'); // डेटा किसका है?
  const [profileId, setProfileId] = useState<any>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    avatar_url: '',
    parent_name: '',
    subject: ''
  });

  useEffect(() => {
    const fetchFullData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate('/');

        // 1. लॉग-इन यूजर का रोल पता करें (Admin, Teacher, या Student)
        const { data: teacherCheck } = await supabase.from('teachers').select('role').eq('email', user.email).maybeSingle();
        const role = teacherCheck?.role === 'admin' ? 'admin' : (teacherCheck ? 'teacher' : 'student');
        setViewerRole(role);

        // 2. तय करें कि कौन सी टेबल से डेटा उठाना है
        let tableToFetch: 'students' | 'teachers' = 'students';
        let fetchId = id;

        if (location.pathname.includes('/edit-teacher')) {
          tableToFetch = 'teachers';
          setTargetType('teacher');
        } else if (location.pathname.includes('/edit-student')) {
          tableToFetch = 'students';
          setTargetType('student');
        } else {
          // खुद की प्रोफाइल देख रहा है
          tableToFetch = (role === 'admin' || role === 'teacher') ? 'teachers' : 'students';
          setTargetType(tableToFetch === 'teachers' ? 'teacher' : 'student');
          const { data: self } = await supabase.from(tableToFetch).select('id').eq('email', user.email).maybeSingle();
          fetchId = self?.id;
        }

        // 3. डेटा फेच करें
        const { data: profile } = await supabase.from(tableToFetch).select('*').eq('id', fetchId).maybeSingle();

        if (profile) {
          setProfileId(profile.id);
          setFormData({
            full_name: profile.full_name || '',
            email: profile.email || '',
            phone: profile.phone || profile.contact_number || '',
            address: profile.address || '',
            avatar_url: profile.avatar_url || '',
            parent_name: profile.parent_name || '',
            subject: profile.subject || ''
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchFullData();
  }, [id, location.pathname]);

  // 🖼️ PROFILE PIC UPLOAD
  const uploadAvatar = async (event: any) => {
    if (viewerRole === 'student' && !id) return toast.error("Editing disabled for students.");
    
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      toast.success("Image uploaded! Click Save.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewerRole === 'student' && !id) return;

    setLoading(true);
    try {
      const table = targetType === 'teacher' ? 'teachers' : 'students';
      
      let updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        avatar_url: formData.avatar_url,
      };

      if (targetType === 'teacher') {
        updateData.phone = formData.phone;
        updateData.subject = formData.subject;
      } else {
        updateData.contact_number = formData.phone;
        updateData.address = formData.address;
        updateData.parent_name = formData.parent_name;
      }

      const { error } = await supabase.from(table).update(updateData).eq('id', profileId);
      if (error) throw error;

      toast.success("Profile Updated! ✅");
      if (id) navigate('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="h-screen flex items-center justify-center font-black uppercase text-blue-900">ASM Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <DashboardHeader full_name={formData.full_name} userRole={viewerRole} avatarUrl={formData.avatar_url} onMenuClick={() => {}} />

      <div className="pt-24 px-4 max-w-xl mx-auto">
        <div className="bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-100">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">
              {id ? `Edit ${targetType}` : "Profile Settings"}
            </h2>
            <p className="text-[10px] font-black text-blue-600 bg-blue-50 inline-block px-4 py-1 rounded-full mt-2 uppercase">
              {viewerRole} Access
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            
            {/* 🖼️ Avatar Section (RESTORED) */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-black text-gray-200 uppercase">{formData.full_name[0]}</div>
                  )}
                </div>
                {(viewerRole !== 'student' || id) && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full shadow-lg cursor-pointer hover:scale-110 transition active:scale-95 border-4 border-white">
                    <span className="text-xs font-black">EDIT</span>
                    <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
                  </label>
                )}
              </div>
              {uploading && <p className="text-[10px] font-black text-blue-500 mt-2 animate-pulse uppercase">Uploading Image...</p>}
            </div>

            <div className="space-y-4">
              {/* Universal Fields */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Full Name</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} disabled={viewerRole === 'student' && !id} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Email</label>
                  <input type="email" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={viewerRole === 'student' && !id} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Mobile Number</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={viewerRole === 'student' && !id} />
                </div>
              </div>

              {/* 👨‍🏫 Teacher Specific: Subject */}
              {targetType === 'teacher' && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Specialist Subject</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                </div>
              )}

              {/* 🎓 Student Specific: Address & Parent */}
              {targetType === 'student' && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Parent Name</label>
                    <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} disabled={viewerRole === 'student' && !id} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Home Address</label>
                    <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} disabled={viewerRole === 'student' && !id} />
                  </div>
                </div>
              )}
            </div>

            {/* Save Button Logic */}
            {(viewerRole !== 'student' || id) ? (
              <button type="submit" disabled={loading || uploading} className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all transform active:scale-95 hover:bg-black mt-6">
                {loading ? "SAVING..." : "UPDATE PROFILE"}
              </button>
            ) : (
              <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 text-center">
                <p className="text-xs font-bold text-orange-600 italic tracking-tight">"Self-editing is disabled for students. Contact office for changes."</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
