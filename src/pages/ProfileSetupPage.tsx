import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const ProfileSetupPage = () => {
  const { id } = useParams(); 
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Auth Email State
  const [currentAuthEmail, setCurrentAuthEmail] = useState('');

  const [viewerRole, setViewerRole] = useState<string>('checking...');
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
      setLoading(true);
      try {
        // 1. Get Logged In User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
           navigate('/');
           return;
        }

        setCurrentAuthEmail(user.email || '');

        // 2. Identify Role (Check Teachers Table First using ID)
        // ID se check karna jyada safe h
        let detectedRole = 'student'; // Default assume student
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', user.id) // ✅ Email ki jagah ID se check kiya
          .maybeSingle();

        if (teacherData) {
          detectedRole = teacherData.role === 'admin' ? 'admin' : 'teacher';
        }
        
        setViewerRole(detectedRole);

        // 3. Determine WHO to Edit (Target)
        let tableToFetch = '';
        let idToFetch = id; // URL se ID li (agar admin kisi aur ko edit kar rha h)

        if (location.pathname.includes('/edit-teacher')) {
          tableToFetch = 'teachers'; setTargetType('teacher');
        } else if (location.pathname.includes('/edit-student')) {
          tableToFetch = 'students'; setTargetType('student');
        } else {
          // Self Edit Mode (Khud ki profile)
          if (detectedRole === 'admin' || detectedRole === 'teacher') {
            tableToFetch = 'teachers'; 
            setTargetType('teacher'); 
            idToFetch = user.id; // Khud ki ID
          } else {
            tableToFetch = 'students'; 
            setTargetType('student'); 
            idToFetch = user.id; // Khud ki ID
          }
        }

        // 4. Fetch Profile Data
        if (tableToFetch && idToFetch) {
          const { data: profile, error } = await supabase
            .from(tableToFetch)
            .select('*')
            .eq('id', idToFetch)
            .maybeSingle();

          if (profile) {
            setProfileId(profile.id);
            setFormData({
              full_name: profile.full_name || '',
              email: profile.email || '',
              phone: profile.phone || profile.contact_number || '', // Teacher me phone, Student me contact_number
              address: profile.address || '',
              avatar_url: profile.avatar_url || '',
              parent_name: profile.parent_name || '',
              subject: profile.subject || ''
            });
          }
        }

      } catch (err) { 
        console.error("Init Error:", err); 
      } finally { 
        setLoading(false); 
      }
    };

    initPage();
  }, [id, location.pathname, navigate]);

  // ✅ 5. Avatar Upload Function (Jo Missing Tha)
  const uploadAvatar = async (event: any) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setFormData((prev) => ({ ...prev, avatar_url: data.publicUrl }));
      toast.success("Image uploaded! Click Save to apply.");
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  // ✅ 6. Handle Update (Saving Data)
  
      
          const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // ✅ सिर्फ ये एक RPC कॉल दोनों जगह (Auth + Table) डेटा बदल देगी
      const { error } = await supabase.rpc('sync_user_update', {
        u_id: profileId, // ये आपकी UUID होनी चाहिए
        new_email: formData.email,
        new_name: formData.full_name,
        new_phone: formData.phone,
        new_subject: targetType === 'teacher' ? formData.subject : '',
        new_address: formData.address,
        new_parent: formData.parent_name,
        new_avatar: formData.avatar_url,
        t_table: targetType === 'teacher' ? 'teachers' : 'students'
      });

      if (error) throw error;

      toast.success("Login & Profile both updated! ✅");

      // अगर ईमेल बदला है, तो सेशन रिफ्रेश करने के लिए लॉगआउट करना अच्छा है
      if (formData.email !== currentAuthEmail) {
        await supabase.auth.signOut();
        navigate('/');
      } else {
        navigate(viewerRole === 'admin' ? '/admin/dashboard' : '/student/dashboard');
      }

    } catch (err: any) {
      console.error("RPC Error:", err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
};


  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-blue-600">Loading Profile...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 md:p-10 pb-20">
      <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-gray-100 mt-6">

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-blue-900 uppercase italic">
            {id ? `Edit ${targetType}` : "My Profile"}
          </h2>
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full mt-2 uppercase">
            {viewerRole === 'checking...' ? 'Loading...' : viewerRole} Mode
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-5">
          {/* Avatar Section */}
          <div className="flex justify-center mb-4">
            <div className="relative group w-28 h-28">
              <img 
                src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.full_name}`} 
                className="w-full h-full rounded-full object-cover border-4 border-gray-100 shadow-lg"
                alt="Profile"
              />
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:scale-110 transition border-2 border-white shadow-md">
                <span className="text-[10px] font-bold">📷</span>
                <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Common Inputs */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Full Name</label>
            <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Email Address</label>
            <input type="email" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Mobile Number</label>
            <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>

          {/* Teacher Only Input */}
          {targetType === 'teacher' && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Subject</label>
              <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
            </div>
          )}

          {/* Student Only Inputs */}
          {targetType === 'student' && (
            <>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Parent Name</label>
                <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Address</label>
                <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
            </>
          )}

          <button type="submit" disabled={saving || uploading} className="w-full bg-blue-900 text-white py-4 rounded-2xl font-black uppercase shadow-lg hover:bg-black transition mt-4">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
