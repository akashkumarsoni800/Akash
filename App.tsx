import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerUserRole } from './hooks/useQueries';
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { UserRole } from './backend';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: userRole, isLoading: roleLoading } = useGetCallerUserRole();

  const isAuthenticated = !!identity;

  // Show loading state while initializing
  if (isInitializing || (isAuthenticated && (profileLoading || roleLoading))) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Not authenticated - show login page
  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <LoginPage />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Authenticated but no profile - show profile setup
  const showProfileSetup = isAuthenticated && profileFetched && userProfile === null;
  if (showProfileSetup) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <ProfileSetupPage />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Authenticated with profile - show appropriate dashboard
  const isAdmin = userRole === UserRole.admin;
  const userType = userProfile?.userType || '';

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {isAdmin || userType === 'admin' ? (
        <AdminDashboard />
      ) : userType === 'teacher' ? (
        <TeacherDashboard />
      ) : userType === 'student' ? (
        <StudentDashboard />
      ) : (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-2">Access Pending</h2>
            <p className="text-muted-foreground">
              Your account is being set up. Please contact the administrator for access.
            </p>
          </div>
        </div>
      )}
      <Toaster />
    </ThemeProvider>
  );
}
