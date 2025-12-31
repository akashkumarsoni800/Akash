import { useState } from 'react';
import { useGetAllApprovedStudents, useApproveStudent } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ApprovalStatus } from '../../backend';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

export default function StudentsManagement() {
  const { data: students, isLoading } = useGetAllApprovedStudents();
  const approveStudent = useApproveStudent();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students?.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.classAssignment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (studentId: bigint, status: ApprovalStatus) => {
    try {
      await approveStudent.mutateAsync({ studentId, status });
      toast.success(`Student ${status === ApprovalStatus.approved ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to update student status');
    }
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Students Management</CardTitle>
        <CardDescription>View and manage all student registrations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Note: Only approved students are currently displayed. Pending registrations management is being developed.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-2 text-sm text-muted-foreground">Loading students...</p>
          </div>
        ) : filteredStudents && filteredStudents.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id.toString()}>
                    <TableCell className="font-medium">{student.id.toString()}</TableCell>
                    <TableCell>{student.fullName}</TableCell>
                    <TableCell>{student.guardianName}</TableCell>
                    <TableCell>{student.contactNumber}</TableCell>
                    <TableCell>{student.classAssignment}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'approved' ? 'default' : 'secondary'}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(student.registrationTime)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No students found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
