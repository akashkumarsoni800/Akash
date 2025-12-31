import { useListApprovals, useSetApproval } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ApprovalStatus } from '../../backend';

export default function ApprovalsManagement() {
  const { data: approvals, isLoading } = useListApprovals();
  const setApproval = useSetApproval();

  const handleApproval = async (principal: string, status: ApprovalStatus) => {
    try {
      await setApproval.mutateAsync({
        user: principal as any,
        status,
      });
      toast.success(`User ${status === ApprovalStatus.approved ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to update approval status');
    }
  };

  const pendingApprovals = approvals?.filter(a => a.status === 'pending') || [];
  const processedApprovals = approvals?.filter(a => a.status !== 'pending') || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>Review and approve user access requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-2 text-sm text-muted-foreground">Loading approvals...</p>
            </div>
          ) : pendingApprovals.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Principal ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((approval) => (
                    <TableRow key={approval.principal.toString()}>
                      <TableCell className="font-mono text-xs">{approval.principal.toString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{approval.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => handleApproval(approval.principal.toString(), ApprovalStatus.approved)}
                            disabled={setApproval.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={() => handleApproval(approval.principal.toString(), ApprovalStatus.rejected)}
                            disabled={setApproval.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No pending approvals</p>
            </div>
          )}
        </CardContent>
      </Card>

      {processedApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Approvals</CardTitle>
            <CardDescription>Previously reviewed access requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Principal ID</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedApprovals.map((approval) => (
                    <TableRow key={approval.principal.toString()}>
                      <TableCell className="font-mono text-xs">{approval.principal.toString()}</TableCell>
                      <TableCell>
                        <Badge variant={approval.status === 'approved' ? 'default' : 'destructive'}>
                          {approval.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
