import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "sonner";
import { User, Camera, Upload, ShieldCheck, RefreshCw } from "lucide-react";

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

  // Form State - Class और Roll को मैनेज करने के लिए
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

  // ================= 1. AUTO ROLL NUMBER FETCH LOGIC =================
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
        // सबसे बड़े रोल नंबर में 1 जोड़ें
        nextRoll = (parseInt(data[0].roll_no) + 1).toString();
      }
      setFormData(prev => ({ ...prev, roll: nextRoll }));
      toast.info(`Next Roll for Class ${className} is ${nextRoll}`);
    } catch (err) {
      console.error("Roll error:", err);
    }
  };

  // ================= 2. HANDLE CLASS CHANGE =================
  const handleClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, class: val }));
  };

  // जब क्लास इनपुट से फोकस हटे (Blur), तब ऑटो रोल फेच करें
  const handleClassBlur = () => {
    if (formData.class) fetchNextRoll(formData.class);
  };

  const toTitleCase = (str: string) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class || !formData.roll) {
      toast.error("Class and Roll are required!");
      return;
    }
    setLoading(true);

    try {
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

      toast.success(`${formData.name} added successfully!`);

      // ================= 3. RESET BUT KEEP CLASS =================
      setFormData(prev => ({
        ...prev,
        name: "",
        roll: (parseInt(prev.roll) + 1).toString(), // ऑटो अगला रोल नंबर
        father: "",
        email: "",
        phone: "",
        dob: "",
        gender: "",
        // address: prev.address, // एड्रेस भी चाहे तो बचा सकते हैं
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
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4 md:p-10 font-sans">
      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-4xl border border-gray-100">
        
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-4xl font-black text-gray-900 uppercase italic">Bulk Admission</h2>
           <div className="bg-indigo-50 px-4 py-2 rounded-2xl text-indigo-600 text-[10px] font-black uppercase">ASM v3.0</div>
        </div>

        {/* PHOTO UPLOAD */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-40 h-40 bg-gray-50 rounded-[3rem] overflow-hidden flex items-center justify-center border-4 border-white shadow-xl relative group border-dashed border-gray-200">
            {photoPreview ? (
              <img src={photoPreview} className="w-full h-full object-cover" />
            ) : (
              <User size={60} className="text-gray-200" />
            )}
            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
               <Camera className="text-white" size={30} />
               <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>
          <div className="mt-4 flex gap-3">
             <button type="button" onClick={() => setShowWebcam(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg">Live Camera</button>
             {photoPreview && <button type="button" onClick={() => {setPhotoFile(null); setPhotoPreview(null);}} className="bg-red-50 text-red-500 px-6 py-2 rounded-xl text-xs font-bold">Remove</button>}
          </div>
        </div>

        {showWebcam && WebcamComp && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6">
            <WebcamComp ref={webcamRef} screenshotFormat="image/jpeg" className="rounded-3xl border-4 border-white shadow-2xl max-w-sm w-full" />
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={capturePhoto} className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">Capture</button>
              <button type="button" onClick={() => setShowWebcam(false)} className="bg-red-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        )}

        {/* FORM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* ✅ Sticky Class Name */}
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
            <label className="block text-[10px] font-black text-orange-400 uppercase ml-2 mb-1">Target Class *</label>
            <input 
              type="text" 
              name="class" 
              placeholder="e.g. 10" 
              value={formData.class} 
              onChange={handleClassChange} 
              onBlur={handleClassBlur}
              className="w-full bg-white p-3 rounded-xl font-black text-orange-900 border-none outline-none focus:ring-2 focus:ring-orange-200" 
              required 
            />
          </div>

          {/* ✅ Auto Roll Number */}
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
            <label className="block text-[10px] font-black text-indigo-400 uppercase ml-2 mb-1">Assigned Roll No *</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                name="roll" 
                value={formData.roll} 
                onChange={handleChange} 
                className="w-full bg-white p-3 rounded-xl font-black text-indigo-900 border-none outline-none" 
                required 
              />
              <button type="button" onClick={() => fetchNextRoll(formData.class)} className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm hover:bg-indigo-600 hover:text-white transition-all">
                <RefreshCw size={18}/>
              </button>
            </div>
          </div>

          <div className="md:col-span-2 border-b border-gray-100 my-2"></div>

          <InputField label="Student Name *" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
          <InputField label="Father's Name *" name="father" placeholder="Father's Name" value={formData.father} onChange={handleChange} required />
          
          <div className="grid grid-cols-2 gap-4">
             <InputField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
             <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-2 mb-1">Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold outline-none" required>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
             </div>
          </div>

          <InputField label="Mobile Number" name="phone" placeholder="10 Digit Number" value={formData.phone} onChange={handleChange} />
        </div>

        <textarea
          placeholder="Residential Address *"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full p-5 bg-gray-50 border-none rounded-[2rem] font-bold outline-none h-28 focus:ring-2 focus:ring-indigo-100 mb-8"
        />

        <button
          disabled={loading}
          className="w-full bg-gray-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex justify-center items-center gap-4"
        >
          {loading ? "Processing..." : <><ShieldCheck size={24} /> Complete & Add Next Student</>}
        </button>
      </form>
    </div>
  );
};

// Reusable Input
const InputField = ({ label, ...props }: any) => (
  <div>
    <label className="block text-[10px] font-black text-gray-400 uppercase ml-2 mb-1">{label}</label>
    <input className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 transition-all" {...props} />
  </div>
);

export default AddStudent;
