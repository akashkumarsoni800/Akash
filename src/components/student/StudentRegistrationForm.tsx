import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // ✅ पाथ चेक कर लें
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';

export default function StudentRegistrationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    guardianName: '',
    contactNumber: '',
    classAssignment: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Supabase Auth में यूजर रजिस्टर करें
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Students टेबल में डेटा डालें (Status: pending)
      const { error: dbError } = await supabase
        .from('students')
        .insert([{
          full_name: formData.fullName,
          parent_name: formData.guardianName,
          contact_number: formData.contactNumber,
          class_name: formData.classAssignment,
          email: formData.email,
          is_approved: 'pending' // ✅ अब ये टेक्स्ट फॉर्मेट में जाएगा
        }]);

      if (dbError) throw dbError;

      toast.success('Registration submitted! Please wait for admin approval.');
      navigate('/'); // वापस लॉगिन पेज पर भेजें

    } catch (error: any) {
      console.error('Error:', error.message);
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-20">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-blue-900">Student Registration</CardTitle>
          <CardDescription>ASM - Admission Form</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input placeholder="Student Name" onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Guardian Name *</Label>
                <Input placeholder="Father/Mother Name" onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input type="email" placeholder="email@example.com" onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Create Password *</Label>
                <Input type="password" placeholder="Min. 6 chars" onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Contact Number *</Label>
                <Input placeholder="10 digit number" onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Class *</Label>
                <Input placeholder="e.g., 10th A" onChange={(e) => setFormData({ ...formData, classAssignment: e.target.value })} required />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-blue-900 hover:bg-blue-800">
              {loading ? 'Processing...' : 'Submit Registration'}
            </Button>
            
            <button type="button" onClick={() => navigate('/')} className="w-full text-sm text-gray-500 hover:underline">
              Already have an account? Login
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
