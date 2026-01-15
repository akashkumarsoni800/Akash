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
      {isAdminDashboard && (
        <div className="absolute top-4 right-12 z-20">
          <label className="bg-white/90 backdrop-blur-md text-blue-900 px-4 py-2 rounded-2xl text-[10px] font-black cursor-pointer shadow-xl hover:bg-blue-900 hover:text-white transition-all">
            {uploading ? "UPLOADING..." : "+ ADD PHOTO"}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      )}

      <div className="relative h-48 md:h-64 overflow-hidden rounded-[40px] shadow-2xl bg-white border border-gray-100">
        {gallery.length > 0 ? (
          gallery.map((img, i) => (
            <div 
              key={img.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${i === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <img 
                src={img.url} 
                className="w-full h-full object-cover" 
                alt="School" 
                loading="eager" // ✅ रेंडरिंग सुधारने के लिए
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/800x400?text=Error+Loading+Image";
                }}
              />
              
              {isAdminDashboard && (
                <button 
                  onClick={() => deleteImage(img.id)}
                  className="absolute top-4 left-4 bg-red-600 text-white p-2 rounded-xl shadow-lg z-30"
                >
                  🗑️
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-xs">
            No Photos in Gallery
          </div>
        )}
      </div>
    </div>
  );
};

export default GallerySlider;
