import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useListApprovals } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Users, GraduationCap, BookOpen, ClipboardCheck, Bell } from 'lucide-react';
import StudentsManagement from '../components/admin/StudentsManagement';
import TeachersManagement from '../components/admin/TeachersManagement';
import ExamsManagement from '../components/admin/ExamsManagement';
import ApprovalsManagement from '../components/admin/ApprovalsManagement';

export default function AdminDashboard() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: approvals } = useListApprovals();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const pendingApprovals = approvals?.filter(a => a.status === 'pending').length || 0;

  return (
    <DashboardLayout
      userName={userProfile?.name || 'Administrator'}
      userRole="Administrator"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage all school operations and users</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger value="teachers" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Teachers</span>
            </TabsTrigger>
            <TabsTrigger value="exams" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Exams</span>
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-2 relative">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Approvals</span>
              {pendingApprovals > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {pendingApprovals}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">Approved students</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">Active teachers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingApprovals}</div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">Scheduled exams</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    onClick={() => setActiveTab('students')}
                    className="w-full text-left px-4 py-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">Manage Students</div>
                    <div className="text-sm text-muted-foreground">View and approve student registrations</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('teachers')}
                    className="w-full text-left px-4 py-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">Manage Teachers</div>
                    <div className="text-sm text-muted-foreground">Add and assign teachers to classes</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('exams')}
                    className="w-full text-left px-4 py-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">Schedule Exams</div>
                    <div className="text-sm text-muted-foreground">Create and manage examinations</div>
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Status</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Backend Connection</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Updated</span>
                    <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students">
            <StudentsManagement />
          </TabsContent>

          <TabsContent value="teachers">
            <TeachersManagement />
          </TabsContent>

          <TabsContent value="exams">
            <ExamsManagement />
          </TabsContent>

          <TabsContent value="approvals">
            <ApprovalsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
