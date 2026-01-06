import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

// ❌ IMPORT REMOVED: DashboardHeader यहाँ नहीं चाहिए

const ProfileSetupPage = () => {
  const { id } = useParams(); 
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<'student' | 'teacher' | null>(null);
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
    const initPage = async () => {
      // (पुराना useEffect लॉजिक सेम रहेगा, बस UI में बदलाव है)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate('/');

        // 1. Viewer Role Logic
        let detectedRole = 'guest';
        const { data: teacherData } = await supabase.from('teachers').select('*').eq('email', user.email).maybeSingle();
        if (teacherData) {
          detectedRole = teacherData.role === 'admin' ? 'admin' : 'teacher';
        } else {
          const { data: studentData } = await supabase.from('students').select('*').eq('email', user.email).maybeSingle();
          if (studentData) detectedRole = 'student';
        }
        setViewerRole(detectedRole);

        // 2. Target Logic
        let tableToFetch = '';
        let idToFetch = id;

        if (location.pathname.includes('/edit-teacher')) {
          tableToFetch = 'teachers'; setTargetType('teacher');
        } else if (location.pathname.includes('/edit-student')) {
          tableToFetch = 'students'; setTargetType('student');
        } else {
          // Self Edit
          if (detectedRole === 'admin' || detectedRole === 'teacher') {
            tableToFetch = 'teachers'; setTargetType('teacher'); idToFetch = teacherData?.id;
          } else if (detectedRole === 'student') {
            tableToFetch = 'students'; setTargetType('student'); 
            if (!idToFetch) {
               const { data: self } = await supabase.from('students').select('id').eq('email', user.email).maybeSingle();
               idToFetch = self?.id;
            }
          }
        }

        if (!tableToFetch || !idToFetch) return;

        // 3. Fetch Data
        const { data: profile } = await supabase.from(tableToFetch).select('*').eq('id', idToFetch).maybeSingle();

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
      } catch (err) { console.error(err); }
    };
    initPage();
  }, [id, location.pathname, navigate]);

  const uploadAvatar = async (event: any) => {
    if (viewerRole === 'student' && !id) return toast.error("Not allowed.");
    try {
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      const { error } = await supabase.storage.from('avatars').upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      toast.success("Image uploaded!");
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewerRole === 'student' && !id) return toast.error("Access Denied");
    setSaving(true);

    try {
      const table = targetType === 'teacher' ? 'teachers' : 'students';
      let updateData: any = { full_name: formData.full_name, email: formData.email, avatar_url: formData.avatar_url };

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

      toast.success("Updated Successfully!");
      if (id) navigate('/admin/dashboard');
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    // ❌ यहाँ <DashboardHeader /> हटा दिया गया है
    <div className="max-w-xl mx-auto p-6 md:p-10">
      <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-gray-100 mt-6">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-blue-900 uppercase italic">
            {id ? `Edit ${targetType}` : "My Profile"}
          </h2>
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full mt-2 uppercase">
            {viewerRole} Access
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-5">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative group w-28 h-28">
              <img 
                src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.full_name}`} 
                className="w-full h-full rounded-full object-cover border-4 border-gray-100 shadow-lg"
              />
              {(viewerRole !== 'student' || id) && (
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:scale-110 transition border-2 border-white">
                  <span className="text-[10px] font-bold">📷</span>
                  <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
                </label>
              )}
            </div>
          </div>

          {/* Inputs */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Name</label>
            <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} disabled={viewerRole === 'student' && !id} />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Email</label>
            <input type="email" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={viewerRole === 'student' && !id} />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Mobile</label>
            <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={viewerRole === 'student' && !id} />
          </div>

          {/* Teacher Subject */}
          {targetType === 'teacher' && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Subject</label>
              <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
            </div>
          )}

          {/* Student Fields */}
          {targetType === 'student' && (
            <>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Parent Name</label>
                <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} disabled={viewerRole === 'student' && !id} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Address</label>
                <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} disabled={viewerRole === 'student' && !id} />
              </div>
            </>
          )}

          {/* Button */}
          {(viewerRole !== 'student' || id) ? (
            <button type="submit" disabled={saving || uploading} className="w-full bg-blue-900 text-white py-4 rounded-2xl font-black uppercase shadow-lg hover:bg-black transition mt-4">
              {saving ? "Updating..." : "Save Changes"}
            </button>
          ) : (
            <div className="bg-orange-50 p-4 rounded-xl text-center text-xs font-bold text-orange-600">ReadOnly Mode</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
