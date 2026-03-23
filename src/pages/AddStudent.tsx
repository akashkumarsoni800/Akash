import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "sonner";
import { User, Camera, Upload, ShieldCheck, RefreshCw, FlipHorizontal } from "lucide-react";

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
  
  // ✅ कैमरा स्विच स्टेट ('user' = front, 'environment' = back)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

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

  // ✅ कैमरा स्विच फंक्शन
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
      // 0. Check if email exists in Teachers table
      if (formData.email) {
        const { data: existingTeacher } = await supabase
          .from('teachers')
          .select('full_name')
          .eq('email', formData.email)
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
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4 md:p-10 font-sans pb-24">
      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-4xl border border-gray-100">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
           <h2 className="text-3xl md:text-4xl font-black text-gray-900 uppercase italic leading-none">Admission</h2>
           <div className="bg-indigo-50 px-4 py-2 rounded-2xl text-indigo-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest">ASM Hub v3.0</div>
        </div>

        {/* PHOTO UPLOAD SECTION */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-40 h-40 bg-gray-50 rounded-[3rem] overflow-hidden flex items-center justify-center border-4 border-white shadow-2xl relative group">
            {photoPreview ? (
              <img src={photoPreview} className="w-full h-full object-cover" />
            ) : (
              <User size={60} className="text-gray-200" />
            )}
            {/* FILE UPLOAD HIDDEN INPUT */}
            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
               <Upload className="text-white" size={30} />
               <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center gap-3">
             <button type="button" onClick={() => setShowWebcam(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 md:px-6 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-xl">
               <Camera size={14}/> Live Photo
             </button>
             <label className="flex items-center gap-2 bg-emerald-600 text-white px-5 md:px-6 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-xl cursor-pointer">
               <Upload size={14}/> Browse
               <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
             </label>
             {photoPreview && <button type="button" onClick={() => {setPhotoFile(null); setPhotoPreview(null);}} className="bg-rose-50 text-rose-500 px-4 md:px-6 py-3 rounded-2xl text-[10px] md:text-xs font-bold uppercase">Clear</button>}
          </div>
        </div>

        {/* WEBCAM MODAL */}
        {showWebcam && WebcamComp && (
          <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-sm rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl">
               <WebcamComp 
                 ref={webcamRef} 
                 screenshotFormat="image/jpeg" 
                 videoConstraints={{ facingMode }}
                 className="w-full h-full object-cover"
               />
               {/* SWITCH CAMERA BUTTON */}
               <button type="button" onClick={toggleCamera} className="absolute top-6 right-6 bg-white/20 backdrop-blur-md p-4 rounded-full text-white border border-white/30 active:scale-90 transition-all">
                  <FlipHorizontal size={24} />
               </button>
            </div>
            
            <div className="flex gap-4 mt-10">
              <button type="button" onClick={capturePhoto} className="bg-emerald-500 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all">Capture Photo</button>
              <button type="button" onClick={() => setShowWebcam(false)} className="bg-white/10 backdrop-blur-lg text-white border border-white/10 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all">Close</button>
            </div>
          </div>
        )}

        {/* FORM GRID - STICKY CLASS & ROLL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-indigo-900 p-6 rounded-[2.5rem] border border-indigo-800 shadow-2xl flex flex-col justify-center">
            <label className="block text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-2 ml-2">Assigned Class *</label>
            <input type="text" name="class" placeholder="10A" value={formData.class} onChange={handleClassChange} onBlur={handleClassBlur} className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl font-black text-xl text-white outline-none focus:ring-4 focus:ring-indigo-500/30" required />
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col justify-center">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-2">Next Roll No *</label>
            <div className="flex gap-3">
              <input type="number" name="roll" value={formData.roll} onChange={handleChange} className="w-full bg-gray-50 p-4 rounded-2xl font-black text-xl text-gray-900 border-none outline-none" required />
              <button type="button" onClick={() => fetchNextRoll(formData.class)} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">
                <RefreshCw size={22}/>
              </button>
            </div>
          </div>

          <div className="md:col-span-2 py-4"><div className="w-full h-px bg-gray-100" /></div>

          <InputField label="Student Name *" name="name" placeholder="Akash Kumar" value={formData.name} onChange={handleChange} required />
          <InputField label="Father's Name *" name="father" placeholder="Father Name" value={formData.father} onChange={handleChange} required />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
             <InputField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
             <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-2">Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black uppercase text-xs outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" required>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
             </div>
          </div>

          <InputField label="Contact Mobile" name="phone" placeholder="91XXXXXXXX" value={formData.phone} onChange={handleChange} />
        </div>

        <textarea
          placeholder="Complete Residential Address *"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full p-6 bg-gray-50 border-none rounded-[2.5rem] font-bold text-gray-900 outline-none h-32 focus:ring-4 focus:ring-indigo-500/10 mb-10 transition-all"
          required
        />

        <button
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-5 md:py-6 rounded-[2rem] md:rounded-[2.5rem] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs shadow-2xl shadow-indigo-200 hover:bg-black transition-all flex justify-center items-center gap-3 md:gap-4 active:scale-95"
        >
          {loading ? "Registering Student..." : <><ShieldCheck size={20} /> Submit & Add Next</>}
        </button>
      </form>
    </div>
  );
};

// Reusable Input Component
const InputField = ({ label, ...props }: any) => (
  <div className="space-y-2">
    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{label}</label>
    <input className="w-full p-4.5 bg-gray-50 border-none rounded-2xl font-black text-gray-900 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" {...props} />
  </div>
);

export default AddStudent;
              
