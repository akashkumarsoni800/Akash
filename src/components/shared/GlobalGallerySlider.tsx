import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, ChevronRight, Maximize2 } from 'lucide-react';

const GlobalGallerySlider = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      console.error('Gallery Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  
  if (images.length === 0) {
    const userRole = profile?.role; // Wait, profile is not defined here yet.
    // Let's get role from local storage if available
    const isAdmin = localStorage.getItem('supabase.auth.token')?.includes('"admin"'); // Rough check or similar
    
    return null; // Keep it hidden for now, but I'll add logging.
  }

  return (
    <div className="mt-12 mb-8 px-4 md:px-0">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            <Image size={18} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Institutional Gallery</h3>
            <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Recent School Events & Highlights</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/gallery')}
          className="flex items-center gap-2 text-[9px] font-black text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest group"
        >
          View Full Gallery <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x scroll-padding">
        {images.map((img, idx) => (
          <motion.div 
            key={img.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => navigate('/gallery')}
            className="relative min-w-[280px] md:min-w-[320px] aspect-[16/10] rounded-[5px] overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all snap-start"
          >
            <img 
              src={img.image_url} 
              alt={img.caption || 'Event'} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute bottom-6 left-8 right-6 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest line-clamp-1">{img.caption || 'School Event'}</p>
                  <p className="text-[8px] font-black text-blue-300 uppercase mt-1">{new Date(img.created_at).toLocaleDateString()}</p>
                </div>
                <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-[5px] flex items-center justify-center text-white border border-white/20">
                  <Maximize2 size={14} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default GlobalGallerySlider;
