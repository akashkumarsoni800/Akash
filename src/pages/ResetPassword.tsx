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
  const [contactNumber, setContactNumber] = useState(''); // ✅ Class ki jagah ye add kiya
  const [targetEmail, setTargetEmail] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Query: Name, Father Name aur Contact Number se match karein
      const { data: studentList, error } = await supabase
        .from('students')
        .select('email, full_name, contact_number')
        .ilike('full_name', fullName.trim())
        .ilike('father_name', fatherName.trim()) 
        .eq('contact_number', contactNumber.trim()); // ✅ Contact number match check

      if (error) throw error;

      if (studentList && studentList.length > 0) {
        const student = studentList[0]; 

        if (student.email) {
          setTargetEmail(student.email);

          // Supabase Magic Link/Reset Password Link bhejna
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(student.email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });

          if (resetError) throw resetError;

          toast.success(`पहचान मिल गई! ईमेल ${student.email} पर लिंक भेज दिया गया है ✅`);
          setStep(2);
        } else {
          toast.error("डेटाबेस में आपका ईमेल नहीं मिला। कृपया एडमिन से संपर्क करें।");
        }
      } else {
        toast.error("दी गई जानकारी से कोई छात्र नहीं मिला। कृपया स्पेलिंग और नंबर चेक करें।");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("त्रुटि: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-blue-900">
        <h2 className="text-2xl font-bold text-blue-900 mb-2 text-center">Reset Password</h2>

        {step === 1 ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-500 mb-4 text-center">अपनी जानकारी भरें (स्कूल रिकॉर्ड के अनुसार)</p>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Student Name</label>
              <input type="text" className="w-full p-3 border rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500" placeholder="पूरा नाम" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Father's Name</label>
              <input type="text" className="w-full p-3 border rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500" placeholder="पिता का नाम" value={fatherName} onChange={e => setFatherName(e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Contact Number</label>
              <input type="tel" className="w-full p-3 border rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500" placeholder="मोबाइल नंबर" value={contactNumber} onChange={e => setContactNumber(e.target.value)} required />
            </div>

            <button disabled={loading} className="w-full bg-blue-900 text-white py-3 rounded font-bold hover:bg-blue-800 transition disabled:opacity-50 shadow-md">
              {loading ? "Verifying..." : "Verify & Send Link"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-green-50 p-6 rounded-lg text-green-800 text-sm border border-green-200">
              <div className="text-3xl mb-2">📩</div>
              <b>सफलता!</b><br/>
              आपकी पहचान सत्यापित हो गई है। कृपया अपना ईमेल <b>{targetEmail}</b> चेक करें और पासवर्ड रिसेट लिंक पर क्लिक करें।
            </div>
            <button onClick={() => navigate('/')} className="w-full bg-blue-900 text-white py-3 rounded font-bold shadow-md">
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
