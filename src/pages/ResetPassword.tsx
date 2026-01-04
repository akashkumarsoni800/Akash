import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Verify / Choose, 2: New Password

  // Verification States (For logged-out users)
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [targetEmail, setTargetEmail] = useState('');

  // Update States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ✅ Check if user is already logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsLoggedIn(true);
        setStep(2); // Agar login hai to seedha password change par bhejo
      }
    };
    checkUser();
  }, []);

  // 1. Verify Identity (For Students who forgot password)
  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: studentList, error } = await supabase
        .from('students')
        .select('email, full_name')
        .ilike('full_name', fullName.trim())
        .ilike('father_name', fatherName.trim()) 
        .eq('contact_number', contactNumber.trim());

      if (error) throw error;

      if (studentList && studentList.length > 0) {
        const student = studentList[0];
        if (student.email) {
          setTargetEmail(student.email);
          
          // ✅ Security: Send reset link to email
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(student.email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });

          if (resetError) throw resetError;

          toast.success(`Identity Verified! Reset link sent to ${student.email} ✅`);
          setStep(3); // Show success message
        } else {
          toast.error("Email not found for this student. Contact Admin.");
        }
      } else {
        toast.error("No student found with these details.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Direct Password Update (For Logged-in Users)
  const handleDirectUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Passwords match nahi ho rahe!");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password successfully updated! ✅");
      navigate(isLoggedIn ? -1 : '/'); // Login hai to piche jayein, warna login par
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-blue-900">
        <h2 className="text-2xl font-bold text-blue-900 mb-2 text-center">
          {isLoggedIn ? "Change Password" : "Reset Password"}
        </h2>
        
        {/* STEP 1: VERIFICATION (Only for logged-out users) */}
        {!isLoggedIn && step === 1 && (
          <form onSubmit={handleVerifyIdentity} className="space-y-4">
            <p className="text-sm text-gray-500 mb-4 text-center">Verify your details to get a reset link</p>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Student Name</label>
              <input type="text" className="w-full p-3 border rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Father's Name</label>
              <input type="text" className="w-full p-3 border rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={fatherName} onChange={e => setFatherName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Mobile Number</label>
              <input type="tel" className="w-full p-3 border rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={contactNumber} onChange={e => setContactNumber(e.target.value)} required />
            </div>
            <button disabled={loading} className="w-full bg-blue-900 text-white py-3 rounded font-bold hover:bg-blue-800 transition">
              {loading ? "Verifying..." : "Verify & Send Link"}
            </button>
          </form>
        )}

        {/* STEP 2: NEW PASSWORD FORM (For logged-in users or via email link) */}
        {step === 2 && (
          <form onSubmit={handleDirectUpdate} className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">Set a new strong password.</p>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">New Password</label>
              <input type="password" placeholder="Min 6 characters" className="w-full p-3 border rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Confirm Password</label>
              <input type="password" placeholder="Repeat password" className="w-full p-3 border rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <button disabled={loading} className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 transition">
              {loading ? "Updating..." : "Update Password Now"}
            </button>
          </form>
        )}

        {/* STEP 3: SUCCESS MESSAGE (After sending link) */}
        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="bg-green-50 p-4 rounded-lg text-green-800 text-sm border border-green-200">
              <b>Success!</b><br/>
              Reset link sent to your registered email <b>{targetEmail}</b>.
            </div>
            <button onClick={() => navigate('/')} className="w-full bg-blue-900 text-white py-3 rounded font-bold">Back to Login</button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-blue-900 transition">Cancel / Back</button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
