import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { ShieldCheck, User, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const CreateAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: ''
  });

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🛑 Validation: Password should be strong
      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      // ✅ Calling the Supabase Edge Function
      // Note: Make sure you have deployed the 'create-user' function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          ...formData,
          role: 'admin' // 🔐 Security: We enforce 'admin' role here
        }
      });

      // Handle Network or Function Errors
      if (error) throw new Error(error.message || "Failed to connect to server.");
      
      // Handle Logical Errors from the function (e.g., Email already exists)
      if (data && data.error) {
        throw new Error(data.error);
      }

      // 🎉 Success
      toast.success(`New Admin Created: ${formData.full_name}`);
      toast.info("They can now login with these credentials.");
      
      // Reset Form
      setFormData({ full_name: '', email: '', password: '' });

    } catch (err: any) {
      console.error("Admin Creation Failed:", err);
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8">
      
      {/* 🟢 Header Card */}
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-[2rem] p-8 text-white shadow-2xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-wider">Create Admin</h2>
            <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mt-1">
              Grant Full System Access
            </p>
          </div>
        </div>
      </div>

      {/* 🟢 Form Card */}
      <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-purple-50">
        
        <form onSubmit={handleCreateAdmin} className="space-y-6">
          
          {/* Warning Note */}
          <div className="bg-yellow-50 p-4 rounded-2xl flex gap-3 items-start border border-yellow-100">
            <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs font-bold text-yellow-700 leading-relaxed">
              Warning: You are creating a Super Admin. This user will have full access to manage students, teachers, results, and fees.
            </p>
          </div>

          {/* Full Name */}
          <div className="group space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Admin Name</label>
            <div className="flex items-center bg-gray-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-purple-500 transition-all duration-300">
              <User size={20} className="text-gray-400 mr-3 group-focus-within:text-purple-500 transition-colors" />
              <input 
                type="text" required 
                placeholder="e.g. Dinesh Prasad"
                className="bg-transparent w-full font-bold text-gray-700 outline-none placeholder:font-normal"
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
          </div>

          {/* Email */}
          <div className="group space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Login Email</label>
            <div className="flex items-center bg-gray-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-purple-500 transition-all duration-300">
              <Mail size={20} className="text-gray-400 mr-3 group-focus-within:text-purple-500 transition-colors" />
              <input 
                type="email" required 
                placeholder="admin@school.com"
                className="bg-transparent w-full font-bold text-gray-700 outline-none placeholder:font-normal"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          {/* Password */}
          <div className="group space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Set Password</label>
            <div className="flex items-center bg-gray-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-purple-500 transition-all duration-300">
              <Lock size={20} className="text-gray-400 mr-3 group-focus-within:text-purple-500 transition-colors" />
              <input 
                type="text" required 
                placeholder="Create a strong password"
                className="bg-transparent w-full font-bold text-gray-700 outline-none placeholder:font-normal"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-purple-900 text-white font-black rounded-2xl hover:bg-black transition-all duration-300 shadow-lg shadow-purple-200 active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Creating Access...
              </>
            ) : (
              <>
                <ShieldCheck size={20} />
                Create Admin Account
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default CreateAdmin;
