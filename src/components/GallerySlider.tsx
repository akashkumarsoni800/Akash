import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const GallerySlider = () => {
  const location = useLocation();
  const [gallery, setGallery] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  const isAdminDashboard = location.pathname === '/admin/dashboard';

  useEffect(() => {
    fetchGallery();
  }, []);

  useEffect(() => {
    if (gallery.length > 1) { // 0 या 1 इमेज पर टाइमर नहीं चलना चाहिए
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % gallery.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [gallery]);

  const fetchGallery = async () => {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Fetch Error:", error);
    } else {
      setGallery(data || []);
    }
  };

  const handleUpload = async (e: any) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      // ✅ Double gallery पाथ हटाने के लिए 'gallery/' हटा दिया
      const filePath = `${Math.random()}-${file.name}`; 

      // Storage में अपलोड
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // पब्लिक URL प्राप्त करें
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      // DB में सेव करें
      const { error: dbError } = await supabase
        .from('gallery_images')
        .insert([{ url: publicUrl }]);

      if (dbError) throw dbError;

      toast.success("Photo Added!");
      fetchGallery();
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (id: string) => {
    if (!window.confirm("Delete photo?")) return;
    try {
      const { error } = await supabase.from('gallery_images').delete().eq('id', id);
      if (error) throw error;
      toast.success("Removed");
      fetchGallery();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
  <div className="w-full relative group notranslate mb-8 px-4 max-w-7xl mx-auto">
    
    {/* ... (Add Photo Button Code) ... */}

    <div className="relative h-48 md:h-80 overflow-hidden rounded-[40px] shadow-2xl bg-white border border-gray-100">
      {gallery.map((img, i) => (
        <div 
          key={img.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img src={img.url} className="w-full h-full object-cover" alt="School" />
        </div>
      ))}

      {/* ✅ MANUAL CONTROLS: Left & Right Buttons */}
      {gallery.length > 0 && (
        <>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev - 1 + gallery.length) % gallery.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/30 backdrop-blur-md p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/50"
          >
            ❮
          </button>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev + 1) % gallery.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/30 backdrop-blur-md p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/50"
          >
            ❯
          </button>
        </>
      )}

      {/* ✅ INDICATORS: Dots at bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {gallery.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  </div>
);
export default GallerySlider;
