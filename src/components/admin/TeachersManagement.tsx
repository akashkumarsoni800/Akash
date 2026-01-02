import { useState } from 'react';
import { useRegisterTeacher } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

export default function TeachersManagement() {
  const registerTeacher = useRegisterTeacher();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
    subjects: '',
    classes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.contactNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    const subjects = formData.subjects.split(',').map(s => s.trim()).filter(s => s);
    const classes = formData.classes.split(',').map(c => c.trim()).filter(c => c);

    try {
      await registerTeacher.mutateAsync({
        fullName: formData.fullName,
        contactNumber: formData.contactNumber,
        subjects,
        classes,
      });
      toast.success('Teacher registered successfully');
      setOpen(false);
      setFormData({ fullName: '', contactNumber: '', subjects: '', classes: '' });
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register teacher');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Teachers Management</CardTitle>
            <CardDescription>Add and manage teaching staff</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Teacher</DialogTitle>
                <DialogDescription>Add a new teacher to the system</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter teacher's full name"
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
                  <Label htmlFor="subjects">Subjects (comma-separated)</Label>
                  <Input
                    id="subjects"
                    value={formData.subjects}
                    onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                    placeholder="e.g., Mathematics, Physics, Chemistry"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classes">Classes (comma-separated)</Label>
                  <Input
                    id="classes"
                    value={formData.classes}
                    onChange={(e) => setFormData({ ...formData, classes: e.target.value })}
                    placeholder="e.g., Grade 10A, Grade 11B"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={registerTeacher.isPending}>
                    {registerTeacher.isPending ? 'Registering...' : 'Register Teacher'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Teacher listing and management features are being developed. Teachers can be registered but the list view is not yet available.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
