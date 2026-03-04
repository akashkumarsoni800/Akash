import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "sonner";
import { User, Camera, Upload, ShieldCheck } from "lucide-react";

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

  // ================= DYNAMIC IMPORT WEBCAM =================
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-webcam").then((mod) => setWebcamComp(() => mod.default));
    }
  }, []);

  // ================= TO TITLE CASE =================
  const toTitleCase = (str: string) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    let value = e.target.value;
    if (["name", "father", "class", "address"].includes(e.target.name)) {
      value = toTitleCase(value);
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  // ================= COMPRESS IMAGE =================
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
      toast.error("Image compression failed");
    }
  };

  // ================= FILE UPLOAD =================
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 25 * 1024 * 1024) {
        toast.error("Photo must be under 25MB");
        return;
      }
      await compressAndSetImage(file);
    }
  };

  // ================= CAPTURE FROM WEBCAM =================
  const capturePhoto = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const blob = await fetch(imageSrc).then((res) => res.blob());
    const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });

    if (file.size > 25 * 1024 * 1024) {
      toast.error("Captured photo exceeds 25MB");
      return;
    }

    await compressAndSetImage(file);
    setShowWebcam(false);
  };

  // ================= GENERATE REGISTRATION NO =================
  const generateRegNo = (className: string, roll: string) => {
    const year = new Date().getFullYear();
    const cleanClass = className.replace(/\s+/g, "").toUpperCase();
    const cleanRoll = roll.padStart(3, "0");
    return `REG/${year}/${cleanClass}/${cleanRoll}`;
  };

  // ================= FORM SUBMIT =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = "";
      if (photoFile) {
        const fileName = `${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("student-photos")
          .upload(fileName, photoFile);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("student-photos").getPublicUrl(fileName);
        photoUrl = data.publicUrl;
      }

      const regNo = generateRegNo(formData.class, formData.roll);

      const { error } = await supabase.from("students").insert([
        {
          full_name: formData.name,
          class_name: formData.class,
          roll_no: formData.roll,
          registration_no: regNo,
          father_name: formData.father,
          date_of_birth: formData.dob,
          gender: formData.gender,
          address: formData.address,
          contact_number: formData.phone || null,
          email: formData.email || null,
          photo_url: photoUrl,
          is_approved: "approved",
        },
      ]);

      if (error) throw error;

      toast.success(`Student Added! Reg No: ${regNo}`);
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-4xl"
      >
        <h2 className="text-3xl font-bold text-center mb-8">New Admission</h2>

        {/* ================= PHOTO UPLOAD ================= */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-40 h-40 bg-gray-100 rounded-3xl overflow-hidden flex items-center justify-center border">
            {photoPreview ? (
              <img src={photoPreview} className="w-full h-full object-cover" />
            ) : (
              <User size={60} className="text-gray-300" />
            )}
          </div>

          <div className="flex gap-4 mt-6">
            {WebcamComp && (
              <button
                type="button"
                onClick={() => setShowWebcam(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <Camera size={18} />
                Use Laptop Camera
              </button>
            )}

            <label className="bg-gray-800 text-white px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2">
              <Upload size={18} />
              Upload Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          </div>
        </div>

        {/* ================= WEBCAM MODAL ================= */}
        {showWebcam && WebcamComp && (
          <div className="flex flex-col items-center mb-6">
            <WebcamComp
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="rounded-xl"
            />
            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={capturePhoto}
                className="bg-green-600 text-white px-4 py-2 rounded-xl"
              >
                Capture
              </button>
              <button
                type="button"
                onClick={() => setShowWebcam(false)}
                className="bg-red-500 text-white px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ================= FORM FIELDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            placeholder="Full Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 bg-gray-100 rounded-xl"
            required
          />
          <input
            type="text"
            placeholder="Class/Section *"
            name="class"
            value={formData.class}
            onChange={handleChange}
            className="w-full p-3 bg-gray-100 rounded-xl"
            required
          />
          <input
            type="text"
            placeholder="Roll Number *"
            name="roll"
            value={formData.roll}
            onChange={handleChange}
            className="w-full p-3 bg-gray-100 rounded-xl"
            required
          />
          <input
            type="text"
            placeholder="Father's Name *"
            name="father"
            value={formData.father}
            onChange={handleChange}
            className="w-full p-3 bg-gray-100 rounded-xl"
            required
          />
          <input
            type="date"
            placeholder="DOB *"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            className="w-full p-3 bg-gray-100 rounded-xl"
            required
          />
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full p-3 bg-gray-100 rounded-xl"
            required
          >
            <option value="">Select Gender *</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <input
            type="email"
            placeholder="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 bg-gray-100 rounded-xl"
          />
          <input
            type="tel"
            placeholder="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-3 bg-gray-100 rounded-xl"
          />
        </div>

        <textarea
          placeholder="Address *"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full p-3 bg-gray-100 rounded-xl mb-6"
          required
        />

        <button
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl flex justify-center gap-2"
        >
          {loading ? "Saving..." : <>Complete Admission <ShieldCheck size={18} /></>}
        </button>
      </form>
    </div>
  );
};

export default AddStudent;
