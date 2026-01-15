import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const GallerySlider = () => {
  const [gallery, setGallery] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, []);

  // 🔄 AUTO-PLAY: हर 4 सेकंड में इमेज बदलेगी
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

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      let { error: uploadError } = await supabase.storage.from('gallery').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(filePath);
      await supabase.from('gallery_images').insert([{ url: publicUrl }]);
      
      toast.success("Image added to gallery!");
      fetchGallery();
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (id: string) => {
    if (!window.confirm("Delete this photo?")) return;
    try {
      const { error } = await supabase.from('gallery_images').delete().eq('id', id);
      if (error) throw error;
      toast.success("Image removed");
      fetchGallery();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="w-full relative group notranslate mb-8">
      {/* Upload Button overlay */}
      <div className="absolute top-4 right-4 z-20">
        <label className="bg-white/90 backdrop-blur-md text-blue-900 px-4 py-2 rounded-2xl text-[10px] font-black cursor-pointer shadow-xl hover:bg-blue-900 hover:text-white transition-all duration-300">
          {uploading ? "UPLOADING..." : "+ ADD PHOTO"}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {/* The Slider Container */}
      <div className="relative h-56 md:h-72 overflow-hidden rounded-[40px] shadow-2xl shadow-blue-900/10 bg-white border border-gray-100">
        {gallery.length > 0 ? (
          <div 
            className="flex transition-transform duration-1000 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {gallery.map((img: any) => (
              <div key={img.id} className="min-w-full h-full relative group/item">
                <img 
                  src={img.url} 
                  className="w-full h-full object-cover" 
                  alt="School Gallery"
                  onClick={() => window.open(img.url, '_blank')}
                />
                
                {/* Overlay Text */}
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white font-black uppercase tracking-widest text-xs">School Highlights</p>
                </div>
                
                {/* Delete Button */}
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
                  className="absolute top-4 left-4 bg-red-600/90 text-white p-2.5 rounded-xl opacity-0 group-hover/item:opacity-100 transition shadow-lg"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
            <span className="text-4xl">📸</span>
            <p className="font-black uppercase text-[10px] tracking-widest">No Photos in Slideshow</p>
          </div>
        )}

        {/* Line Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {gallery.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-10 bg-white' : 'w-4 bg-white/30'}`} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GallerySlider;
