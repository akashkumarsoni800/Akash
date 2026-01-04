import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Verify, 2: New Password

  // Form States
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [className, setClassName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [targetEmail, setTargetEmail] = useState(''); // Match hone par email yahan rakhenge

  // 1. Identity Verify Karein
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Database me bacha dhoondo
      const { data, error } = await supabase
        .from('students')
        .select('email, full_name')
        .ilike('full_name', fullName.trim())
        .ilike('parent_name', fatherName.trim()) // Aapke DB me 'parent_name' column hai
        .eq('class_name', className)
        .maybeSingle();

      if (error) throw error;

      if (data && data.email) {
        setTargetEmail(data.email);
        toast.success(`Identity Verified for ${data.full_name}! ✅`);
        setStep(2);
      } else {
        toast.error("No student found with these details. Please check spelling.");
      }
    } catch (err: any) {
      toast.error("Verification failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Password Update Karein
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Note: Supabase me password update karne ke liye user ka login hona zaroori hai.
    // Hum user ko ek message dikhayenge ki wo Admin se link le ya fir
    // Humne pehle login logic me email/password rakha hai.
    
    // Yadi bacha verified hai, to hum use Reset Link bhej sakte hain (Free)
    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${window.location.origin}/update-pass-final`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verification Successful! A reset link sent to your registered email.");
      toast.info("Security ke liye aapko email link par click karna hoga.");
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-blue-900">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Reset Password</h2>
        <p className="text-sm text-gray-500 mb-6 font-medium">Verify your details to continue</p>

        {step === 1 ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Student Full Name</label>
              <input 
                type="text" className="w-full p-3 border rounded mt-1" 
                placeholder="Ex: Akash Kumar" value={fullName} onChange={e => setFullName(e.target.value)} required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Father's Name</label>
              <input 
                type="text" className="w-full p-3 border rounded mt-1" 
                placeholder="Ex: Rajesh Kumar" value={fatherName} onChange={e => setFatherName(e.target.value)} required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Class</label>
              <input 
                type="text" className="w-full p-3 border rounded mt-1" 
                placeholder="Ex: 10th" value={className} onChange={e => setClassName(e.target.value)} required 
              />
            </div>
            <button disabled={loading} className="w-full bg-blue-900 text-white py-3 rounded font-bold hover:bg-blue-800 transition">
              {loading ? "Verifying..." : "Verify My Identity"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-green-50 p-4 rounded-lg text-green-800 text-sm border border-green-200">
              <b>Identity Verified!</b><br/>
              Security ke liye humne aapki email <b>{targetEmail}</b> par ek link bheja hai.
            </div>
            <p className="text-xs text-gray-500">Uspar click karke aap naya password set kar sakte hain.</p>
            <button onClick={() => navigate('/')} className="w-full bg-blue-900 text-white py-3 rounded font-bold">
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
