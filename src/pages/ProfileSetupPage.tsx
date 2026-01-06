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
  
  // ✅ Missing Variable Fixed
  const [currentAuthEmail, setCurrentAuthEmail] = useState('');
  
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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate('/');

        // ✅ 1. Set Auth Email (Fix for "not defined" error)
        setCurrentAuthEmail(user.email || '');

        // 2. Identify Viewer Role
        let detectedRole = 'guest';
        const { data: teacherData } = await supabase.from('teachers').select('*').eq('email', user.email).maybeSingle();
        
        if (teacherData) {
          detectedRole = teacherData.role === 'admin' ? 'admin' : 'teacher';
        } else {
          const { data: studentData } = await supabase.from('students').select('*').eq('email', user.email).maybeSingle();
          if (studentData) detectedRole = 'student';
        }
        setViewerRole(detectedRole);

        // 3. Determine Target (Who to edit?)
        let tableToFetch = '';
        let idToFetch = id;

        if (location.pathname.includes('/edit-teacher')) {
          tableToFetch = 'teachers'; setTargetType('teacher');
        } else if (location.pathname.includes('/edit-student')) {
          tableToFetch = 'students'; setTargetType('student');
        } else {
          // Self Edit Logic
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

        if (!tableToFetch || !idToFetch) {
            setLoading(false);
            return;
        }

        // 4. Fetch Profile Data
        const { data: profile } = await supabase.from(tableToFetch).select('*').eq('id', idToFetch).maybeSingle();

        if (profile) {
          setProfileId(profile.id);
          // ✅ Also set email from DB profile to compare later
          if (!id) setCurrentAuthEmail(profile.email || user.email); 

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
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    initPage();
  }, [id, location.pathname, navigate]);

  // 🖼️ Avatar Upload
  // handleUpdate function correction:

const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 🛑 STEP 1: पहले AUTH (Login) ईमेल अपडेट करें
      if (formData.email && formData.email !== currentAuthEmail) {
         const { data, error: authError } = await supabase.auth.updateUser({ 
           email: formData.email 
         });
         
         if (authError) {
           throw new Error("Auth Update Failed: " + authError.message);
         }
         
         // अगर "Secure email change" OFF है, तो data.user.email में नया ईमेल होगा
         console.log("Auth Updated:", data);
      }

      // ✅ STEP 2: अगर Auth पास हो गया, तभी DB अपडेट करें
      const { error } = await supabase.rpc('update_user_profile', {
        user_id: profileId,
        new_full_name: formData.full_name,
        new_email: formData.email,
        new_phone: formData.phone,
        new_subject: targetType === 'teacher' ? formData.subject : '',
        new_address: formData.address,
        new_parent_name: formData.parent_name,
        new_avatar: formData.avatar_url,
        target_table: targetType === 'teacher' ? 'teachers' : 'students'
      });

      if (error) throw error;

      toast.success("Login Email & Profile Updated! Please Login again.");
      
      // ईमेल बदलने पर अक्सर सेशन लॉगआउट हो जाता है, इसलिए सेफ साइड:
      if (formData.email !== currentAuthEmail) {
          await supabase.auth.signOut();
          navigate('/');
      } else if (id) {
          navigate('/admin/dashboard');
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
};
  if (loading) return <div className="h-screen flex items-center justify-center font-bold">Loading Profile...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 md:p-10">
      <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-gray-100 mt-6">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-blue-900 uppercase italic">
            {id ? `Edit ${targetType}` : "My Profile"}
          </h2>
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full mt-2 uppercase">
            {viewerRole} Mode
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-5">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative group w-28 h-28">
              <img 
                src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.full_name}`} 
                className="w-full h-full rounded-full object-cover border-4 border-gray-100 shadow-lg"
                alt="Avatar"
              />
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:scale-110 transition border-2 border-white shadow-md">
                <span className="text-[10px] font-bold">📷</span>
                <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Inputs */}
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

          {targetType === 'teacher' && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Subject</label>
              <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
            </div>
          )}

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
            {saving ? "Updating..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
