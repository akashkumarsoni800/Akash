import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ location ट्रैक करने के लिए
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const GallerySlider = () => {
  const location = useLocation();
  const [gallery, setGallery] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  // चेक करें कि क्या यूजर एडमिन डैशबोर्ड पेज पर है
  const isAdminDashboard = location.pathname === '/admin/dashboard';

  useEffect(() => {
    fetchGallery();
  }, []);

  useEffect(() => {
    if (gallery.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % gallery.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [gallery]);

  const fetchGallery = async () => {
    const { data } = await supabase.from('gallery_images').select('*').order('created_at', { ascending: false });
    setGallery(data || []);
  };

  const handleUpload = async (e: any) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;
      const filePath = `gallery/${Math.random()}-${file.name}`;
      await supabase.storage.from('gallery').upload(filePath, file);
      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(filePath);
      await supabase.from('gallery_images').insert([{ url: publicUrl }]);
      toast.success("Photo Added!");
      fetchGallery();
    } catch (err: any) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (id: string) => {
    if (!window.confirm("Delete photo?")) return;
    await supabase.from('gallery_images').delete().eq('id', id);
    toast.success("Removed");
    fetchGallery();
  };

  return (
    <div className="w-full relative group notranslate mb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* 🟢 ADD BUTTON: सिर्फ एडमिन डैशबोर्ड पर दिखेगा */}
      {isAdminDashboard && (
        <div className="absolute top-4 right-12 z-20">
          <label className="bg-white/90 backdrop-blur-md text-blue-900 px-4 py-2 rounded-2xl text-[10px] font-black cursor-pointer shadow-xl hover:bg-blue-900 hover:text-white transition-all">
            {uploading ? "..." : "+ ADD PHOTO"}
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      )}

      <div className="relative h-48 md:h-64 overflow-hidden rounded-[40px] shadow-2xl bg-white border border-gray-100">
        {gallery.map((img, i) => (
          <div 
            key={img.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={img.url} className="w-full h-full object-cover" alt="School" />
            
            {/* 🔴 DELETE BUTTON: सिर्फ एडमिन डैशबोर्ड पर दिखेगा */}
            {isAdminDashboard && (
              <button 
                onClick={() => deleteImage(img.id)}
                className="absolute top-4 left-4 bg-red-600 text-white p-2 rounded-xl shadow-lg"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GallerySlider;
