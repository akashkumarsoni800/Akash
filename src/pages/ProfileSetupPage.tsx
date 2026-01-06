import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<any>(null);
  const [currentAuthEmail, setCurrentAuthEmail] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '', // सिर्फ स्टूडेंट के लिए इस्तेमाल होगा
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

        // 1. पहले Teachers चेक करें
        const { data: teacher } = await supabase.from('teachers').select('*').eq('email', user.email).maybeSingle();

        if (teacher) {
          setUserRole(teacher.role === 'admin' ? 'admin' : 'teacher');
          setProfileId(teacher.id);
          setFormData({
            full_name: teacher.full_name || '',
            email: user.email || '',
            phone: teacher.phone || '',
            address: '', // टीचर में एड्रेस नहीं है, इसे खाली रखें
            avatar_url: teacher.avatar_url || '',
            subject: teacher.subject || '',
            parent_name: ''
          });
        } else {
          // 2. फिर Students चेक करें
          const { data: student } = await supabase.from('students').select('*').eq('email', user.email).maybeSingle();
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
        console.error("Error:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'student') return toast.error("Admin can only change this.");

    setLoading(true);
    try {
      // ✅ 1. Auth Email Update (Rate Limit Handling)
      if (formData.email !== currentAuthEmail) {
        const { error: authError } = await supabase.auth.updateUser({ email: formData.email });
        if (authError) {
          // अगर बार-बार रिक्वेस्ट भेजेंगे तो ये एरर आएगा
          if (authError.status === 429) throw new Error("Security Lock: Too many requests. Please wait 5-10 minutes.");
          throw authError;
        }
        toast.info("Email confirmation sent!");
      }

      // ✅ 2. Schema Fix: Role के हिसाब से डेटा तैयार करें
      const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';
      const table = isTeacherOrAdmin ? 'teachers' : 'students';
      
      // सिर्फ वही कॉलम भेजें जो उस टेबल में मौजूद हैं
      let updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        avatar_url: formData.avatar_url,
      };

      if (isTeacherOrAdmin) {
        updateData.phone = formData.phone;
        updateData.subject = formData.subject;
        // ❌ यहाँ 'address' को हटा दिया गया है क्योंकि teachers टेबल में यह नहीं है
      } else {
        updateData.contact_number = formData.phone;
        updateData.parent_name = formData.parent_name;
        updateData.address = formData.address; // स्टूडेंट में एड्रेस है
      }

      const { error } = await supabase.from(table).update(updateData).eq('id', profileId);
      if (error) throw error;

      toast.success("Profile Updated! ✅");
      setCurrentAuthEmail(formData.email);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-20 text-center font-black uppercase">ASM Security Check...</div>;

  return (
    <div className="max-w-xl mx-auto p-10 bg-white rounded-[2rem] shadow-2xl mt-10 border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-blue-900 uppercase italic">Edit Profile</h2>
        <p className="text-[10px] font-black bg-blue-50 text-blue-600 inline-block px-3 py-1 rounded-full mt-2 uppercase">{userRole} MODE</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Full Name</label>
          <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} disabled={userRole === 'student'} />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Email (Auth ID)</label>
          <input type="email" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={userRole === 'student'} />
        </div>

        {/* ✅ Address Field: सिर्फ स्टूडेंट को दिखेगा */}
        {userRole === 'student' && (
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Address</label>
            <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.address} disabled={true} />
          </div>
        )}

        {userRole !== 'student' ? (
          <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black uppercase shadow-xl active:scale-95 transition-all">
            {loading ? "PROCESSING..." : "SAVE CHANGES"}
          </button>
        ) : (
          <p className="p-4 bg-red-50 text-red-600 text-[10px] font-black text-center rounded-xl uppercase">Profile update is locked for students</p>
        )}
      </form>
    </div>
  );
};

export default ProfileSetupPage;
