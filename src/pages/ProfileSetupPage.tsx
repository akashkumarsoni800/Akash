import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import DashboardHeader from '../components/DashboardHeader';

const ProfileSetupPage = () => {
  const { id } = useParams(); 
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true); // Page Loading
  const [saving, setSaving] = useState(false); // Save Button Loading
  const [uploading, setUploading] = useState(false);
  
  // ✅ 1. Who is logged in? (Admin / Teacher / Student)
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  
  // ✅ 2. Whose profile are we editing? (Target)
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

        console.log("Logged in user:", user.email);

        // 🔍 STEP 1: Identify Viewer Role (Strict Check)
        let detectedRole = 'guest';
        
        // Check Teachers Table First
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (teacherData) {
          detectedRole = teacherData.role === 'admin' ? 'admin' : 'teacher';
        } else {
          // Check Students Table Second
          const { data: studentData } = await supabase
            .from('students')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();
          
          if (studentData) detectedRole = 'student';
        }

        setViewerRole(detectedRole);
        console.log("Detected Role:", detectedRole);

        // 🔍 STEP 2: Determine Target Profile (Who to edit?)
        let tableToFetch = '';
        let idToFetch = id;

        // Case A: URL specifies editing a Teacher
        if (location.pathname.includes('/edit-teacher')) {
          tableToFetch = 'teachers';
          setTargetType('teacher');
        } 
        // Case B: URL specifies editing a Student
        else if (location.pathname.includes('/edit-student')) {
          tableToFetch = 'students';
          setTargetType('student');
        } 
        // Case C: Self Profile (Dashboard Link)
        else {
          if (detectedRole === 'admin' || detectedRole === 'teacher') {
            tableToFetch = 'teachers';
            setTargetType('teacher');
            idToFetch = teacherData?.id;
          } else if (detectedRole === 'student') {
            tableToFetch = 'students';
            setTargetType('student');
            // Student ID fetch karna agar pehle fetch nahi kiya
            if (!idToFetch) {
               const { data: selfStudent } = await supabase.from('students').select('id').eq('email', user.email).maybeSingle();
               idToFetch = selfStudent?.id;
            }
          }
        }

        if (!tableToFetch || !idToFetch) {
          console.warn("No target found");
          setLoading(false);
          return;
        }

        // 🔍 STEP 3: Fetch Target Data
        const { data: profile } = await supabase.from(tableToFetch).select('*').eq('id', idToFetch).maybeSingle();

        if (profile) {
          setProfileId(profile.id);
          setFormData({
            full_name: profile.full_name || '',
            email: profile.email || '',
            phone: profile.phone || profile.contact_number || '', // Handles both schemas
            address: profile.address || '',
            avatar_url: profile.avatar_url || '',
            parent_name: profile.parent_name || '',
            subject: profile.subject || ''
          });
        }

      } catch (err) {
        console.error("Init Error:", err);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [id, location.pathname, navigate]);

  // 🖼️ Avatar Logic
  const uploadAvatar = async (event: any) => {
    // Restriction: Student CANNOT upload unless it's Admin editing them
    if (viewerRole === 'student' && !id) return toast.error("Students cannot change profile photo.");

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
      toast.success("Photo uploaded! Click Save.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Restriction Check
    if (viewerRole === 'student' && !id) {
      toast.error("You cannot update your profile.");
      return;
    }

    setSaving(true);
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

      console.log(`Updating ${table} ID: ${profileId}`);

      const { error } = await supabase.from(table).update(updateData).eq('id', profileId);
      if (error) throw error;

      toast.success("Profile Updated Successfully! ✅");
      if (id) navigate('/admin/dashboard'); // Go back if editing someone else
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 uppercase">Checking Permissions...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <DashboardHeader full_name={formData.full_name} userRole={viewerRole} avatarUrl={formData.avatar_url} onMenuClick={() => {}} />

      <div className="pt-24 px-4 max-w-xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-gray-100">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter">
              {id ? `Edit ${targetType}` : "My Profile"}
            </h2>
            <div className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 border ${viewerRole === 'student' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
              Viewer: {viewerRole} Mode
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            
            {/* 🖼️ Avatar Section */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-blue-50 overflow-hidden shadow-lg bg-gray-50">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl font-black text-gray-200 uppercase">{formData.full_name[0]}</div>
                  )}
                </div>
                {/* Only Show Edit Button if Viewer is NOT student OR if Admin is editing Student */}
                {(viewerRole !== 'student' || id) && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:scale-110 transition active:scale-95 border-4 border-white shadow-md">
                    <span className="text-[8px] font-black block">EDIT</span>
                    <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Common Fields */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Full Name</label>
                <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:border-blue-500 outline-none" 
                  value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} 
                  disabled={viewerRole === 'student' && !id} />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Email Address</label>
                <input type="email" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:border-blue-500 outline-none" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
                  disabled={viewerRole === 'student' && !id} />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Mobile Number</label>
                <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:border-blue-500 outline-none" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                  disabled={viewerRole === 'student' && !id} />
              </div>

              {/* 👨‍🏫 Teacher Specific */}
              {targetType === 'teacher' && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Specialist Subject</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:border-blue-500 outline-none" 
                    value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} 
                    disabled={viewerRole === 'student' && !id} /> 
                    {/* Note: Student should theoretically never see this block, but safety first */}
                </div>
              )}

              {/* 🎓 Student Specific */}
              {targetType === 'student' && (
                <>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Parent Name</label>
                    <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:border-blue-500 outline-none" 
                      value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} 
                      disabled={viewerRole === 'student' && !id} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Address</label>
                    <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:border-blue-500 outline-none" 
                      value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} 
                      disabled={viewerRole === 'student' && !id} />
                  </div>
                </>
              )}
            </div>

            {/* SAVE BUTTON */}
            {(viewerRole !== 'student' || id) ? (
              <button type="submit" disabled={saving || uploading} className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all transform active:scale-95 hover:bg-black mt-6">
                {saving ? "SAVING..." : "CONFIRM UPDATE"}
              </button>
            ) : (
              <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 text-center">
                <p className="text-xs font-bold text-orange-600 italic">"Profile editing is restricted for students."</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
