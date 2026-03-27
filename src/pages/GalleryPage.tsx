import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  ArrowLeft, Image as ImageIcon, 
  Calendar, Maximize2, X, Download, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GalleryPage = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const schoolName = localStorage.getItem('current_school_name') || 'School Gallery';

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const schoolId = localStorage.getItem('current_school_id');
      const { data, error } = await supabase
        .from('school_gallery')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-6 md:px-12 pb-32">
      <div className="max-w-full mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className="w-12 h-12 bg-white border border-slate-100 rounded-[5px] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-2xl active:scale-95 tracking-widest transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-none uppercase">{schoolName}</h1>
              <p className="text-[10px] font-black text-blue-500 tracking-[0.3em] mt-3 uppercase">Visual Archives • Real-time Sync</p>
            </div>
          </div>
          <div className="bg-white px-6 py-3 rounded-full border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{images.length} Media Assets</p>
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-30">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black tracking-widest uppercase">Deciphering Visual Index...</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {images.map((img, idx) => (
              <motion.div 
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedImage(img)}
                className="relative break-inside-avoid rounded-[5px] overflow-hidden group cursor-pointer shadow-sm hover:shadow-2xl transition-all border border-white"
              >
                <img 
                  src={img.image_url} 
                  alt={img.caption}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">{img.caption}</p>
                      <div className="flex items-center gap-2 mt-2 text-[8px] font-black text-blue-200 uppercase">
                        <Calendar size={10} /> {new Date(img.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-[5px] flex items-center justify-center text-white border border-white/20">
                      <Maximize2 size={16} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {images.length === 0 && !loading && (
          <div className="text-center py-40 space-y-6">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <ImageIcon size={48} />
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No entries found in the institutional archive</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 md:p-12"
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-10 right-10 w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all border border-white/20 z-10"
            >
              <X size={28} />
            </button>

            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative max-w-full w-full aspect-video rounded-[5px] overflow-hidden shadow-3xl shadow-blue-500/20"
            >
              <img src={selectedImage.image_url} className="w-full h-full object-contain bg-slate-900" alt="" />
              <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                  <div className="space-y-3">
                    <span className="px-4 py-1 bg-blue-600 text-white text-[8px] font-black rounded-lg uppercase tracking-[0.2em]">{schoolName}</span>
                    <h2 className="text-3xl md:text-4xl font-black text-white leading-none uppercase">{selectedImage.caption}</h2>
                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Archived on {new Date(selectedImage.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-4">
                    <button className="p-4 bg-white/10 text-white rounded-[5px] hover:bg-white/20 transition-all border border-white/10">
                      <Download size={20} />
                    </button>
                    <button className="p-4 bg-white/10 text-white rounded-[5px] hover:bg-white/20 transition-all border border-white/10">
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryPage;
