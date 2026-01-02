import { useState } from 'react';
import { useAddExam } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

export default function ExamsManagement() {
  const addExam = useAddExam();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    examDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject || !formData.examDate) {
      toast.error('Please fill in all fields');
      return;
    }

    const examDateTimestamp = BigInt(new Date(formData.examDate).getTime() * 1000000);

    try {
      await addExam.mutateAsync({
        subject: formData.subject,
        examDate: examDateTimestamp,
      });
      toast.success('Exam scheduled successfully');
      setOpen(false);
      setFormData({ subject: '', examDate: '' });
    } catch (error) {
      console.error('Exam creation error:', error);
      toast.error('Failed to schedule exam');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Exams Management</CardTitle>
            <CardDescription>Schedule and manage examinations</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Exam</DialogTitle>
                <DialogDescription>Create a new examination</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Enter subject name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examDate">Exam Date *</Label>
                  <Input
                    id="examDate"
                    type="date"
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addExam.isPending}>
                    {addExam.isPending ? 'Scheduling...' : 'Schedule Exam'}
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
            Exam listing and marks entry features are being developed. Exams can be scheduled but additional management features are not yet available.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
