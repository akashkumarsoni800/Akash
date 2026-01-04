import React, { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "../supabaseClient";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // --- STATE (Data yahan store hoga) ---
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [counts, setCounts] = useState({ students: 0, teachers: 0 });

  // --- DATA FETCHING (useEffect - Sabse Safe Tarika) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Get Current User Profile (Dummy for now to prevent crash)
        // Agar database me profile nahi hai, tab bhi ye chalega
        setProfile({ name: "Admin User", email: "admin@school.com" });

        // 2. Fetch Pending Students
        const { data: pendingData } = await supabase
          .from('students')
          .select('*')
          .eq('approval_status', 'pending');
        
        if (pendingData) setPendingStudents(pendingData);

        // 3. Count Total Students
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('approval_status', 'approved');

        // 4. Count Total Teachers
        const { count: teacherCount } = await supabase
          .from('teachers')
          .select('*', { count: 'exact', head: true });

        setCounts({ 
          students: studentCount || 0, 
          teachers: teacherCount || 0 
        });

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- ACTIONS ---
  const handleApprove = async (id: any) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ approval_status: 'approved' })
        .eq('id', id);

      if (error) throw error;

      toast.success("Student Approved! ✅");
      // List refresh karo
      setPendingStudents(prev => prev.filter(s => s.id !== id));
      setCounts(prev => ({ ...prev, students: prev.students + 1 }));

    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("adarsh_school_login"); 
    await supabase.auth.signOut(); 
    window.location.href = "/"; 
  };

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
         <div className="text-xl text-blue-900 font-bold animate-pulse">
           🔄 Starting Dashboard...
         </div>
      </div>
    );
  }

  // --- MAIN DESIGN ---
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Navbar */}
      <nav className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold">Adarsh Shishu Mandir</h1>
          <p className="text-xs text-blue-200">Welcome, {profile?.name}</p>
        </div>
        <button 
          onClick={handleLogout} 
          className="bg-red-500 px-3 py-1 rounded text-xs font-bold hover:bg-red-600 transition"
        >
          Logout
        </button>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">

        {/* Pending Approvals Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8 border-t-4 border-orange-500">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            🔔 Pending Admissions
            {pendingStudents.length > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {pendingStudents.length} New
              </span>
            )}
          </h2>

          {pendingStudents.length === 0 ? (
            <p className="text-gray-500 italic bg-gray-50 p-4 rounded text-center">
              ✅ No pending requests found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse
