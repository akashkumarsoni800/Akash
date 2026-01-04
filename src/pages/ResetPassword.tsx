import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 

  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [className, setClassName] = useState('');
  const [targetEmail, setTargetEmail] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ FIX: .maybeSingle() हटा कर साधारण .select() किया ताकि Multiple Rows एरर न आए
      const { data: studentList, error } = await supabase
        .from('students')
        .select('email, full_name')
        .ilike('full_name', fullName.trim())
        .ilike('father_name', fatherName.trim()) 
        .eq('class_name', className);

      if (error) throw error;

      // ✅ चेक करें कि क्या कम से कम एक छात्र मिला
      if (studentList && studentList.length > 0) {
        const student = studentList[0]; // पहले वाले को चुन लें
        
        if (student.email) {
          setTargetEmail(student.email);
          
          // पासवर्ड रिसेट लिंक भेजें
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(student.email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });

          if (resetError) throw resetError;

          toast.success(`Identity Verified! Reset link sent to ${student.email} ✅`);
          setStep(2);
        } else {
          toast.error("Email not found for this student. Contact Admin.");
        }
      } else {
        toast.error("No student found with these exact details.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-blue-900">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Reset Password</h2>
        
        {step === 1 ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">Enter details exactly as in school records.</p>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Student Name</label>
              <input type="text" className="w-full p-3 border rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Father's Name</label>
              <input type="text" className="w-full p-3 border rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={fatherName} onChange={e => setFatherName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Class</label>
              <input type="text" className="w-full p-3 border rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={className} onChange={e => setClassName(e.target.value)} required />
            </div>
            <button disabled={loading} className="w-full bg-blue-900 text-white py-3 rounded font-bold hover:bg-blue-800 transition disabled:opacity-50">
              {loading ? "Verifying..." : "Verify & Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-green-50 p-4 rounded-lg text-green-800 text-sm border border-green-200">
              <b>Success!</b><br/>
              Identity verified. Please check your email <b>{targetEmail}</b> for the reset link.
            </div>
            <button onClick={() => navigate('/')} className="w-full bg-blue-900 text-white py-3 rounded font-bold">Back to Login</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
