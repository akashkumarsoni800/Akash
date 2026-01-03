import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // ✅ Supabase Import
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { BookOpen, Users, LogOut, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);

  // 1. Data Fetching from Supabase
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Profile aur Teacher details ek saath layein
          const { data: teacher, error } = await supabase
            .from('teachers')
            .select('*')
            .eq('auth_id', user.id)
            .single();
          
          if (error) throw error;
          setTeacherProfile(teacher);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  // 2. Logout Function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("adarsh_school_login");
    toast.success("Logged out successfully");
    navigate('/login');
  };

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome, {teacherProfile?.full_name || 'Teacher'} 👋
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      {!teacherProfile ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Teacher profile not found. Please contact Admin.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            
            {/* Card 1: Subject */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Subject</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teacherProfile.subject}</div>
                <p className="text-xs text-muted-foreground">Primary Subject</p>
              </CardContent>
            </Card>

            {/* Card 2: Upload Marks (Actionable) */}
            <Card 
              className="cursor-pointer hover:border-blue-500 transition-colors border-2"
              onClick={() => navigate('/admin/upload-result')} // 👈 Yahan redirection hai
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Upload Marks</CardTitle>
                <Upload className="h-4 w-4 text-blue-700" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Action</div>
                <p className="text-xs text-muted-foreground">Click to enter student marks</p>
              </CardContent>
            </Card>

            {/* Card 3: Contact */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contact Info</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{teacherProfile.email}</div>
                <p className="text-xs text-muted-foreground">{teacherProfile.phone}</p>
              </CardContent>
            </Card>
          </div>

          {/* Details Section */}
          <div className="grid gap-6 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your daily tasks</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200 flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span>
                      Attendance and Class Management features are coming soon. 
                      Currently, please use the <b>Upload Marks</b> section.
                    </span>
                 </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
