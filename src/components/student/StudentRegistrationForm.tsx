import { useState } from 'react';
import { useRegisterStudent } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';

export default function StudentRegistrationForm() {
  const registerStudent = useRegisterStudent();
  const [formData, setFormData] = useState({
    fullName: '',
    guardianName: '',
    contactNumber: '',
    classAssignment: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.guardianName || !formData.contactNumber || !formData.classAssignment) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await registerStudent.mutateAsync(formData);
      toast.success('Registration submitted successfully! Awaiting admin approval.');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to submit registration');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Registration</CardTitle>
        <CardDescription>Complete your registration to access the student portal</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianName">Guardian Name *</Label>
              <Input
                id="guardianName"
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                placeholder="Enter guardian's name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number *</Label>
              <Input
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="Enter contact number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classAssignment">Class *</Label>
              <Input
                id="classAssignment"
                value={formData.classAssignment}
                onChange={(e) => setFormData({ ...formData, classAssignment: e.target.value })}
                placeholder="e.g., Grade 10A"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={registerStudent.isPending} className="w-full">
            {registerStudent.isPending ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
