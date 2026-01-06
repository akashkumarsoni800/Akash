import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import DashboardHeader from '../components/DashboardHeader';

const ProfileSetupPage = () => {
  const { id } = useParams(); // URL से स्टूडेंट ID (अगर एडमिन एडिट कर रहा है)
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [userRole, setUserRole] = useState<string | null>(null); // लॉग-इन यूजर का रोल
  const [profileId, setProfileId] = useState<any>(null); // जिसका डेटा अपडेट होना है
  const [currentAuthEmail, setCurrentAuthEmail] = useState('');

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
    const fetchProfileData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate('/');

        // 1. लॉग-इन यूजर का रोल पहचानें
        const { data: teacherCheck } = await supabase.from('teachers').select('role, id').eq('email', user.email).maybeSingle();
        const loggedInRole = teacherCheck?.role === 'admin' ? 'admin' : (teacherCheck ? 'teacher' : 'student');
        setUserRole(loggedInRole);

        // 2. डेटा किसका लोड करना है?
        if (id && loggedInRole === 'admin') {
          // एडमिन किसी स्टूडेंट को एडिट कर रहा है
          const { data: student } = await supabase.from('students').select('*').eq('id', id).maybeSingle();
          if (student) {
            setProfileId(student.id);
            setCurrentAuthEmail(student.email);
            setFormData({
              full_name: student.full_name || '',
              email: student.email || '',
              phone: student.contact_number || '',
              address: student.address || '',
              avatar_url: student.avatar_url || '',
              parent_name: student.parent_name || '',
              subject: ''
            });
          }
        } else {
          // यूजर खुद की प्रोफाइल देख रहा है
          setCurrentAuthEmail(user.email || '');
          if (teacherCheck) {
            setProfileId(teacherCheck.id);
            setFormData({
              full_name: teacherCheck.full_name || '',
              email: user.email || '',
              phone: teacherCheck.phone || '',
              address: '', // Teachers में एड्रेस नहीं है
              avatar_url: teacherCheck.avatar_url || '',
              subject: teacherCheck.subject || '',
              parent_name: ''
            });
          } else {
            const { data: student } = await supabase.from('students').select('*').eq('email', user.email).maybeSingle();
            if (student) {
              setProfileId(student.id);
              setUserRole('student');
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
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProfileData();
  }, [id, navigate]);

  // 🖼️ Profile Pic Upload Logic
  const uploadAvatar = async (event: any) => {
    if (userRole === 'student' && !id) return toast.error("Only admin can change this.");
    
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
      toast.success("Image Uploaded! Remember to save.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'student' && !id) return toast.error("Access Denied");

    setLoading(true);
    try {
      // ✅ 1. Auth Email Update (Rate Limit handling)
      if (formData.email !== currentAuthEmail) {
        const { error: authError } = await supabase.auth.updateUser({ email: formData.email });
        if (authError) {
          if (authError.status === 429) throw new Error("Security Lock: Too many requests. Wait 10 mins.");
          throw authError;
        }
      }

      // ✅ 2. Database Update Logic
      const isStudentData = id !== undefined || userRole === 'student';
      const targetTable = (id || userRole === 'student') ? 'students' : 'teachers';
      
      let updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        avatar_url: formData.avatar_url,
      };

      if (targetTable === 'teachers') {
        updateData.phone = formData.phone;
        updateData.subject = formData.subject;
        // Address यहाँ नहीं जोड़ना है
      } else {
        updateData.contact_number = formData.phone;
        updateData.parent_name = formData.parent_name;
        updateData.address = formData.address;
      }

      const { data, error } = await supabase
        .from(targetTable)
        .update(updateData)
        .eq('id', profileId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No record updated in DB.");

      toast.success("Database Updated Successfully! ✅");
      if (id) navigate('/admin/dashboard');

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="h-screen flex items-center justify-center font-black">ASM SECURE LOADING...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <DashboardHeader full_name={formData.full_name} userRole={userRole} avatarUrl={formData.avatar_url} onMenuClick={() => {}} />

      <div className="pt-24 px-4 max-w-xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-gray-100">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-blue-900 uppercase italic">{id ? "Edit Student Info" : "My Profile Settings"}</h2>
            <div className="mt-2 inline-block px-4 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
              {userRole} Mode
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-5">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-6 group">
              <div className="w-32 h-32 rounded-full border-4 border-blue-50 overflow-hidden shadow-xl bg-gray-50 relative">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-black text-gray-200 uppercase">{formData.full_name[0]}</div>
                )}
                {(userRole !== 'student' || id) && (
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                    <span className="text-white text-[10px] font-black uppercase">Change</span>
                    <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Full Name</label>
                <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:border-blue-500 outline-none" 
                  value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} disabled={userRole === 'student' && !id} />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Login Email</label>
                <input type="email" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={userRole === 'student' && !id} />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Mobile Number</label>
                <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={userRole === 'student' && !id} />
              </div>

              {/* Conditional Address Field (Students Only) */}
              {(id || userRole === 'student') && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Residential Address</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" 
                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} disabled={userRole === 'student' && !id} />
                </div>
              )}
            </div>

            {userRole !== 'student' || id ? (
              <button type="submit" disabled={loading || uploading} className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all transform active:scale-95 hover:bg-black mt-4">
                {loading ? "SAVING CHANGES..." : "UPDATE DATABASE"}
              </button>
            ) : (
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-center">
                <p className="text-[10px] font-black text-orange-600 uppercase">Self-editing is disabled for students.</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
