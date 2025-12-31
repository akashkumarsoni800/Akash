import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { GraduationCap, Users, BookOpen, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/assets/generated/education-icon-transparent.dim_64x64.png" alt="SMS Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">School Management System</h1>
              <p className="text-xs text-muted-foreground">Excellence in Education</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Side - Hero */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                Streamline Your School Operations
              </h2>
              <p className="text-lg text-muted-foreground">
                A comprehensive platform for managing students, teachers, attendance, exams, and results with role-based access control.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Secure Access</h3>
                  <p className="text-xs text-muted-foreground">Role-based authentication</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">User Management</h3>
                  <p className="text-xs text-muted-foreground">Students & teachers</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Exam Management</h3>
                  <p className="text-xs text-muted-foreground">Results & grading</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <GraduationCap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Track Progress</h3>
                  <p className="text-xs text-muted-foreground">Real-time insights</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <img 
                src="/assets/generated/school-building.dim_800x400.jpg" 
                alt="School Building" 
                className="rounded-xl shadow-lg w-full"
              />
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md shadow-xl">
              <CardHeader className="space-y-3 text-center">
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to access your dashboard and manage school operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Button
                    onClick={login}
                    disabled={isLoggingIn}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {isLoggingIn ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In with Internet Identity'
                    )}
                  </Button>

                  <div className="text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Secure authentication powered by Internet Computer
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Access Levels:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <span className="font-medium">Admin:</span> Full system access</li>
                      <li>• <span className="font-medium">Teacher:</span> Class & exam management</li>
                      <li>• <span className="font-medium">Student:</span> View grades & attendance</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© 2025. Built with ❤️ using <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">caffeine.ai</a></p>
        </div>
      </footer>
    </div>
  );
}
