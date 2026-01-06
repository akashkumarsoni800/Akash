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
  const [loggedInRole, setLoggedInRole] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<any>(null);

  // ✅ URL की पहचान (Dynamic Check)
  const isEditingTeacher = location.pathname.includes('/edit-teacher');
  const isEditingStudent = location.pathname.includes('/edit-student');
  const isSelfEditing = !id; 

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
    const initialize = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate('/');

        // 1. लॉग-इन यूजर का रोल पता करें
        const { data: myData } = await supabase.from('teachers').select('role').eq('email', user.email).maybeSingle();
        const myRole = myData?.role || 'student';
        setLoggedInRole(myRole);

        // 2. डेटाबेस टेबल चुनें
        let targetTable = 'students';
        if (isEditingTeacher || (myRole !== 'student' && isSelfEditing)) {
          targetTable = 'teachers';
        }

        // 3. सही ID के साथ डेटा फेच करें
        let fetchId = id;
        if (isSelfEditing) {
          const { data: selfData } = await supabase.from(targetTable).select('id').eq('email', user.email).maybeSingle();
          fetchId = selfData?.id;
        }

        const { data: profile } = await supabase.from(targetTable).select('*').eq('id', fetchId).maybeSingle();

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
    initialize();
  }, [id, location.pathname, navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const targetTable = (isEditingStudent || (loggedInRole === 'student' && isSelfEditing)) ? 'students' : 'teachers';
      
      let updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        avatar_url: formData.avatar_url,
      };

      if (targetTable === 'teachers') {
        updateData.phone = formData.phone;
        // Subject सिर्फ टीचर के लिए अपडेट होगा
        if (isEditingTeacher || loggedInRole === 'teacher') {
          updateData.subject = formData.subject;
        }
      } else {
        updateData.contact_number = formData.phone;
        updateData.address = formData.address;
        updateData.parent_name = formData.parent_name;
      }

      const { error } = await supabase.from(targetTable).update(updateData).eq('id', profileId);
      if (error) throw error;

      toast.success("Profile Updated! ✅");
      if (id) navigate('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="h-screen flex items-center justify-center font-black">ASM Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <DashboardHeader full_name={formData.full_name} userRole={loggedInRole} avatarUrl={formData.avatar_url} onMenuClick={() => {}} />

      <div className="pt-24 px-4 max-w-xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-gray-100">
          
          <h2 className="text-2xl font-black text-blue-900 uppercase text-center mb-10 italic">
            {isEditingTeacher ? "Edit Teacher" : (isEditingStudent ? "Edit Student" : "Profile Settings")}
          </h2>

          <form onSubmit={handleUpdate} className="space-y-5">
            
            {/* 1. Name (Universal) */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Full Name</label>
              <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" 
                value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} 
                disabled={loggedInRole === 'student' && isSelfEditing} />
            </div>

            {/* 2. Email (Universal) */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Email Address</label>
              <input type="email" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
                disabled={loggedInRole === 'student' && isSelfEditing} />
            </div>

            {/* 3. Mobile (Universal) */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Mobile Number</label>
              <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" 
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                disabled={loggedInRole === 'student' && isSelfEditing} />
            </div>

            {/* 4. Subject (Dynamic: Only for Teacher Edit or Teacher Self-Edit) */}
            {(isEditingTeacher || (loggedInRole === 'teacher' && isSelfEditing)) && (
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Specialist Subject</label>
                <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" 
                  value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
              </div>
            )}

            {/* 5. Student Specific Fields (Dynamic) */}
            {(isEditingStudent || (loggedInRole === 'student' && isSelfEditing)) && (
              <>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Parent Name</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" 
                    value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} disabled={loggedInRole === 'student' && isSelfEditing} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Residential Address</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" 
                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} disabled={loggedInRole === 'student' && isSelfEditing} />
                </div>
              </>
            )}

            {/* Action Button */}
            {(loggedInRole !== 'student' || !isSelfEditing) ? (
              <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl transition hover:bg-black mt-4">
                {loading ? "SAVING..." : "CONFIRM UPDATE"}
              </button>
            ) : (
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-center font-bold text-[10px] text-orange-600 uppercase">
                Self-editing is disabled for students.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
