import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { User, Camera, UploadCloud, ShieldCheck } from 'lucide-react';

const AddStudent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    roll: '',
    father: '',
    email: '',
    phone: '',
    dob: '', 
    gender: '', 
    address: '', 
  });

  // ✅ Helper Function: हर शब्द का पहला अक्षर बड़ा करने के लिए (Auto Capitalize)
  const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // ✅ इन Fields में पहला अक्षर बड़ा रहेगा और बाकी छोटे
    let finalValue = value;
    if (['name', 'father', 'class', 'address'].includes(name)) {
      finalValue = toTitleCase(value);
    }
    
    setFormData({ ...formData, [name]: finalValue });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // ✅ Auto Registration Number Generator Logic
  const generateRegNo = (className: string, roll: string) => {
    const year = new Date().getFullYear();
    const cleanClass = className.replace(/\s+/g, '').toUpperCase();
    const cleanRoll = roll.padStart(3, '0'); // 1 को 001 बना देगा
    return `REG/${year}/${cleanClass}/${cleanRoll}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = '';
      let authUserId = null;

      // 1. Photo Upload (Supabase Storage)
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('student-photos')
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('student-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
      }

      // 2. Registration Number Generate करना
      const regNo = generateRegNo(formData.class, formData.roll);

      // 3. Auth User Creation (Only if Email is provided)
      if (formData.email && formData.email.includes('@')) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: 'Student@123',
        });
        if (!authError) authUserId = authData.user?.id;
      }

      // 4. Insert into Students Table
      const { error: dbError } = await supabase.from('students').insert([{
        full_name: formData.name,
        class_name: formData.class,
        roll_no: formData.roll,
        registration_no: regNo, // ✅ नया कॉलम: Auto Generated
        father_name: formData.father,
        contact_number: formData.phone || null, // Optional
        email: formData.email || null, // Optional
        date_of_birth: formData.dob,
        gender: formData.gender,
        address: formData.address,
        photo_url: photoUrl,
        auth_id: authUserId,
        is_approved: 'approved' // सीधा अप्रूव कर रहे हैं
      }]);

      if (dbError) throw dbError;

      toast.success(`Student Added! Reg No: ${regNo}`);
      navigate('/admin/dashboard');

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 md:p-10 font-sans">
      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-4xl border border-gray-100">
        
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-indigo-50 rounded-3xl text-indigo-600 mb-4">
             <UserPlusIcon size={32} />
          </div>
          <h2 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter">New Admission</h2>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Registration ASM v3.0</p>
        </div>

        {/* --- Photo Upload Section --- */}
        <div className="flex flex-col items-center mb-12">
           <div className="relative group">
              <div className="w-36 h-36 rounded-[3rem] bg-gray-50 border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center border-dashed border-gray-200">
                 {photoPreview ? (
                   <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" />
                 ) : (
                   <User size={60} className="text-gray-200" />
                 )}
              </div>
              <label className="absolute bottom-1 right-1 bg-indigo-600 text-white p-4 rounded-2xl shadow-xl cursor-pointer hover:bg-indigo-700 transition-all hover:scale-110">
                 <Camera size={20} />
                 <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
           </div>
           <p className="text-[10px] font-black text-gray-400 uppercase mt-4 tracking-widest">Student Photograph</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-50 pb-2">Personal Details</h3>
            <InputField label="Full Name *" name="name" placeholder="E.g. Rahul Kumar" value={formData.name} onChange={handleChange} required />
            
            <div className="grid grid-cols-2 gap-4">
               <InputField label="Date of Birth *" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-2 mb-2">Gender *</label>
                  <select name="gender" className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
               </div>
            </div>

            <InputField label="Father's Name *" name="father" placeholder="Father's full name" value={formData.father} onChange={handleChange} required />
          </div>

          {/* Academic & Contact */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-50 pb-2">School & Contact</h3>
            <div className="grid grid-cols-2 gap-4">
               <InputField label="Class/Section *" name="class" placeholder="E.g. 10th A" value={formData.class} onChange={handleChange} required />
               <InputField label="Roll Number *" name="roll" placeholder="E.g. 05" value={formData.roll} onChange={handleChange} required />
            </div>

            {/* ✅ Email and Phone are Optional now */}
            <InputField label="Email (Optional)" name="email" type="email" placeholder="student@example.com" value={formData.email} onChange={handleChange} />
            <InputField label="Phone (Optional)" name="phone" type="tel" placeholder="10-digit mobile" value={formData.phone} onChange={handleChange} />
          </div>
        </div>

        <div className="mt-8">
           <label className="block text-[10px] font-black text-gray-400 uppercase ml-2 mb-2">Residential Address *</label>
           <textarea name="address" className="w-full p-5 bg-gray-50 border-none rounded-[2rem] font-bold outline-none h-28 focus:ring-2 focus:ring-indigo-500/20 transition-all" value={formData.address} onChange={handleChange} required placeholder="Full address with village/city, post, and district..." />
        </div>

        <button
          disabled={loading}
          className="w-full bg-gray-900 text-white py-6 rounded-[2.5rem] mt-12 font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all disabled:bg-gray-100 flex items-center justify-center gap-4 text-sm"
        >
          {loading ? (
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Complete Admission <ShieldCheck size={20}/></>
          )}
        </button>

        <p className="text-[10px] text-gray-400 mt-6 text-center font-bold uppercase tracking-widest">
          ASM v3.0 Digitalized Registration System
        </p>
      </form>
    </div>
  );
};

// --- Reusable Input Component ---
const InputField = ({ label, ...props }: any) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-gray-400 uppercase ml-2">{label}</label>
    <input className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-300 shadow-sm" {...props} />
  </div>
);

// --- Custom Icon ---
const UserPlusIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

export default AddStudent;
