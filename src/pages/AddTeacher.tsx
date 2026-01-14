import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const AddTeacher = () => {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    name: '', subject: '', email: '', phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      // 1. Create Auth User with Default Password
      // "Confirm Email" OFF hone par ye user turant active ho jayega
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: 'Teacher@123', // Ye raha Default Password
        options: {
          data: {
            full_name: formData.name,
            role: 'teacher', // Ye SQL Trigger ko batayega ki role teacher set karo
          },
        },
      });

      if (authError) throw authError;

      // 2. Extra Details Teachers Table mein daalein
      // Note: auth_id ab data.user.id se milega
      if (data.user) {
        const { error: dbError } = await supabase.from('teachers').insert([{
          full_name: formData.name,
          subject: formData.subject,
          email: formData.email,
          phone: formData.phone,
          auth_id: data.user.id 
        }]);
        
        if (dbError) throw dbError;
      }

      toast.success("Teacher Created! Login ID: " + formData.email + " | Pass: Teacher@123");
      navigate('/admin/dashboard');

    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsPending(false);
    }
  };

 return (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 notranslate">
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 w-full max-w-md">
      
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
          Add Teacher
        </h2>
        <p className="text-sm font-bold text-gray-400 mt-1">Register new staff member</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Full Name</label>
          <input 
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
            placeholder="Ex: Rajesh Kumar" 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required 
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Subject / Role</label>
          <input 
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
            placeholder="Ex: Mathematics" 
            onChange={e => setFormData({...formData, subject: e.target.value})} 
            required 
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Email Address</label>
          <input 
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
            placeholder="teacher@school.com" 
            type="email" 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            required 
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Phone Number</label>
          <input 
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
            placeholder="91XXXXXXXX" 
            onChange={e => setFormData({...formData, phone: e.target.value})} 
            required 
          />
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <button 
            disabled={isPending} 
            className="w-full bg-blue-900 hover:bg-black text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition transform active:scale-95 disabled:opacity-50"
          >
            {isPending ? "🚀 Processing..." : "💾 Create Teacher Account"}
          </button>
          
          <button 
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 p-4 rounded-2xl font-black uppercase tracking-widest text-xs transition"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Info Note */}
      <p className="mt-6 text-[10px] text-center font-bold text-gray-400 uppercase tracking-tighter">
        Default Password will be: <span className="text-blue-600">Teacher@123</span>
      </p>
    </div>
  </div>
);

export default AddTeacher;
