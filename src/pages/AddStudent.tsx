// AddStudent.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { User, Camera, ShieldCheck } from 'lucide-react';

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

  // Title Case Function
  const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Handle Input Change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (['name', 'father', 'class', 'address'].includes(name)) {
      finalValue = toTitleCase(value);
    }

    setFormData({ ...formData, [name]: finalValue });
  };

  // Handle Photo
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 2 * 1024 * 1024) {
        toast.error('Photo size should be less than 2MB');
        return;
      }

      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Generate Registration No
  const generateRegNo = (className: string, roll: string) => {
    const year = new Date().getFullYear();
    const cleanClass = className.replace(/\s+/g, '').toUpperCase();
    const cleanRoll = roll.padStart(3, '0');
    return `REG/${year}/${cleanClass}/${cleanRoll}`;
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = '';
      let authUserId: string | null = null;

      // Upload Photo
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

      const regNo = generateRegNo(formData.class, formData.roll);

      // Optional Auth User Create
      if (formData.email && formData.email.includes('@')) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: 'Student@123',
        });

        if (!authError) {
          authUserId = authData.user?.id || null;
        }
      }

      // Insert Into DB
      const { error: dbError } = await supabase.from('students').insert([
        {
          full_name: formData.name,
          class_name: formData.class,
          roll_no: formData.roll,
          registration_no: regNo,
          father_name: formData.father,
          contact_number: formData.phone || null,
          email: formData.email || null,
          date_of_birth: formData.dob,
          gender: formData.gender,
          address: formData.address,
          photo_url: photoUrl,
          auth_id: authUserId,
          is_approved: 'approved',
        },
      ]);

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
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 md:p-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-4xl border"
      >
        <h2 className="text-3xl font-bold text-center mb-8">New Admission</h2>

        {/* PHOTO SECTION */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative">
            <div className="w-36 h-36 rounded-3xl bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-dashed">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={60} className="text-gray-300" />
              )}
            </div>

            {/* Camera Button */}
            <label
              htmlFor="photo-input"
              className="absolute bottom-0 right-0 bg-indigo-600 text-white p-3 rounded-xl cursor-pointer hover:bg-indigo-700"
            >
              <Camera size={18} />
            </label>

            {/* Hidden Input */}
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
          <p className="text-xs mt-3 text-gray-400">
            Click camera icon to take photo or select from gallery
          </p>
        </div>

        {/* FORM FIELDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="Full Name *" name="name" value={formData.name} onChange={handleChange} required />
          <InputField label="Class *" name="class" value={formData.class} onChange={handleChange} required />
          <InputField label="Roll *" name="roll" value={formData.roll} onChange={handleChange} required />
          <InputField label="Father Name *" name="father" value={formData.father} onChange={handleChange} required />
          <InputField label="DOB *" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
          <InputField label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
        </div>

        <textarea
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          className="w-full mt-6 p-4 bg-gray-50 rounded-xl"
          required
        />

        <button
          disabled={loading}
          className="w-full bg-black text-white py-4 rounded-xl mt-8 flex items-center justify-center gap-2"
        >
          {loading ? 'Processing...' : <>Complete Admission <ShieldCheck size={18} /></>}
        </button>
      </form>
    </div>
  );
};

const InputField = ({ label, ...props }: any) => (
  <div>
    <label className="block text-sm font-semibold mb-1">{label}</label>
    <input
      {...props}
      className="w-full p-3 bg-gray-50 rounded-xl outline-none"
    />
  </div>
);

const UserPlusIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="7" r="4" />
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

export default AddStudent;
