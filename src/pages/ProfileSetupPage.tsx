import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import DashboardHeader from '../components/DashboardHeader';

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
    address: '',
    avatar_url: '',
    parent_name: '',
    subject: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate('/');
        
        setCurrentAuthEmail(user.email || '');

        // 1. चेक करें कि यूजर कौन है
        const { data: student } = await supabase.from('students').select('*').eq('email', user.email).maybeSingle();
        
        if (student) {
          setUserRole('student');
          setProfileId(student.id);
          setFormData(prev => ({ ...prev, ...student, phone: student.contact_number }));
        } else {
          const { data: teacher } = await supabase.from('teachers').select('*').eq('email', user.email).maybeSingle();
          if (teacher) {
            setUserRole(teacher.role === 'admin' ? 'admin' : 'teacher');
            setProfileId(teacher.id);
            setFormData(prev => ({ ...prev, ...teacher }));
          }
        }
      } catch (err: any) {
        toast.error("Error loading profile");
      } finally {
        setInitialLoading(false);
      }
    };
    loadProfile();
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🛑 SECURITY CHECK: अगर स्टूडेंट खुद अपडेट करने की कोशिश करे
    if (userRole === 'student') {
      toast.error("Students cannot update their profile. Contact Admin.");
      return;
    }

    setLoading(true);
    try {
      // 1. ✅ DIRECT EMAIL CHANGE IN SUPABASE AUTH
      // अगर ईमेल बदला गया है, तो उसे Auth में अपडेट करें
      if (formData.email !== currentAuthEmail) {
        const { error: authError } = await supabase.auth.updateUser({ 
          email: formData.email 
        });
        
        if (authError) throw authError;
        toast.info("Login Email updated! Check new email for confirmation.");
      }

      // 2. DATABASE UPDATE
      const table = userRole === 'teacher' || userRole === 'admin' ? 'teachers' : 'students';
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        address: formData.address,
        avatar_url: formData.avatar_url,
      };

      if (userRole === 'student') {
        updateData.parent_name = formData.parent_name;
        updateData.contact_number = formData.phone;
      } else {
        updateData.phone = formData.phone;
        updateData.subject = formData.subject;
      }

      const { error } = await supabase.from(table).update(updateData).eq('id', profileId);
      if (error) throw error;

      toast.success("Profile & Login Email Updated Successfully!");
      setCurrentAuthEmail(formData.email);
    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader full_name={formData.full_name} userRole={userRole?.toUpperCase() || ""} avatarUrl={formData.avatar_url} />
      
      <div className="pt-24 pb-12 px-4 max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-blue-900 uppercase italic">User Profile</h2>
            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${userRole === 'student' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              {userRole === 'student' ? 'View Only' : 'Edit Access'}
            </span>
          </div>
          
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
              <input 
                type="text" 
                className="w-full p-3 bg-gray-50 border rounded-xl disabled:opacity-50" 
                value={formData.full_name} 
                onChange={e => setFormData({...formData, full_name: e.target.value})} 
                disabled={userRole === 'student'} // Student के लिए डिसेबल
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Email (New Login ID)</label>
              <input 
                type="email" 
                className="w-full p-3 bg-gray-50 border rounded-xl border-blue-200 focus:border-blue-500 outline-none" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                disabled={userRole === 'student'} // Student के लिए डिसेबल
              />
              <p className="text-[10px] text-gray-400 mt-1 font-bold italic">* Changing this will change your login email.</p>
            </div>

            {/* Other fields... (Phone, Address etc.) */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Phone</label>
              <input 
                type="text" 
                className="w-full p-3 bg-gray-50 border rounded-xl" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                disabled={userRole === 'student'} 
              />
            </div>

            {/* ✅ SAVE BUTTON: सिर्फ Admin/Teacher को दिखेगा */}
            {userRole !== 'student' ? (
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-blue-900 text-white py-4 rounded-xl font-black shadow-lg active:scale-95 transition-all mt-4"
              >
                {loading ? "SAVING DATA..." : "UPDATE PROFILE & LOGIN"}
              </button>
            ) : (
              <div className="p-4 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-xl border border-yellow-100 text-center italic">
                ⚠️ Profiles can only be edited by the Admin or School Staff.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
