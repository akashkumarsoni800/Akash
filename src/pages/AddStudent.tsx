import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "sonner";
import { User, Camera, Upload, ShieldCheck } from "lucide-react";
import imageCompression from "browser-image-compression";

// react-webcam ko dynamic import karte hain
let Webcam: any;
if (typeof window !== "undefined") {
  Webcam = require("react-webcam").default;
}

const AddStudent = () => {
  const navigate = useNavigate();
  const webcamRef = useRef<any>(null);

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

  // ================= PHOTO FROM FILE =================
  const handlePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // 25MB limit
      if (file.size > 25 * 1024 * 1024) {
        toast.error("Photo must be under 25MB");
        return;
      }

      await compressAndSetImage(file);
    }
  };

  // ================= COMPRESS IMAGE =================
  const compressAndSetImage = async (file: File) => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1000,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      setPhotoFile(compressedFile);
      setPhotoPreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      toast.error("Image compression failed");
    }
  };

  // ================= CAPTURE FROM WEBCAM =================
  const capturePhoto = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const blob = await fetch(imageSrc).then((res) => res.blob());
    const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });

    await compressAndSetImage(file);
    setShowWebcam(false);
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

        const { data } = supabase.storage
          .from("student-photos")
          .getPublicUrl(fileName);

        photoUrl = data.publicUrl;
      }

      const { error } = await supabase.from("students").insert([
        {
          full_name: formData.name,
          class_name: formData.class,
          roll_no: formData.roll,
          father_name: formData.father,
          date_of_birth: formData.dob,
          gender: formData.gender,
          address: formData.address,
          photo_url: photoUrl,
        },
      ]);

      if (error) throw error;

      toast.success("Student Added Successfully");
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
        <h2 className="text-3xl font-bold text-center mb-8">
          New Admission
        </h2>

        {/* ================= PHOTO SECTION ================= */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-40 h-40 bg-gray-100 rounded-3xl overflow-hidden flex items-center justify-center border">
            {photoPreview ? (
              <img
                src={photoPreview}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={60} className="text-gray-300" />
            )}
          </div>

          <div className="flex gap-4 mt-6">
            {/* Webcam Button only if browser */}
            {Webcam && (
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
        {showWebcam && Webcam && (
          <div className="flex flex-col items-center mb-6">
            <Webcam
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

        {/* ================= BASIC INPUT ================= */}
        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-3 bg-gray-100 rounded-xl mb-4"
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
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
