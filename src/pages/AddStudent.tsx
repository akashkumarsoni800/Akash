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
              <h1 className="text-5xl md:text-7xl font-black text-slate-900   leading-none uppercase">
                Personnel<br/>
                <span className="text-[var(--accent-admin)]">Onboarding</span>
              </h1>
              <p className="text-slate-400 font-black  text-[10px]  mt-4 flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck size={12} className="text-[var(--accent-admin)]" /> Authorized Institutional Induction Protocol v4.2
              </p>
           </motion.div>

           <div className="bg-white border border-slate-100 rounded-3xl p-4 pr-8 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100 group-hover:rotate-12 transition-transform">
                <Fingerprint size={24} />
             </div>
             <div>
               <p className="text-[9px] font-black text-slate-400   mb-0.5 leading-none">Biometric Status</p>
               <p className="text-xs font-black text-slate-900 ">Registry Link Active</p>
             </div>
           </div>
        </div>

        {/* --- STEP PROGRESSION --- */}
        <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between px-10 relative">
           <StepIndicator step={1} current={step} label="Identity" />
           <div className="flex-1 h-px bg-slate-100 mx-4" />
           <StepIndicator step={2} current={step} label="Registry" />
           <div className="flex-1 h-px bg-slate-100 mx-4" />
           <StepIndicator step={3} current={step} label="Verification" />
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="premium-card p-10 md:p-16 space-y-12"
              >
                <div className="flex items-center gap-6 border-b border-slate-50 pb-8">
                   <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                      <User size={24} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-slate-900   uppercase">Primary Identity</h2>
                      <p className="text-[10px] font-black text-slate-300  tracking-widest leading-none">Legal Candidate Details</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InputField label="Candidate Full Name *" name="name" placeholder="Akash Kumar" value={formData.name} onChange={handleChange} required icon={User} />
                  <InputField label="Authorized Guardian *" name="father" placeholder="Father's Legal Name" value={formData.father} onChange={handleChange} required icon={ShieldCheck} />
                  
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
                    <div className="space-y-1 group">
                      <label className="block text-[9px] font-black text-slate-400   ml-2 group-focus-within:text-blue-500">Gender Selection</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="premium-input appearance-none bg-slate-50  text-[10px] pr-10" required>
                        <option value="">Select Identity</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <InputField label="Contact Uplink" name="phone" placeholder="+91 XXXX-XXXXXX" value={formData.phone} onChange={handleChange} icon={Zap} />
                </div>

                <div className="space-y-1 group">
                  <label className="block text-[9px] font-black text-slate-400   ml-2 group-focus-within:text-blue-500">Residential Coordinates</label>
                  <textarea
                    placeholder="Complete House Address & Zip Code..."
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-black text-slate-900 outline-none h-32 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all text-sm"
                    required
                  />
                </div>

                <div className="pt-8 flex justify-end">
                   <button 
                     type="button" 
                     onClick={() => setStep(2)} 
                     className="premium-button-admin px-12"
                   >
                     Initialize Registry <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="premium-card p-10 md:p-16 space-y-12"
              >
                <div className="flex items-center gap-6 border-b border-slate-50 pb-8">
                   <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                      <Layout size={24} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-slate-900   uppercase">Fleet Assignment</h2>
                      <p className="text-[10px] font-black text-slate-300  tracking-widest leading-none">Academic Node Allocation</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-2xl flex flex-col justify-center relative group">
                    <div className="absolute top-4 right-4 text-white/5 group-hover:scale-110 transition-transform"><Star size={60} /></div>
                    <label className="block text-[10px] font-black text-blue-300   mb-3 ml-2 leading-none">Assigned Cohort *</label>
                    <input type="text" name="class" placeholder="10A" value={formData.class} onChange={handleClassChange} onBlur={handleClassBlur} className="w-full bg-white/10 border border-white/10 p-5 rounded-2xl font-black text-2xl text-white outline-none focus:ring-4 focus:ring-blue-500/30 " required />
                  </div>

                  <div className="bg-blue-50 p-8 rounded-[3rem] border border-blue-100 shadow-sm flex flex-col justify-center group/roll">
                    <label className="block text-[10px] font-black text-blue-400   mb-3 ml-2 leading-none">Sequential Roll Identifier *</label>
                    <div className="flex gap-4">
                      <input type="number" name="roll" value={formData.roll} onChange={handleChange} className="w-full bg-white p-5 rounded-2xl font-black text-2xl text-slate-900 border-none outline-none shadow-inner" required />
                      <button type="button" onClick={() => fetchNextRoll(formData.class)} className="p-5 bg-blue-600 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-lg active:scale-95">
                        <RefreshCw size={24}/>
                      </button>
                    </div>
                  </div>
                </div>

                <InputField label="Institutional Email Node" name="email" type="email" placeholder="student@asm-portal.com" value={formData.email} onChange={handleChange} icon={Mail} />

                <div className="pt-8 flex justify-between">
                   <button 
                     type="button" 
                     onClick={() => setStep(1)} 
                     className="px-10 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black   text-[10px] hover:text-slate-900 active:scale-95 transition-all flex items-center gap-3"
                   >
                     <ChevronLeft size={18} /> Modify Identity
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setStep(3)} 
                     className="premium-button-admin px-12"
                   >
                     Bio-metric Synthesis <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="premium-card p-10 md:p-16 space-y-12"
              >
                <div className="flex items-center gap-6 border-b border-slate-50 pb-8">
                   <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                      <Camera size={24} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-slate-900   uppercase">Visual Registry</h2>
                      <p className="text-[10px] font-black text-slate-300  tracking-widest leading-none">Biometric Capture Terminal</p>
                   </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-56 h-56 bg-slate-50 rounded-[4rem] overflow-hidden flex items-center justify-center border-8 border-white shadow-2xl relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent pointer-events-none" />
                    {photoPreview ? (
                      <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="text-center space-y-4">
                         <User size={80} className="text-slate-200 mx-auto" />
                         <p className="text-[8px] font-black text-slate-300  tracking-widest leading-none">Awaiting Capture</p>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-blue-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]">
                       <Upload className="text-white" size={40} />
                       <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  </div>
                  
                  <div className="mt-12 flex flex-wrap justify-center gap-4">
                     <button type="button" onClick={() => setShowWebcam(true)} className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black   shadow-xl shadow-blue-100 active:scale-95 transition-all group">
                       <Camera size={18} className="group-hover:scale-110 transition-transform"/> Start Live Feed
                     </button>
                     <label className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black   shadow-xl cursor-pointer active:scale-95 transition-all hover:bg-blue-600">
                       <Upload size={18}/> Manual Upload
                       <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                     </label>
                  </div>
                </div>

                <div className="pt-8 flex justify-between">
                   <button 
                     type="button" 
                     onClick={() => setStep(2)} 
                     className="px-10 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black   text-[10px] hover:text-slate-900 active:scale-95 transition-all flex items-center gap-3"
                   >
                     <ChevronLeft size={18} /> Modify Registry
                   </button>
                   <button
                     type="submit"
                     disabled={loading}
                     className="premium-button-admin px-16"
                   >
                     {loading ? (
                        <RefreshCw className="animate-spin" size={20} />
                     ) : (
                        <><ShieldCheck size={24} className="group-hover:rotate-12 transition-transform" /> Authorize Induction</>
                     )}
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* WEBCAM MODAL */}
        <AnimatePresence>
          {showWebcam && WebcamComp && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-slate-950/95 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-xl"
            >
              <div className="relative w-full max-w-sm aspect-square bg-slate-900 rounded-[5rem] overflow-hidden shadow-2xl group border-4 border-white/10">
                 <div className="absolute inset-0 border-8 border-blue-500/20 z-10 pointer-events-none rounded-[5rem]" />
                 <div className="absolute top-1/2 left-0 w-full h-[1px] bg-blue-500/30 blur-[1px] z-10 pointer-events-none animate-pulse" />
                 
                 <WebcamComp 
                   ref={webcamRef} 
                   screenshotFormat="image/jpeg" 
                   videoConstraints={{ facingMode }}
                   className="w-full h-full object-cover"
                 />
                 
                 <button type="button" onClick={toggleCamera} className="absolute top-8 right-8 bg-black/40 backdrop-blur-xl p-5 rounded-full text-white border border-white/10 active:scale-90 transition-all hover:bg-blue-600 z-20">
                    <FlipHorizontal size={24} />
                 </button>

                 <div className="absolute bottom-8 left-0 w-full px-8 z-20">
                    <div className="bg-black/60 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center">
                       <p className="text-[10px] font-black text-blue-400  tracking-widest">Optical Alignment Sensor Active</p>
                    </div>
                 </div>
              </div>
              
              <div className="flex gap-6 mt-12">
                <button type="button" onClick={capturePhoto} className="bg-blue-600 text-white px-12 py-6 rounded-3xl font-black   shadow-2xl shadow-blue-500/20 active:scale-95 transition-all text-[10px]">Register Biometric</button>
                <button type="button" onClick={() => setShowWebcam(false)} className="bg-white/5 text-white border border-white/10 px-10 py-6 rounded-3xl font-black   active:scale-95 transition-all text-[10px] hover:bg-white/10 group">
                   <ChevronLeft size={16} className="inline mr-2 group-hover:-translate-x-1 transition-transform" /> Abort Capture
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const StepIndicator = ({ step, current, label }: { step: number; current: number; label: string }) => (
  <div className={`flex items-center gap-4 transition-all duration-700 ${current >= step ? 'opacity-100' : 'opacity-30'}`}>
     <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[12px] transition-all ${
        current === step ? 'bg-blue-600 text-white shadow-lg' : current > step ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
     }`}>
        {current > step ? <CheckCircle2 size={18} /> : step}
     </div>
     <span className={`text-[10px] font-black  tracking-widest hidden md:block ${current === step ? 'text-slate-900' : 'text-slate-300'}`}>{label}</span>
  </div>
);

const InputField = ({ label, icon: Icon, ...props }: any) => (
  <div className="space-y-1 group">
    <label className="block text-[9px] font-black text-slate-400   ml-2 transition-colors group-focus-within:text-blue-500">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-400 transition-colors" size={18} />}
      <input className="premium-input pl-16" {...props} />
    </div>
  </div>
);

export default AddStudent;
