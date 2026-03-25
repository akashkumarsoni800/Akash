import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "sonner";
import { 
 User, Camera, Upload, ShieldCheck, 
 RefreshCw, FlipHorizontal, Fingerprint, 
 Zap, ChevronRight, Info, Star, ChevronLeft, Award, ShieldAlert, Mail, CheckCircle2, Layout
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// SSR-safe dynamic imports
let imageCompression: any = null;
if (typeof window !== "undefined") {
 import("browser-image-compression").then((mod) => {
  imageCompression = mod.default;
 });
}

const AddStudent = () => {
 const navigate = useNavigate();
 const webcamRef = useRef<any>(null);
 const [WebcamComp, setWebcamComp] = useState<any>(null);

 const [loading, setLoading] = useState(false);
 const [photoFile, setPhotoFile] = useState<File | null>(null);
 const [photoPreview, setPhotoPreview] = useState<string | null>(null);
 const [showWebcam, setShowWebcam] = useState(false);
 
 const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
 const [step, setStep] = useState(1);

 const [formData, setFormData] = useState({
  name: "",
  class: "", 
  roll: "", 
  father: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  address: "",
 });

 useEffect(() => {
  if (typeof window !== "undefined") {
   import("react-webcam").then((mod) => setWebcamComp(() => mod.default));
  }
 }, []);

 const fetchNextRoll = async (className: string) => {
  if (!className) return;
  try {
   const { data, error } = await supabase
    .from("students")
    .select("roll_no")
    .eq("class_name", className)
    .order("roll_no", { ascending: false })
    .limit(1);

   if (error) throw error;

   let nextRoll = "1";
   if (data && data.length > 0) {
    nextRoll = (parseInt(data[0].roll_no) + 1).toString();
   }
   setFormData(prev => ({ ...prev, roll: nextRoll }));
   toast.info(`Next Roll for Class ${className} is ${nextRoll}`);
  } catch (err) {
   console.error("Roll error:", err);
  }
 };

 const handleClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = e.target.value.toUpperCase();
  setFormData(prev => ({ ...prev, class: val }));
 };

 const handleClassBlur = () => {
  if (formData.class) fetchNextRoll(formData.class);
 };

 const toTitleCase = (str: string) =>
  str.replace(/\b\w/g, (char) => char.toUpperCase());

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  let value = e.target.value;
  if (["name", "father", "address"].includes(e.target.name)) {
   value = toTitleCase(value);
  }
  setFormData({ ...formData, [e.target.name]: value });
 };

 const compressAndSetImage = async (file: File) => {
  if (!imageCompression) {
   setPhotoFile(file);
   setPhotoPreview(URL.createObjectURL(file));
   return;
  }
  try {
   const options = { maxSizeMB: 1, maxWidthOrHeight: 1000, useWebWorker: true };
   const compressedFile = await imageCompression(file, options);
   setPhotoFile(compressedFile);
   setPhotoPreview(URL.createObjectURL(compressedFile));
  } catch {
   toast.error("Compression failed");
  }
 };

 const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
   await compressAndSetImage(e.target.files[0]);
  }
 };

 const capturePhoto = async () => {
  if (!webcamRef.current) return;
  const imageSrc = webcamRef.current.getScreenshot();
  if (!imageSrc) return;
  const blob = await fetch(imageSrc).then((res) => res.blob());
  const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });
  await compressAndSetImage(file);
  setShowWebcam(false);
 };

 const toggleCamera = () => {
  setFacingMode(prev => prev === "user" ? "environment" : "user");
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.class || !formData.roll) {
   toast.error("Class and Roll are required!");
   return;
  }
  setLoading(true);

  try {
   if (formData.email) {
    const { data: existingTeacher } = await supabase
     .from('teachers')
     .select('full_name')
     .eq('email', formData.email)
     .limit(1)
     .maybeSingle();

    if (existingTeacher) {
     throw new Error(`This email is already registered as a staff member (${existingTeacher.full_name}).`);
    }
   }

   let photoUrl = "";
   if (photoFile) {
    const fileName = `${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage.from("student-photos").upload(fileName, photoFile);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("student-photos").getPublicUrl(fileName);
    photoUrl = data.publicUrl;
   }

   const year = new Date().getFullYear();
   const regNo = `REG/${year}/${formData.class}/${formData.roll.padStart(3, "0")}`;

   const { error } = await supabase.from("students").insert([{
    full_name: formData.name,
    class_name: formData.class,
    roll_no: formData.roll,
    registration_no: regNo,
    father_name: formData.father,
    date_of_birth: formData.dob || null,
    gender: formData.gender,
    address: formData.address || null,
    contact_number: formData.phone || null,
    email: formData.email || null,
    photo_url: photoUrl,
    is_approved: "approved",
   }]);

   if (error) throw error;
   toast.success(`${formData.name} added successfully! Default Password: asm123`);

   setFormData(prev => ({
    ...prev,
    name: "",
    roll: (parseInt(prev.roll) + 1).toString(),
    father: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
   }));
   setPhotoFile(null);
   setPhotoPreview(null);
   setStep(1);
  } catch (err: any) {
   console.error("Registration Error Details:", err);
   const msg = err.message || "Unknown error";
   if (msg.includes("bucket")) {
    toast.error("Storage Bucket Error: Please ensure 'student-photos' bucket is public and has proper RLS policies.");
   } else {
    toast.error(`Registration Failed: ${msg}`);
   }
  } finally {
   setLoading(false);
  }
 };

  return (
   <div className="min-h-screen bg-[var(--bg-main)] py-12 px-4 md:px-10 pb-32">
    <div className="max-w-4xl mx-auto space-y-12">
     
     {/* --- HEADER --- */}
     <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
       <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900  leading-none uppercase">
         Add Student
        </h1>
        <p className="text-slate-400 font-black text-[10px] mt-4 flex items-center justify-center md:justify-start gap-2">
         <ShieldCheck size={12} className="text-[var(--accent-admin)]" /> Student Details v4.8 Stable
        </p>
       </motion.div>
     </div>

     <form onSubmit={handleSubmit} className="space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-10 md:p-16 space-y-12"
      >
        <div className="flex items-center gap-6 border-b border-slate-50 pb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
           <User size={24} />
          </div>
          <div>
           <h2 className="text-3xl font-black text-slate-900  uppercase">Student Details</h2>
           <p className="text-[10px] font-black text-slate-300 tracking-widest leading-none">REGISTRATION FORM</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
         <InputField label="Student Name *" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required icon={User} />
         <InputField label="Father's Name *" name="father" placeholder="Father's Name" value={formData.father} onChange={handleChange} required icon={ShieldCheck} />
         
         <div className="grid grid-cols-2 gap-6">
          <InputField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
          <div className="space-y-1 group">
           <label className="block text-[9px] font-black text-slate-400  ml-2 group-focus-within:text-blue-500">GenderSelection</label>
           <select name="gender" value={formData.gender} onChange={handleChange} className="premium-input appearance-none bg-slate-50 text-[10px] pr-10" required>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
           </select>
          </div>
         </div>

         <InputField label="Phone Number" name="phone" placeholder="Mobile Number" value={formData.phone} onChange={handleChange} icon={Fingerprint} />

         <div className="space-y-1 group">
          <label className="block text-[9px] font-black text-slate-400  mb-3 ml-2 leading-none uppercase">Class *</label>
          <div className="flex gap-4">
           <input type="text" name="class" placeholder="10A" value={formData.class} onChange={handleClassChange} onBlur={handleClassBlur} className="w-full premium-input pl-8 uppercase" required />
           <button type="button" onClick={() => fetchNextRoll(formData.class)} className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-lg active:scale-95">
            <RefreshCw size={20}/>
           </button>
          </div>
         </div>

         <InputField label="Roll Number *" name="roll" value={formData.roll} onChange={handleChange} required icon={Award} />

         <div className="md:col-span-2">
           <InputField label="Email (Login ID) *" name="email" type="email" placeholder="student@school.com" value={formData.email} onChange={handleChange} required icon={Mail} />
         </div>

         <div className="md:col-span-2 space-y-1 group">
          <label className="block text-[9px] font-black text-slate-400  ml-2 group-focus-within:text-blue-500">Address</label>
          <textarea
           placeholder="Home Address..."
           name="address"
           value={formData.address}
           onChange={handleChange}
           className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-black text-slate-900 outline-none h-32 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all text-sm"
           required
          />
         </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="premium-button w-full bg-slate-900 text-white hover:bg-blue-600 p-8 text-lg"
        >
          {loading ? <RefreshCw className="animate-spin" size={24} /> : <ShieldCheck size={24} />}
          {loading ? 'Adding...' : 'Save Student Details'}
        </button>
      </motion.div>
     </form>
    </div>
   </div>
  );
};
const InputField = ({ label, icon: Icon, ...props }: any) => (
 <div className="space-y-1 group">
  <label className="block text-[9px] font-black text-slate-400  ml-2 transition-colors group-focus-within:text-blue-500">{label}</label>
  <div className="relative">
   {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-400 transition-colors" size={18} />}
   <input className="premium-input pl-16" {...props} />
  </div>
 </div>
);

export default AddStudent;
