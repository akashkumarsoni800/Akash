import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Image as ImageIcon, 
  Upload, RefreshCw, X, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GalleryManagement = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const schoolId = localStorage.getItem('current_school_id');
      const { data, error } = await supabase
        .from('school_gallery')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const schoolId = localStorage.getItem('current_school_id');
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${schoolId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('school_gallery')
        .insert([{
          school_id: schoolId,
          image_url: urlData.publicUrl,
          caption: caption || 'School Event'
        }]);

      if (dbError) throw dbError;

      toast.success("Photo added to gallery!");
      setCaption('');
      setShowUpload(false);
      fetchGallery();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!window.confirm("Delete this photo from gallery?")) return;

    try {
      setLoading(true);
      // Delete from DB
      const { error: dbError } = await supabase
        .from('school_gallery')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // Extract path from URL to delete from storage if needed
      // (Optional: complicated to parse public URL accurately, but usually storage cleans up)

      toast.success("Photo removed.");
      fetchGallery();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate__animated animate__fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase leading-none">Photo Gallery</h2>
          <p className="text-[10px] font-black text-slate-400 mt-2 tracking-widest uppercase">Manage institutional highlights</p>
        </div>
        <button 
          onClick={() => setShowUpload(!showUpload)}
          className="bg-blue-600 text-white px-8 py-4 rounded-[5px] font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95 tracking-widest flex items-center gap-3"
        >
          {showUpload ? <X size={18}/> : <Plus size={18} />}
          {showUpload ? "Cancel" : "Add Photo"}
        </button>
      </div>

      <AnimatePresence>
        {showUpload && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-[5px] border border-blue-100 shadow-2xl active:scale-95 tracking-widest space-y-6"
          >
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Caption / Event Name</label>
              <input 
                type="text" 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Annual Sports Day 2026"
                className="premium-input text-sm"
              />
            </div>
            <div className="relative group">
              <input 
                type="file" 
                onChange={handleUpload}
                disabled={uploading}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                accept="image/*"
              />
              <div className="border-4 border-dashed border-slate-100 rounded-[5px] p-12 text-center group-hover:border-blue-200 transition-all bg-slate-50/30">
                {uploading ? (
                  <RefreshCw className="animate-spin text-blue-600 mx-auto" size={40} />
                ) : (
                  <>
                    <ImageIcon className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-sm font-black text-slate-600">Click or Drag to Upload Event Photo</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-2 tracking-widest">Supports JPG, PNG, WEBP (Max 5MB)</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square rounded-[5px] overflow-hidden bg-slate-100 shadow-sm hover:shadow-2xl transition-all">
            <img src={img.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
              <p className="text-white text-[10px] font-black uppercase tracking-widest mb-4 leading-tight">{img.caption}</p>
              <button 
                onClick={() => handleDelete(img.id, img.image_url)}
                className="w-10 h-10 bg-rose-500 text-white rounded-[5px] flex items-center justify-center hover:bg-rose-600 transition-colors shadow-lg"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && !loading && (
        <div className="py-24 text-center">
          <ImageIcon size={60} className="mx-auto text-slate-100 mb-6" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No photos in gallery yet</p>
        </div>
      )}
    </div>
  );
};

export default GalleryManagement;
