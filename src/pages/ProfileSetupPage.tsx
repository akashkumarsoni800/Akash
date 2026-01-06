import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const ProfileSetupPage = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');

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
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');
      setUserEmail(user.email || '');

      // 1. रोल और डेटा पहचानें
      const { data: teacher } = await supabase.from('teachers').select('*').eq('email', user.email).maybeSingle();
      
      if (teacher) {
        const role = teacher.role === 'admin' ? 'admin' : 'teacher';
        setUserRole(role);
        
        // अगर एडमिन किसी स्टूडेंट को एडिट कर रहा है (URL में ID है)
        if (id && role === 'admin') {
          const { data: student } = await supabase.from('students').select('*').eq('id', id).maybeSingle();
          if (student) {
            setProfileId(student.id);
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
          // टीचर खुद की प्रोफाइल देख रहा है
          setProfileId(teacher.id);
          setFormData({
            full_name: teacher.full_name || '',
            email: teacher.email || '',
            phone: teacher.phone || '',
            address: '', 
            avatar_url: teacher.avatar_url || '',
            parent_name: '',
            subject: teacher.subject || ''
          });
        }
      } else {
        // स्टूडेंट खुद को देख रहा है
        const { data: student } = await supabase.from('students').select('*').eq('email', user.email).maybeSingle();
        if (student) {
          setUserRole('student');
          setProfileId(student.id);
          setFormData({ ...student, phone: student.contact_number, email: user.email });
        }
      }
    };
    fetchProfile();
  }, [id, navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // स्टूडेंट के लिए लॉक
    if (userRole === 'student' && !id) {
      toast.error("Students cannot update profile.");
      return;
    }

    setLoading(true);

    try {
      // ✅ टेबल और डेटा का चुनाव (Fixing the logic)
      // अगर id मौजूद है तो मतलब एडमिन स्टूडेंट टेबल अपडेट कर रहा है
      const isEditingStudent = id !== undefined;
      const targetTable = isEditingStudent ? 'students' : (userRole === 'admin' || userRole === 'teacher' ? 'teachers' : 'students');
      
      let updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        avatar_url: formData.avatar_url,
      };

      if (targetTable === 'teachers') {
        updateData.phone = formData.phone;
        updateData.subject = formData.subject;
        // ❌ address यहाँ नहीं भेजना है क्योंकि schema में नहीं है
      } else {
        updateData.contact_number = formData.phone;
        updateData.address = formData.address;
        updateData.parent_name = formData.parent_name;
      }

      console.log("Updating Table:", targetTable, "with ID:", profileId); // Debugging

      const { data, error, count } = await supabase
        .from(targetTable)
        .update(updateData)
        .eq('id', profileId)
        .select();

      if (error) throw error;

      // अगर 'data' खाली है, मतलब ID मैच नहीं हुई
      if (!data || data.length === 0) {
        throw new Error("Update failed: User record not found in database.");
      }

      toast.success("Profile Updated Successfully! ✅");
      if (isEditingStudent) navigate('/admin/dashboard');

    } catch (err: any) {
      console.error("Update Error:", err);
      toast.error(err.message || "Database update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-10 bg-white rounded-[2.5rem] shadow-2xl mt-10 border border-gray-100">
       <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-blue-900 uppercase italic">{id ? "Edit Student" : "Update Profile"}</h2>
          <p className="text-[10px] font-black bg-green-50 text-green-600 px-3 py-1 rounded-full inline-block mt-2 uppercase">{userRole} ACCESS</p>
       </div>

       <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Full Name</label>
            <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} disabled={userRole === 'student' && !id} />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Mobile Number</label>
            <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={userRole === 'student' && !id} />
          </div>

          {/* Teacher specific field */}
          {(userRole === 'teacher' || (userRole === 'admin' && !id)) && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Subject</label>
              <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
            </div>
          )}

          {userRole !== 'student' || id ? (
            <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-6">
              {loading ? "SAVING TO DB..." : "SAVE CHANGES"}
            </button>
          ) : (
            <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black text-center rounded-xl border border-red-100 uppercase">
              Student Edit Access Denied
            </div>
          )}
       </form>
    </div>
  );
};

export default ProfileSetupPage;
