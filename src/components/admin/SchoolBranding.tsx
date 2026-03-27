import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { 
  Upload, Camera, Image as ImageIcon, 
  Settings, Save, RefreshCw, X 
} from 'lucide-react';
import { motion } from 'framer-motion';

const SchoolBranding = () => {
  const [logo, setLogo] = useState<string | null>(localStorage.getItem('current_school_logo'));
  const [uploading, setUploading] = useState(false);
  const [schoolName, setSchoolName] = useState(localStorage.getItem('current_school_name') || '');
  const schoolId = localStorage.getItem('current_school_id');

  const handleLogoUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileName = `${schoolId}_logo_${Date.now()}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      const newLogoUrl = urlData.publicUrl;

      // Update Database
      const { error: dbError } = await supabase
        .from('schools')
        .update({ logo_url: newLogoUrl })
        .eq('id', schoolId);

      if (dbError) throw dbError;

      // Update LocalStorage for immediate UI sync
      localStorage.setItem('current_school_logo', newLogoUrl);
      setLogo(newLogoUrl);
      
      toast.success("Institutional identity updated successfully!");
      // Trigger a page reload or event to sync other components
      window.dispatchEvent(new Event('storage')); 
    } catch (err: any) {
      toast.error("Update Failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-full mx-auto space-y-12 animate__animated animate__fadeIn">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-blue-600 rounded-[5px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-200 rotate-12">
          <Settings size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 uppercase">Institutional Branding</h2>
        <p className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase">Configure your school's visual identity</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center bg-white p-12 rounded-[5px] border border-slate-100 shadow-2xl active:scale-95 tracking-widest">
        {/* Current Identity */}
        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Logo</label>
            <div className="w-56 h-56 rounded-[5px] bg-slate-50 border-4 border-white shadow-inner flex items-center justify-center overflow-hidden relative group">
              {logo ? (
                <img 
                  src={`${logo}${logo.includes('?') ? '&' : '?'}v=${Date.now()}`} 
                  className="w-full h-full object-contain p-8 transition-transform group-hover:scale-110" 
                  alt="logo" 
                />
              ) : (
                <ImageIcon size={48} className="text-slate-200" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center">
                  <RefreshCw className="animate-spin text-blue-600" size={32} />
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 rounded-[5px] bg-blue-50/50 border border-blue-100 space-y-2">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Current Institution</p>
            <p className="text-xl font-black text-slate-800">{schoolName}</p>
          </div>
        </div>

        {/* Upload Action */}
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-xl font-black text-slate-800">Change Identity</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Upload your official institution logo. Transparent PNG profiles (1024x1024) are recommended for superior aesthetics.</p>
          </div>

          <div className="relative group">
            <input 
              type="file" 
              onChange={handleLogoUpload}
              disabled={uploading}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              accept="image/*"
            />
            <div className="p-10 border-4 border-dashed border-slate-100 rounded-[5px] text-center group-hover:border-blue-300 transition-all bg-slate-50/30 group-hover:bg-blue-50/20">
              <Upload className="mx-auto text-blue-600 mb-4 animate-bounce" size={32} />
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Upload New Logo</p>
              <p className="text-[9px] font-bold text-slate-400 mt-2">Max Size: 2MB • Format: PNG, JPG</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 p-4 rounded-[5px] bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border border-slate-100">
              Auto-Sync Enabled
            </div>
            <div className="flex-1 p-4 rounded-[5px] bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border border-slate-100">
              Cloud Storage V2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolBranding;
